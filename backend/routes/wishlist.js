// routes/wishlist.js
const express = require('express');
const router = express.Router();
const { Wishlist, Product, User } = require('../models');
const auth = require('../middleware/auth');

// Get user's wishlist
router.get('/', auth, async (req, res) => {
  try {
    const wishlist = await Wishlist.findAll({
      where: { userId: req.user.userId },
      include: [{
        model: Product,
        include: [Category, Brand]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to wishlist
router.post('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const existingWishlist = await Wishlist.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (existingWishlist) {
      return res.status(400).json({ message: 'Product already in wishlist' });
    }

    const wishlist = await Wishlist.create({
      userId: req.user.userId,
      productId
    });

    const wishlistWithProduct = await Wishlist.findByPk(wishlist.id, {
      include: [Product]
    });

    res.status(201).json(wishlistWithProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from wishlist
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (!wishlist) {
      return res.status(404).json({ message: 'Product not found in wishlist' });
    }

    await wishlist.destroy();
    res.json({ message: 'Product removed from wishlist' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear wishlist
router.delete('/', auth, async (req, res) => {
  try {
    await Wishlist.destroy({
      where: { userId: req.user.userId }
    });

    res.json({ message: 'Wishlist cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;