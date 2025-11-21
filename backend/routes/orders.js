// routes/orders.js
const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User, Coupon } = require('../models');
const auth = require('../middleware/auth');

// Create order
router.post('/', auth, async (req, res) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;
    
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({ 
        where: { 
          code: couponCode,
          isActive: true,
          validFrom: { [Op.lte]: new Date() },
          validUntil: { [Op.gte]: new Date() }
        }
      });
      
      if (!coupon) {
        return res.status(400).json({ message: 'Invalid coupon code' });
      }
      
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
        return res.status(400).json({ message: 'Coupon usage limit exceeded' });
      }
    }

    // Calculate totals
    let totalAmount = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findByPk(item.productId);
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productId} not found` });
      }
      
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal
      });
    }

    // Apply coupon discount
    let discountAmount = 0;
    if (coupon) {
      if (coupon.discountType === 'percentage') {
        discountAmount = (totalAmount * coupon.discountValue) / 100;
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }
      
      await coupon.update({ usedCount: coupon.usedCount + 1 });
    }

    const shippingAmount = 0; // Calculate based on shipping method
    const taxAmount = totalAmount * 0.1; // Example 10% tax
    const finalAmount = totalAmount - discountAmount + shippingAmount + taxAmount;

    // Create order
    const order = await Order.create({
      userId: req.user.userId,
      orderNumber: 'ORD' + Date.now(),
      totalAmount,
      discountAmount,
      shippingAmount,
      taxAmount,
      finalAmount,
      paymentMethod,
      shippingAddress,
      billingAddress,
      couponId: coupon ? coupon.id : null,
      status: 'pending'
    });

    // Create order items and update product stock
    for (const item of orderItems) {
      await OrderItem.create({
        ...item,
        orderId: order.id
      });
      
      const product = await Product.findByPk(item.productId);
      await product.update({
        stock: product.stock - item.quantity,
        soldCount: product.soldCount + item.quantity
      });
    }

    const createdOrder = await Order.findByPk(order.id, {
      include: [OrderItem, Coupon]
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user orders
router.get('/my-orders', auth, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.userId },
      include: [OrderItem, Coupon],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get order by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          include: [Product]
        },
        Coupon
      ]
    });
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Check if user owns the order or is admin
    if (order.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status (Admin only)
router.put('/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status: req.body.status });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;