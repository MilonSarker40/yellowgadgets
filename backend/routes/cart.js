// routes/cart.js
const express = require('express');
const router = express.Router();
const { Cart, Product, Category, Brand } = require('../models');
const auth = require('../middleware/auth');

// Get user's cart
router.get('/', auth, async (req, res) => {
  try {
    const cart = await Cart.findAll({
      where: { userId: req.user.userId },
      include: [{
        model: Product,
        include: [Category, Brand]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Calculate totals
    let subtotal = 0;
    let totalItems = 0;

    cart.forEach(item => {
      subtotal += item.quantity * item.Product.price;
      totalItems += item.quantity;
    });

    res.json({
      items: cart,
      subtotal,
      totalItems,
      shipping: 0, // Calculate based on shipping rules
      tax: subtotal * 0.1, // Example 10% tax
      total: subtotal + (subtotal * 0.1)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to cart
router.post('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity = 1 } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    let cartItem = await Cart.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (cartItem) {
      // Update quantity if item already in cart
      const newQuantity = cartItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      await cartItem.update({ quantity: newQuantity });
    } else {
      // Create new cart item
      cartItem = await Cart.create({
        userId: req.user.userId,
        productId,
        quantity
      });
    }

    const cartItemWithProduct = await Cart.findByPk(cartItem.id, {
      include: [Product]
    });

    res.status(201).json(cartItemWithProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update cart item quantity
router.put('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    const cartItem = await Cart.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.update({ quantity });
    res.json(cartItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Remove from cart
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const cartItem = await Cart.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    await cartItem.destroy();
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Clear cart
router.delete('/', auth, async (req, res) => {
  try {
    await Cart.destroy({
      where: { userId: req.user.userId }
    });

    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;