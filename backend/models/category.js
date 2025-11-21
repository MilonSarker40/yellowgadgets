module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT
    },
    image: {
      type: DataTypes.STRING
    },
    parentId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    slug: {
      type: DataTypes.STRING,
      unique: true
    },
    metaTitle: {
      type: DataTypes.STRING
    },
    metaDescription: {
      type: DataTypes.TEXT
    }
  }, {
    timestamps: true,
    tableName: 'categories' // Explicit table name
  });

  return Category;
};