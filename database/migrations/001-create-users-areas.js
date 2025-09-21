'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Criar ENUM types para PostgreSQL
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_user_type') THEN
          CREATE TYPE enum_users_user_type AS ENUM ('BUYER', 'SUPPLIER');
        END IF;
      END $$;
    `);

    // Criar tabela users
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          len: [6, 100]
        }
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      user_type: {
        type: 'enum_users_user_type',
        allowNull: false
      },
      company_cnpj: {
        type: Sequelize.STRING(14),
        allowNull: false,
        unique: true,
        validate: {
          len: [14, 14]
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['company_cnpj']);

    // Criar tabela areas
    await queryInterface.createTable('areas', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      supplier_cnpj: {
        type: Sequelize.STRING(14),
        allowNull: false,
        references: {
          model: 'users',
          key: 'company_cnpj'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      point1_x: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      point1_y: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      point2_x: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      point2_y: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      point3_x: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      point3_y: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      point4_x: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      point4_y: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      total_area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      carbon_credits: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      is_allocated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      buyer_cnpj: {
        type: Sequelize.STRING(14),
        allowNull: true,
        references: {
          model: 'users',
          key: 'company_cnpj'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Criar índices para areas
    await queryInterface.addIndex('areas', ['supplier_cnpj']);
    await queryInterface.addIndex('areas', ['buyer_cnpj']);
    await queryInterface.addIndex('areas', ['is_allocated']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables
    await queryInterface.dropTable('areas');
    await queryInterface.dropTable('users');

    // Drop ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_user_type;');
  }
};