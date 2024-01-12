const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const recipeRoutes = require('./routes/recipes');
const userRoutes = require('./routes/user');
require('dotenv').config();

const app = express();

// Configure CORS to allow requests from your frontend domain
app.use(cors({
  origin: '*', // Replace with your frontend's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
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
  console.error(err);
  res.status(500).send('An error occurred!');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});