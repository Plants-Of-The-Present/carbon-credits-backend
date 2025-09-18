'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const supplierPassword = await bcrypt.hash('supplier123', 12);
    const buyerPassword = await bcrypt.hash('buyer123', 12);

    const users = [
      {
        id: uuidv4(),
        username: 'supplier@greenforest.com',
        password: supplierPassword,
        user_type: 'SUPPLIER',
        company_name: 'Green Forest Solutions',
        company_cnpj: '12345678901234',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'buyer@sustainablecorp.com',
        password: buyerPassword,
        user_type: 'BUYER',
        company_name: 'Sustainable Corporation',
        company_cnpj: '98765432109876',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users, {});

    // Store user IDs for use in other seeders
    global.seedUserIds = {
      supplier: users[0].id,
      buyer: users[1].id
    };

    return users;
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};