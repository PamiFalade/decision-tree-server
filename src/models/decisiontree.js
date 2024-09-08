'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DecisionTree extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      DecisionTree.belongsTo(models.User, { targetKey: 'email', foreignKey: 'creator_email' });
    }
  }
  DecisionTree.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    tree_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    creator_email: {
      type: DataTypes.STRING,
      references: {
        model: 'dt_users',
        key: 'email',
      },
      allowNull: false
    },
    description: {
      type: DataTypes.STRING
    }
  }, {
    sequelize,
    modelName: 'DecisionTree',
    tableName: 'dt_decisiontrees',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return DecisionTree;
};