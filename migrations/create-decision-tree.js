'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('dt_decisiontrees', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tree_name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      creator_email: {
        type: Sequelize.STRING,
        references: {
          model: 'dt_users',
          key: 'email',
        },
        allowNull: false
      },
      description: {
        type: Sequelize.STRING
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
    await queryInterface.dropTable('dt_decisiontrees');
  }
};