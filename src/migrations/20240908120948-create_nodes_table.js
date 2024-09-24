'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dt_nodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tree_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dt_decisiontrees',
          key: 'id',
        },
        allowNull: false
      },
      node_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      expected_value: {
        type: Sequelize.DECIMAL(10,2),
        defaultValue: 0
      },
      node_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      probability: {
        type: Sequelize.DECIMAL(5,4),
        defaultValue: null
      },
      description: {
        type: Sequelize.STRING
      },
      parent_node_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'dt_nodes',
          key: 'id',
        },
        onDelete: 'CASCADE',
        allowNull: true     // Allowed for root node
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, /* Sequelize */) {
    await queryInterface.dropTable('dt_nodes');
  }
};