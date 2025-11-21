// routes/comparisons.js
const express = require('express');
const router = express.Router();
const { Comparison, Product, User } = require('../models');
const auth = require('../middleware/auth');

// Get user's comparisons
router.get('/', auth, async (req, res) => {
  try {
    const comparisons = await Comparison.findAll({
      where: { userId: req.user.userId },
      include: [{
        model: Product,
        through: { attributes: [] }
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(comparisons);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create comparison
router.post('/', auth, async (req, res) => {
  try {
    const { name, productIds } = req.body;

    if (!productIds || productIds.length < 2) {
      return res.status(400).json({ message: 'At least 2 products required for comparison' });
    }

    if (productIds.length > 4) {
      return res.status(400).json({ message: 'Maximum 4 products allowed for comparison' });
    }

    // Verify all products exist
    const products = await Product.findAll({
      where: { id: productIds, isActive: true }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ message: 'One or more products not found' });
    }

    const comparison = await Comparison.create({
      name: name || `Comparison ${Date.now()}`,
      userId: req.user.userId
    });

    await comparison.addProducts(productIds);

    const comparisonWithProducts = await Comparison.findByPk(comparison.id, {
      include: [Product]
    });

    res.status(201).json(comparisonWithProducts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get comparison by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const comparison = await Comparison.findByPk(req.params.id, {
      include: [Product]
    });

    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    if (comparison.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(comparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add product to comparison
router.post('/:id/products/:productId', auth, async (req, res) => {
  try {
    const { id, productId } = req.params;

    const comparison = await Comparison.findByPk(id);
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    if (comparison.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product already in comparison
    const existingProducts = await comparison.getProducts();
    if (existingProducts.some(p => p.id === parseInt(productId))) {
      return res.status(400).json({ message: 'Product already in comparison' });
    }

    if (existingProducts.length >= 4) {
      return res.status(400).json({ message: 'Maximum 4 products allowed for comparison' });
    }

    await comparison.addProduct(product);

    const updatedComparison = await Comparison.findByPk(id, {
      include: [Product]
    });

    res.json(updatedComparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove product from comparison
router.delete('/:id/products/:productId', auth, async (req, res) => {
  try {
    const { id, productId } = req.params;

    const comparison = await Comparison.findByPk(id);
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    if (comparison.userId !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await comparison.removeProduct(productId);

    const updatedComparison = await Comparison.findByPk(id, {
      include: [Product]
    });

    res.json(updatedComparison);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete comparison
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const comparison = await Comparison.findByPk(id);
    if (!comparison) {
      return res.status(404).json({ message: 'Comparison not found' });
    }

    if (comparison.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await comparison.destroy();
    res.json({ message: 'Comparison deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;