const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  ingredients: [String],
  // Add other fields for recipe details
});

module.exports = mongoose.model('Recipe', recipeSchema);