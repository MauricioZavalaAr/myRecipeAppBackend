const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');

// Middleware for error handling
const errorHandler = (err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error' });
};

router.use(errorHandler);
// Registration route
router.post('/register', [
  check('username').notEmpty().withMessage('Username is required'),
  check('email').isEmail().withMessage('Invalid email format'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));

  const user = new User({ username, email, password: hashedPassword });
  await user.save();

  res.status(201).json({ message: 'User created successfully' });
}));

// Login route
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRATION });

  res.status(200).json({
    token,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email
    }
  });
}));
router.post('/update', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword, confirmNewPassword, newName } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Cambio de contraseña
    if (currentPassword && newPassword && confirmNewPassword) {
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New passwords do not match.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect.' });
      }
      user.password = await bcrypt.hash(newPassword, 12);
    }
    
    // Cambio de nombre de usuario
    if (newName && newName !== user.username) {
      user.username = newName;
    }

    await user.save();
    res.status(200).json({ message: 'User updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating user.' });
  }
});

const ObjectId = mongoose.Types.ObjectId;

router.patch('/favorites', async (req, res) => {
  try {
    const { userId, favoriteRecipes } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Asegúrate de que todos los IDs de las recetas sean convertidos a ObjectId
    user.favorites = favoriteRecipes.map(id => ObjectId(id));
    await user.save();
    res.status(200).json({ message: 'Favorite recipes updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating favorite recipes.' });
  }
});

router.get('/favorites/:userId', async (req, res) => {
  
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('favorites');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    
    // Convertir los ObjectId a strings antes de enviarlos
    const favorites = user.favorites.map(fav => fav._id.toString());
    res.status(200).json(favorites);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching favorite recipes.' });
  }
});

router.put('/add-favorite/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { recipeId } = req.body;
    
    console.log(`Adding favorite for user: ${userId} with recipeId: ${recipeId}`);

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Convierte el array de ObjectIds a un array de strings y verifica si recipeId ya está
    if (!user.favorites.map(fav => fav.toString()).includes(recipeId)) {
      user.favorites.push(recipeId); // Asume que recipeId ya es un string
      await user.save();
      res.status(200).json({ message: 'Recipe added to favorites.' });
    } else {
      res.status(400).json({ message: 'Recipe is already in favorites.' });
    }
  } catch (error) {
    console.error(error); // Log the error for server-side inspection
    res.status(500).json({ message: 'Error adding favorite' });  }
});

router.put('/remove-favorite/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { recipeId } = req.body;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Convierte el array de ObjectIds a un array de strings y filtra el recipeId
    user.favorites = user.favorites.filter(fav => fav.toString() !== recipeId);
    await user.save();
    res.status(200).json({ message: 'Favorite recipe removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing favorite recipe.' });
  }
});


module.exports = router;