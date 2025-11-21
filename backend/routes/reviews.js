// routes/reviews.js
const express = require('express');
const router = express.Router();
const { Review, Product, User } = require('../models');
const auth = require('../middleware/auth');

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'latest' } = req.query;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    let order = [];
    switch (sort) {
      case 'latest':
        order = [['createdAt', 'DESC']];
        break;
      case 'oldest':
        order = [['createdAt', 'ASC']];
        break;
      case 'highest':
        order = [['rating', 'DESC']];
        break;
      case 'lowest':
        order = [['rating', 'ASC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const offset = (page - 1) * limit;

    const { count, rows: reviews } = await Review.findAndCountAll({
      where: { productId },
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }],
      order,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Calculate rating statistics
    const ratingStats = await Review.findAll({
      where: { productId },
      attributes: [
        'rating',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['rating'],
      raw: true
    });

    const totalReviews = count;
    const averageRating = product.averageRating;

    res.json({
      reviews,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      totalReviews,
      averageRating,
      ratingStats
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create review
router.post('/product/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, comment, images } = req.body;

    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      where: { userId: req.user.userId, productId }
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      userId: req.user.userId,
      productId,
      rating,
      comment,
      images
    });

    // Update product rating and review count
    const productReviews = await Review.findAll({
      where: { productId },
      attributes: ['rating']
    });

    const totalRating = productReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / productReviews.length;
    const reviewCount = productReviews.length;

    await product.update({
      averageRating: parseFloat(averageRating.toFixed(2)),
      reviewCount
    });

    const reviewWithUser = await Review.findByPk(review.id, {
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }]
    });

    res.status(201).json(reviewWithUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update review
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment, images } = req.body;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await review.update({
      rating: rating || review.rating,
      comment: comment || review.comment,
      images: images || review.images
    });

    // Update product rating if rating changed
    if (rating && rating !== review.rating) {
      const productReviews = await Review.findAll({
        where: { productId: review.productId },
        attributes: ['rating']
      });

      const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / productReviews.length;

      await Product.update({
        averageRating: parseFloat(averageRating.toFixed(2))
      }, { where: { id: review.productId } });
    }

    const updatedReview = await Review.findByPk(id, {
      include: [{
        model: User,
        attributes: ['id', 'firstName', 'lastName', 'avatar']
      }]
    });

    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete review
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (review.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const productId = review.productId;
    await review.destroy();

    // Update product rating and review count
    const productReviews = await Review.findAll({
      where: { productId },
      attributes: ['rating']
    });

    if (productReviews.length > 0) {
      const totalRating = productReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / productReviews.length;

      await Product.update({
        averageRating: parseFloat(averageRating.toFixed(2)),
        reviewCount: productReviews.length
      }, { where: { id: productId } });
    } else {
      await Product.update({
        averageRating: 0,
        reviewCount: 0
      }, { where: { id: productId } });
    }

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;