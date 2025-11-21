// routes/deals.js
const express = require('express');
const router = express.Router();
const { TodaysDeal, Product } = require('../models');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// Get today's deals
router.get('/today', async (req, res) => {
  try {
    const now = new Date();
    
    const deals = await TodaysDeal.findAll({
      where: {
        isActive: true,
        startTime: { [Op.lte]: now },
        endTime: { [Op.gte]: now }
      },
      include: [{
        model: Product,
        where: { isActive: true }
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all deals (Admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deals = await TodaysDeal.findAll({
      include: [Product],
      order: [['createdAt', 'DESC']]
    });

    res.json(deals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create deal (Admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { productId, discount, startTime, endTime } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product already has an active deal
    const existingDeal = await TodaysDeal.findOne({
      where: {
        productId,
        isActive: true,
        [Op.or]: [
          {
            startTime: { [Op.lte]: endTime },
            endTime: { [Op.gte]: startTime }
          }
        ]
      }
    });

    if (existingDeal) {
      return res.status(400).json({ message: 'Product already has an active deal in this time period' });
    }

    const deal = await TodaysDeal.create({
      productId,
      discount,
      startTime,
      endTime
    });

    // Update product's isTodaysDeal status
    await product.update({ isTodaysDeal: true });

    const dealWithProduct = await TodaysDeal.findByPk(deal.id, {
      include: [Product]
    });

    res.status(201).json(dealWithProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update deal (Admin only)
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deal = await TodaysDeal.findByPk(req.params.id, {
      include: [Product]
    });

    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    await deal.update(req.body);

    const updatedDeal = await TodaysDeal.findByPk(deal.id, {
      include: [Product]
    });

    res.json(updatedDeal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete deal (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deal = await TodaysDeal.findByPk(req.params.id);
    if (!deal) {
      return res.status(404).json({ message: 'Deal not found' });
    }

    // Update product's isTodaysDeal status
    await Product.update(
      { isTodaysDeal: false },
      { where: { id: deal.productId } }
    );

    await deal.destroy();
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;