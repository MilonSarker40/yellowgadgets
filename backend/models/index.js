const { Sequelize, Op } = require('sequelize');
const config = require('../config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    dialect: dbConfig.dialect,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

// Import all models
db.User = require('./user')(sequelize, Sequelize);
db.Product = require('./product')(sequelize, Sequelize);
db.Category = require('./category')(sequelize, Sequelize);
db.Brand = require('./brand')(sequelize, Sequelize);
db.Order = require('./order')(sequelize, Sequelize);
db.OrderItem = require('./orderItem')(sequelize, Sequelize);
db.Wishlist = require('./wishlist')(sequelize, Sequelize);
db.Cart = require('./cart')(sequelize, Sequelize);
db.Review = require('./review')(sequelize, Sequelize);
db.Coupon = require('./coupon')(sequelize, Sequelize);
db.Comparison = require('./comparison')(sequelize, Sequelize);
db.TodaysDeal = require('./todaysDeal')(sequelize, Sequelize);

// Define associations

// User associations
db.User.hasMany(db.Order, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.User.hasMany(db.Wishlist, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.User.hasMany(db.Cart, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.User.hasMany(db.Review, { foreignKey: 'userId', onDelete: 'CASCADE' });
db.User.hasMany(db.Comparison, { foreignKey: 'userId', onDelete: 'CASCADE' });

db.Order.belongsTo(db.User, { foreignKey: 'userId' });
db.Wishlist.belongsTo(db.User, { foreignKey: 'userId' });
db.Cart.belongsTo(db.User, { foreignKey: 'userId' });
db.Review.belongsTo(db.User, { foreignKey: 'userId' });
db.Comparison.belongsTo(db.User, { foreignKey: 'userId' });

// Product associations
db.Product.belongsTo(db.Category, { foreignKey: 'categoryId' });
db.Product.belongsTo(db.Brand, { foreignKey: 'brandId' });
db.Product.hasMany(db.OrderItem, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Product.hasMany(db.Wishlist, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Product.hasMany(db.Cart, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Product.hasMany(db.Review, { foreignKey: 'productId', onDelete: 'CASCADE' });
db.Product.hasMany(db.TodaysDeal, { foreignKey: 'productId', onDelete: 'CASCADE' });

db.Category.hasMany(db.Product, { foreignKey: 'categoryId' });
db.Brand.hasMany(db.Product, { foreignKey: 'brandId' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'productId' });
db.Wishlist.belongsTo(db.Product, { foreignKey: 'productId' });
db.Cart.belongsTo(db.Product, { foreignKey: 'productId' });
db.Review.belongsTo(db.Product, { foreignKey: 'productId' });
db.TodaysDeal.belongsTo(db.Product, { foreignKey: 'productId' });

// Category associations (Self-referencing for subcategories)
db.Category.belongsTo(db.Category, { 
  as: 'parent', 
  foreignKey: 'parentId',
  onDelete: 'SET NULL'
});
db.Category.hasMany(db.Category, { 
  as: 'children', 
  foreignKey: 'parentId'
});

// Order associations
db.Order.hasMany(db.OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
db.Order.belongsTo(db.Coupon, { foreignKey: 'couponId' });

db.OrderItem.belongsTo(db.Order, { foreignKey: 'orderId' });
db.Coupon.hasMany(db.Order, { foreignKey: 'couponId' });

// Comparison associations (Many-to-Many with Product)
db.Comparison.belongsTo(db.User, { foreignKey: 'userId' });
db.Comparison.belongsToMany(db.Product, { 
  through: 'ComparisonProducts',
  foreignKey: 'comparisonId',
  otherKey: 'productId'
});
db.Product.belongsToMany(db.Comparison, {
  through: 'ComparisonProducts',
  foreignKey: 'productId',
  otherKey: 'comparisonId'
});

// Sync database with proper table name handling
db.syncDatabase = async (force = false) => {
  try {
    if (force) {
      console.log('🔄 Force syncing database - this will drop all tables!');
      await db.sequelize.drop();
      console.log('✅ All tables dropped');
    }
    
    // Sync without force to avoid foreign key issues
    await db.sequelize.sync();
    console.log('✅ Database synchronized successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Error syncing database:', error);
    throw error;
  }
};

// Authenticate database connection
db.authenticate = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

module.exports = db;