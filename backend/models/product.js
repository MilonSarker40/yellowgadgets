module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    shortDescription: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2)
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    image: {
      type: DataTypes.STRING
    },
    images: {
      type: DataTypes.JSON
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sku: {
      type: DataTypes.STRING,
      unique: true
    },
    features: {
      type: DataTypes.JSON
    },
    specifications: {
      type: DataTypes.JSON
    },
    tags: {
      type: DataTypes.JSON
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isBestSelling: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isNew: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isTodaysDeal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    warranty: {
      type: DataTypes.STRING
    },
    brandId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    weight: {
      type: DataTypes.DECIMAL(8, 2)
    },
    dimensions: {
      type: DataTypes.STRING
    },
    metaTitle: {
      type: DataTypes.STRING
    },
    metaDescription: {
      type: DataTypes.TEXT
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    soldCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  });

  return Product;
};