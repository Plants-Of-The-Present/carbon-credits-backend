'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get supplier user from previous seeder
    const [users] = await queryInterface.sequelize.query(
      "SELECT company_cnpj FROM users WHERE username = 'supplier@greenforest.com'"
    );

    if (users.length === 0) {
      throw new Error('Supplier user not found. Please run user seeder first.');
    }

    const supplierCnpj = users[0].company_cnpj;
    const areaId = uuidv4();

    const area = {
      id: areaId,
      name: 'Floresta Amazônica Preservada',
      point1_x: -72.6792,
      point1_y: -7.6292,
      point2_x: -72.6792,
      point2_y: -7.6392,
      point3_x: -72.6892,
      point3_y: -7.6392,
      point4_x: -72.6892,
      point4_y: -7.6292,
      total_area: 1000.00,
      carbon_credits: 12000.00,
      is_allocated: false,
      buyer_cnpj: null,
      supplier_cnpj: supplierCnpj,
      created_at: new Date(),
      updated_at: new Date()
    };

    await queryInterface.bulkInsert('areas', [area], {});

    // Create corresponding image
    const image = {
      id: uuidv4(),
      url: 'https://example.com/area-images/amazonia-acre.jpg',
      point1_x: -72.6792,
      point1_y: -7.6292,
      point2_x: -72.6792,
      point2_y: -7.6392,
      point3_x: -72.6892,
      point3_y: -7.6392,
      point4_x: -72.6892,
      point4_y: -7.6292,
      area_id: areaId,
      created_at: new Date(),
      updated_at: new Date()
    };

    await queryInterface.bulkInsert('images', [image], {});

    // Store area ID for use in other seeders
    global.seedAreaId = areaId;

    return area;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('images', null, {});
    await queryInterface.bulkDelete('areas', null, {});
  }
};