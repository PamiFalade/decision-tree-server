'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Node extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Node.belongsTo(models.DecisionTree, { foreignKey: 'tree_id' });

      Node.belongsTo(Node, { as: 'Parent', foreignKey: 'parent_node_id' });
      Node.hasMany(Node, { as: 'Children', foreignKey: 'parent_node_id' });
    }
  }
  Node.init({
    tree_id: DataTypes.INTEGER,
    node_name: DataTypes.STRING,
    expected_value: DataTypes.DECIMAL(10, 2),
    yield: DataTypes.DECIMAL(10, 2),
    node_type: DataTypes.STRING,
    probability: DataTypes.DECIMAL,
    description: DataTypes.STRING,
    parent_node_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Node',
    tableName: 'dt_nodes',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
  return Node;
};