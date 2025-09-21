// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Undergraduation CRM Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Undergraduation CRM API',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Import and use routes
try {
  // Auth routes
  const { router: authRouter } = require('./routes/auth');
  app.use('/api/auth', authRouter);
  console.log('✅ Auth routes loaded successfully');

  // Students routes
  const studentsRouter = require('./routes/students');
  app.use('/api/students', studentsRouter);
  console.log('✅ Students routes loaded successfully');

} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  process.exit(1);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});



// Start server
app.listen(PORT, () => {
  console.log('\n🚀 Server Configuration:');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? '✅ Configured' : '❌ Missing'}`);
  console.log('\n📚 Available Endpoints:');
  console.log(`   GET  ${PORT === 5000 ? 'http://localhost:5000' : `http://localhost:${PORT}`}/api/health`);
  console.log(`   POST ${PORT === 5000 ? 'http://localhost:5000' : `http://localhost:${PORT}`}/api/auth/login`);
  console.log(`   GET  ${PORT === 5000 ? 'http://localhost:5000' : `http://localhost:${PORT}`}/api/students`);
  console.log('\n🔐 Authentication Required for /api/students endpoints');
  console.log('📧 Demo Login: admin@undergraduation.com / admin123\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Shutting down gracefully...');
  process.exit(0);
});

module.exports = app;