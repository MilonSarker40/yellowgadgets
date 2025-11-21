// routes/search.js
const express = require('express');
const router = express.Router();
const { Product, Category, Brand } = require('../models');
const { Op } = require('sequelize');

// Global search
router.get('/', async (req, res) => {
  try {
    const { q, category, brand, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;
    
    const where = { isActive: true };
    const include = [];
    
    // Search term
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { description: { [Op.iLike]: `%${q}%` } },
        { tags: { [Op.contains]: [q] } }
      ];
    }
    
    // Price filter
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    
    // Category filter
    if (category) {
      include.push({
        model: Category,
        where: { id: category, isActive: true },
        required: true
      });
    }
    
    // Brand filter
    if (brand) {
      include.push({
        model: Brand,
        where: { id: brand, isActive: true },
        required: true
      });
    }
    
    // Sorting
    let order = [];
    switch (sort) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'name':
        order = [['name', 'ASC']];
        break;
      case 'rating':
        order = [['averageRating', 'DESC']];
        break;
      case 'latest':
        order = [['createdAt', 'DESC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }
    
    const offset = (page - 1) * limit;
    
    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalProducts: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Advanced search with filters
router.get('/advanced', async (req, res) => {
  try {
    const { categories, brands, features, ratings, inStock } = req.query;
    
    const where = { isActive: true };
    
    // Categories filter
    if (categories) {
      const categoryIds = categories.split(',').map(id => parseInt(id));
      where.categoryId = { [Op.in]: categoryIds };
    }
    
    // Brands filter
    if (brands) {
      const brandIds = brands.split(',').map(id => parseInt(id));
      where.brandId = { [Op.in]: brandIds };
    }
    
    // Ratings filter
    if (ratings) {
      const ratingValues = ratings.split(',').map(r => parseFloat(r));
      where.averageRating = { [Op.in]: ratingValues };
    }
    
    // Stock filter
    if (inStock === 'true') {
      where.stock = { [Op.gt]: 0 };
    }
    
    const products = await Product.findAll({
      where,
      include: [Category, Brand],
      order: [['averageRating', 'DESC']]
    });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;