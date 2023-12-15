const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    if (!token) throw new Error('Authentication failed!');

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decodedToken.id; // Add user ID to request
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

module.exports = verifyToken;