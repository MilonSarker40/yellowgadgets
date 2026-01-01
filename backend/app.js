// app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const db = require('./models');

const app = express();

/* =====================
   Global Middleware
===================== */
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

/* =====================
   Static Files
===================== */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

/* =====================
   Health & Root Routes
===================== */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'YellowGadgets API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to YellowGadgets E-Commerce API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      products: '/api/products',
      categories: '/api/categories',
      brands: '/api/brands',
      cart: '/api/cart',
      wishlist: '/api/wishlist',
      orders: '/api/orders',
      admin: '/api/admin',
      coupons: '/api/coupons',
      deals: '/api/deals',
      reviews: '/api/reviews',
      search: '/api/search',
      comparisons: '/api/comparisons',
    },
  });
});

/* =====================
   Import Routes
===================== */
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const categoryRoutes = require('./routes/categories');
const brandRoutes = require('./routes/brands');
const cartRoutes = require('./routes/cart');
const wishlistRoutes = require('./routes/wishlist');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const couponRoutes = require('./routes/coupons');
const dealRoutes = require('./routes/deals');
const reviewRoutes = require('./routes/reviews');
const searchRoutes = require('./routes/search');
const comparisonRoutes = require('./routes/comparisons');

/* =====================
   Use Routes
===================== */
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/comparisons', comparisonRoutes);

/* =====================
   Error Handling
===================== */
app.use((error, req, res, next) => {
  console.error('❌ Error:', error);
  res.status(500).json({
    message: 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
    }),
  });
});

/* =====================
   404 Handler
===================== */
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

/* =====================
   Server Start
===================== */
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected successfully');

    await db.sequelize.sync({ force: false });
    console.log('✅ Database synchronized');

    app.listen(PORT, '0.0.0.0', () => {
      console.log('='.repeat(50));
      console.log('🚀 YellowGadgets E-Commerce API');
      console.log('='.repeat(50));
      console.log(`📍 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Local: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
