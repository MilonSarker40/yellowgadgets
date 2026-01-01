// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const db = require('./models');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic routes for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'YellowGadgets API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to YellowGadgets E-Commerce API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      products: '/api/products',
      auth: '/api/auth'
    }
  });
});

// Import and use routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes loaded');
} catch (error) {
  console.log('⚠️  Auth routes not available yet');
}

try {
  const productRoutes = require('./routes/products');
  app.use('/api/products', productRoutes);
  console.log('✅ Product routes loaded');
} catch (error) {
  console.log('⚠️  Product routes not available yet');
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { error: error.message })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    // IMPORTANT: Use force: false to prevent table drops and foreign key issues
    await db.sequelize.sync({ force: false });
    console.log('✅ Database synchronized');

    // Start the server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🚀 YellowGadgets E-Commerce API');
      console.log('='.repeat(50));
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'yellowgadgets_dev'}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    
    // More detailed error information
    if (error.name === 'SequelizeDatabaseError') {
      console.error('📋 Database Error Details:');
      console.error(`   Code: ${error.parent?.code}`);
      console.error(`   Message: ${error.parent?.sqlMessage}`);
    }
    
    process.exit(1);
  }
};

startServer();

module.exports = app;