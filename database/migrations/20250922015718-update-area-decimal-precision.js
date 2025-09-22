'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Increase decimal precision for totalArea and carbonCredits
    await queryInterface.changeColumn('areas', 'totalArea', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: false
    });

    await queryInterface.changeColumn('areas', 'carbonCredits', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert to original precision
    await queryInterface.changeColumn('areas', 'totalArea', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });

    await queryInterface.changeColumn('areas', 'carbonCredits', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });
  }
};
