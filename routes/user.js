const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const mongoose = require('mongoose');

// Registration route
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input Validation (very basic example, consider using a library like express-validator)
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Email format validation (basic regex, consider a more robust solution)
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Password complexity (example, consider using a library for this)
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user
    const user = new User({ username, email, password: hashedPassword });
    await user.save();

    // Respond with a message rather than the user object for security
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error); // Log the error for server-side inspection
    res.status(500).json({ message: 'Error registering new user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({
      token,
      user: {
        _id: user._id, // Include _id in the response
        username: user.username,
        email: user.email// optionally include other user details
      }});
  } catch (error) {
    console.error(error); // Log the error for server-side inspection
    res.status(500).json({ message: 'Error registering new user' });
  }
});
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
  console.log(`Attempting to add favorite. UserID: ${req.params.userId}, RecipeID: ${req.body.recipeId}`);
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

router.post('/add-favorite/:userId', async (req, res) => {
  const { userId } = req.params;
  const { recipeId } = req.body;
  console.log(`Attempting to add favorite. UserID: ${req.params.userId}, RecipeID: ${req.body.recipeId}`);

  try {
    // Fetch the user from the database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the recipe is already in the user's favorites
    if (user.favorites.includes(recipeId)) { // Assuming recipeId is a string
      return res.status(400).json({ message: 'Recipe is already in favorites' });
    }

    // Add the recipe to the user's favorites
    user.favorites.push(recipeId); // Directly use recipeId as a string
    await user.save();

    res.status(200).json({ message: 'Recipe added to favorites successfully' });
  } catch (error) {
    console.error('Error adding favorite:', error);
    res.status(500).json({ message: `Error adding favorite: ${error.message}` });
  }
});

router.put('/remove-favorite/:userId', async (req, res) => {
  const { userId } = req.params;
  const { recipeId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Remover de favoritos
    user.favorites = user.favorites.filter(fav => fav.toString() !== recipeId);
    await user.save();

    res.status(200).json({ message: 'Favorite recipe removed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error removing favorite recipe.' });
  }
});


module.exports = router;