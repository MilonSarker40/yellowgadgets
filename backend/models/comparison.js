module.exports = (sequelize, DataTypes) => {
  const Comparison = sequelize.define('Comparison', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING
    }
  });

  return Comparison;
};