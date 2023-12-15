const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

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

    res.status(200).json({ token });
  } catch (error) {
    console.error(error); // Log the error for server-side inspection
    res.status(500).json({ message: 'Error registering new user' });
  }
});

module.exports = router;