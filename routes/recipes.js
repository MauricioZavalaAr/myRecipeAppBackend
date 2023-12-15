const express = require('express');
const Recipe = require('../models/Recipe');
const router = express.Router();

// Middleware to verify a token
const verifyToken = require('../middleware/verifyToken');

// Save a recipe
router.post('/', verifyToken, async (req, res) => {
  const { title, ingredients, ...otherDetails } = req.body;

  try {
    const newRecipe = new Recipe({
      userId: req.userId, // Set from verifyToken middleware
      title,
      ingredients,
      ...otherDetails
    });

    await newRecipe.save();
    res.status(201).json(newRecipe);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get recipes for a user
router.get('/', verifyToken, async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.userId });
    res.status(200).json(recipes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;