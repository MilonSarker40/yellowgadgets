module.exports = (sequelize, DataTypes) => {
  const TodaysDeal = sequelize.define('TodaysDeal', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    discount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  });

  return TodaysDeal;
};