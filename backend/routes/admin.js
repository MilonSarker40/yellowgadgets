// routes/admin.js
const express = require('express');
const router = express.Router();
const { 
  User, 
  Product, 
  Order, 
  Category, 
  Brand, 
  Review, 
  Coupon,
  TodaysDeal,
  sequelize 
} = require('../models');
const auth = require('../middleware/auth');

// Admin middleware
const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Dashboard statistics
router.get('/dashboard', auth, adminAuth, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Total statistics
    const totalUsers = await User.count();
    const totalProducts = await Product.count();
    const totalOrders = await Order.count();
    const totalRevenue = await Order.sum('finalAmount', { 
      where: { paymentStatus: 'paid' } 
    });

    // Today's statistics
    const todayOrders = await Order.count({
      where: { createdAt: { [Op.gte]: startOfDay } }
    });
    const todayRevenue = await Order.sum('finalAmount', {
      where: { 
        createdAt: { [Op.gte]: startOfDay },
        paymentStatus: 'paid'
      }
    });

    // Monthly statistics
    const monthlyOrders = await Order.count({
      where: { createdAt: { [Op.gte]: startOfMonth } }
    });
    const monthlyRevenue = await Order.sum('finalAmount', {
      where: { 
        createdAt: { [Op.gte]: startOfMonth },
        paymentStatus: 'paid'
      }
    });

    // Recent orders
    const recentOrders = await Order.findAll({
      include: [User],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Low stock products
    const lowStockProducts = await Product.findAll({
      where: { stock: { [Op.lte]: 10 } },
      order: [['stock', 'ASC']],
      limit: 10
    });

    res.json({
      overview: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue || 0,
        todayOrders,
        todayRevenue: todayRevenue || 0,
        monthlyOrders,
        monthlyRevenue: monthlyRevenue || 0
      },
      recentOrders,
      lowStockProducts
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// User management
router.get('/users', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalUsers: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user role
router.put('/users/:id/role', auth, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ role });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Order management
router.get('/orders', auth, adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [User],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalOrders: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Sales analytics
router.get('/analytics/sales', auth, adminAuth, async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year
    
    let groupBy, dateFormat;
    switch (period) {
      case 'day':
        groupBy = 'DATE(createdAt)';
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupBy = 'YEARWEEK(createdAt)';
        dateFormat = '%Y-%u';
        break;
      case 'month':
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        dateFormat = '%Y-%m';
        break;
      case 'year':
        groupBy = 'YEAR(createdAt)';
        dateFormat = '%Y';
        break;
      default:
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        dateFormat = '%Y-%m';
    }

    const salesData = await Order.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('finalAmount')), 'revenue']
      ],
      where: {
        paymentStatus: 'paid',
        createdAt: {
          [Op.gte]: sequelize.literal('DATE_SUB(NOW(), INTERVAL 1 YEAR)')
        }
      },
      group: [sequelize.literal(groupBy)],
      order: [[sequelize.literal('period'), 'ASC']],
      raw: true
    });

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;