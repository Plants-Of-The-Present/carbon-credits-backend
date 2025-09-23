'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('areas', 'link_image', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'URL da imagem correspondente às coordenadas da área'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('areas', 'link_image');
  }
};