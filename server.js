const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Make sure you have installed the CORS package

const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/user');
require('dotenv').config();

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*', // Allows all origins
  methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT', 'PATCH'], // Allows these methods
  credentials: true // Allows credentials (cookies, authorization headers, etc.)
}));

app.use(express.json()); // for parsing application/json

app.use('/user', userRoutes);
app.use('/recipes', recipeRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Error connecting to MongoDB:', err));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('An error occurred!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});