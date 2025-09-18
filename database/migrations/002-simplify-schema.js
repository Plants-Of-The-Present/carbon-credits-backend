'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop unnecessary tables first
    await queryInterface.dropTable('company_credentials');
    await queryInterface.dropTable('credit_documents');
    await queryInterface.dropTable('area_risk_factors');
    await queryInterface.dropTable('area_boundaries');
    await queryInterface.dropTable('area_certificates');
    await queryInterface.dropTable('verification_documents');
    await queryInterface.dropTable('company_reviews');
    await queryInterface.dropTable('user_reviews');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('carbon_credits');

    // Rename area_images to images
    await queryInterface.renameTable('area_images', 'images');

    // Update ENUM types for simplified schema
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        -- Update user_type enum to only have BUYER and SUPPLIER
        ALTER TYPE enum_users_user_type RENAME TO enum_users_user_type_old;
        CREATE TYPE enum_users_user_type AS ENUM ('BUYER', 'SUPPLIER');

        -- Update users table to use new enum
        ALTER TABLE users ALTER COLUMN user_type TYPE enum_users_user_type USING user_type::text::enum_users_user_type;

        -- Drop old enum
        DROP TYPE enum_users_user_type_old;
      END $$;
    `);

    // Simplify users table
    await queryInterface.removeColumn('users', 'name');
    await queryInterface.removeColumn('users', 'email');
    await queryInterface.removeColumn('users', 'company_address');
    await queryInterface.removeColumn('users', 'avatar');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'reputation_score');
    await queryInterface.removeColumn('users', 'is_verified');

    // Add username column and make CNPJ required
    await queryInterface.addColumn('users', 'username', {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    });

    await queryInterface.changeColumn('users', 'company_name', {
      type: Sequelize.STRING(200),
      allowNull: false
    });

    await queryInterface.changeColumn('users', 'company_cnpj', {
      type: Sequelize.STRING(14),
      allowNull: false,
      unique: true
    });

    // Simplify areas table
    await queryInterface.removeColumn('areas', 'description');
    await queryInterface.removeColumn('areas', 'forest_type');
    await queryInterface.removeColumn('areas', 'project_type');
    await queryInterface.removeColumn('areas', 'status');
    await queryInterface.removeColumn('areas', 'is_public');
    await queryInterface.removeColumn('areas', 'address');
    await queryInterface.removeColumn('areas', 'city');
    await queryInterface.removeColumn('areas', 'state');
    await queryInterface.removeColumn('areas', 'country');
    await queryInterface.removeColumn('areas', 'latitude');
    await queryInterface.removeColumn('areas', 'longitude');
    await queryInterface.removeColumn('areas', 'size');
    await queryInterface.removeColumn('areas', 'unit');
    await queryInterface.removeColumn('areas', 'credits_generated');
    await queryInterface.removeColumn('areas', 'credits_available');
    await queryInterface.removeColumn('areas', 'credits_sold');
    await queryInterface.removeColumn('areas', 'last_calculation');
    await queryInterface.removeColumn('areas', 'calculation_method');
    await queryInterface.removeColumn('areas', 'last_satellite_check');
    await queryInterface.removeColumn('areas', 'health_status');
    await queryInterface.removeColumn('areas', 'owner_id');

    // Add new coordinate columns for areas
    await queryInterface.addColumn('areas', 'point1_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point1_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point2_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point2_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point3_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point3_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point4_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'point4_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'total_area', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    });

    await queryInterface.addColumn('areas', 'carbon_credits', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    await queryInterface.addColumn('areas', 'is_allocated', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });

    await queryInterface.addColumn('areas', 'buyer_cnpj', {
      type: Sequelize.STRING(14),
      allowNull: true
    });

    await queryInterface.addColumn('areas', 'supplier_cnpj', {
      type: Sequelize.STRING(14),
      allowNull: false
    });

    // Update images table to match new coordinate structure
    await queryInterface.removeColumn('images', 'type');
    await queryInterface.removeColumn('images', 'description');

    await queryInterface.addColumn('images', 'point1_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point1_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point2_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point2_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point3_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point3_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point4_x', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: false
    });

    await queryInterface.addColumn('images', 'point4_y', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: false
    });

    // Make area_id unique for 1:1 relationship
    await queryInterface.addConstraint('images', {
      fields: ['area_id'],
      type: 'unique',
      name: 'images_area_id_unique'
    });

    // Add foreign key constraint for supplier_cnpj
    await queryInterface.addConstraint('areas', {
      fields: ['supplier_cnpj'],
      type: 'foreign key',
      name: 'areas_supplier_cnpj_fkey',
      references: {
        table: 'users',
        field: 'company_cnpj'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Add indexes for performance
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['company_cnpj']);
    await queryInterface.addIndex('areas', ['supplier_cnpj']);
    await queryInterface.addIndex('areas', ['buyer_cnpj']);
    await queryInterface.addIndex('areas', ['is_allocated']);
  },

  async down(queryInterface, Sequelize) {
    // This down migration would be complex to implement fully
    // For MVP purposes, we can recreate from the original migration if needed
    throw new Error('Down migration not implemented for schema simplification');
  }
};