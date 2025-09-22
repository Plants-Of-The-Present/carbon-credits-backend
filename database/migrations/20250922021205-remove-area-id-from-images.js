'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Remove foreign key constraint first
    await queryInterface.removeConstraint('images', 'area_images_area_id_fkey');

    // Remove the areaId column
    await queryInterface.removeColumn('images', 'area_id');

    // Add unique constraint on coordinates to prevent duplicate images
    await queryInterface.addIndex('images', {
      fields: ['point1_x', 'point1_y', 'point2_x', 'point2_y', 'point3_x', 'point3_y', 'point4_x', 'point4_y'],
      unique: true,
      name: 'images_coordinates_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    // Remove the unique constraint
    await queryInterface.removeIndex('images', 'images_coordinates_unique');

    // Add back the areaId column
    await queryInterface.addColumn('images', 'area_id', {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'areas',
        key: 'id'
      }
    });
  }
};
