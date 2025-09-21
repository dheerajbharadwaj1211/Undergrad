// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login attempt:', email); // Debug log
    
    // Simple credential check (in production, use proper authentication)
    if (email === 'admin@undergraduation.com' && password === 'admin123') {
      const token = jwt.sign(
        { 
          email, 
          role: 'admin',
          userId: 'admin_001'
        },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );
      
      console.log('Login successful for:', email); // Debug log
      
      res.json({
        success: true,
        token,
        user: { 
          email, 
          role: 'admin',
          name: 'Admin User'
        }
      });
    } else {
      console.log('Invalid credentials for:', email); // Debug log
      res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login'
    });
  }
});

// Middleware to verify JWT tokens
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No token provided'); // Debug log
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message); // Debug log
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }
    
    console.log('Token verified for user:', user.email); // Debug log
    req.user = user;
    next();
  });
};

// Route to verify if token is valid
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user,
    message: 'Token is valid'
  });
});

// Logout endpoint (optional - mainly for logging)
router.post('/logout', authenticateToken, (req, res) => {
  console.log('User logged out:', req.user.email); // Debug log
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = { router, authenticateToken };