'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create ENUM types first
    await queryInterface.sequelize.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_users_user_type') THEN
          CREATE TYPE enum_users_user_type AS ENUM ('BUYER', 'SUPPLIER', 'GOVERNMENT', 'CITIZEN');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_areas_forest_type') THEN
          CREATE TYPE enum_areas_forest_type AS ENUM ('NATIVE', 'PLANTED', 'MIXED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_areas_project_type') THEN
          CREATE TYPE enum_areas_project_type AS ENUM ('PRIVATE', 'PUBLIC');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_areas_status') THEN
          CREATE TYPE enum_areas_status AS ENUM ('ACTIVE', 'INACTIVE', 'UNDER_REVIEW', 'SUSPENDED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_areas_calculation_method') THEN
          CREATE TYPE enum_areas_calculation_method AS ENUM ('satellite', 'field_measurement', 'estimation');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_areas_health_status') THEN
          CREATE TYPE enum_areas_health_status AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_carbon_credits_status') THEN
          CREATE TYPE enum_carbon_credits_status AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'VERIFIED', 'CANCELLED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_carbon_credits_verification_status') THEN
          CREATE TYPE enum_carbon_credits_verification_status AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_carbon_credits_payment_method') THEN
          CREATE TYPE enum_carbon_credits_payment_method AS ENUM ('bank_transfer', 'credit_card', 'cryptocurrency', 'other');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_type') THEN
          CREATE TYPE enum_companies_type AS ENUM ('SUPPLIER', 'BUYER', 'BOTH');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_sector') THEN
          CREATE TYPE enum_companies_sector AS ENUM ('AGRICULTURE', 'FORESTRY', 'MANUFACTURING', 'ENERGY', 'TRANSPORTATION', 'TECHNOLOGY', 'FINANCE', 'RETAIL', 'OTHER');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_size') THEN
          CREATE TYPE enum_companies_size AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_verification_status') THEN
          CREATE TYPE enum_verification_status AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_companies_verification_status') THEN
          CREATE TYPE enum_companies_verification_status AS ENUM ('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_document_status') THEN
          CREATE TYPE enum_document_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_certificate_status') THEN
          CREATE TYPE enum_certificate_status AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_area_images_type') THEN
          CREATE TYPE enum_area_images_type AS ENUM ('satellite', 'drone', 'ground');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_area_certificates_type') THEN
          CREATE TYPE enum_area_certificates_type AS ENUM ('environmental', 'carbon', 'sustainability');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_area_certificates_status') THEN
          CREATE TYPE enum_area_certificates_status AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_area_risk_factors_type') THEN
          CREATE TYPE enum_area_risk_factors_type AS ENUM ('FIRE', 'DEFORESTATION', 'DISEASE', 'DROUGHT');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_area_risk_factors_level') THEN
          CREATE TYPE enum_area_risk_factors_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_credit_documents_type') THEN
          CREATE TYPE enum_credit_documents_type AS ENUM ('measurement_report', 'satellite_data', 'field_verification', 'certificate');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_company_credentials_type') THEN
          CREATE TYPE enum_company_credentials_type AS ENUM ('business_license', 'environmental_license', 'certification', 'other');
        END IF;

        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_company_credentials_status') THEN
          CREATE TYPE enum_company_credentials_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
        END IF;
      END $$;
    `);

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      user_type: {
        type: Sequelize.ENUM('BUYER', 'SUPPLIER', 'GOVERNMENT', 'CITIZEN'),
        allowNull: false
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: true
      },
      company_cnpj: {
        type: Sequelize.STRING(14),
        allowNull: true
      },
      company_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      avatar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      reputation_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create areas table
    await queryInterface.createTable('areas', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      forest_type: {
        type: Sequelize.ENUM('NATIVE', 'PLANTED', 'MIXED'),
        allowNull: false
      },
      project_type: {
        type: Sequelize.ENUM('PRIVATE', 'PUBLIC'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'UNDER_REVIEW', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
      },
      is_public: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'Brazil'
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      size: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      unit: {
        type: Sequelize.STRING,
        defaultValue: 'hectares'
      },
      credits_generated: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      credits_available: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      credits_sold: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      last_calculation: {
        type: Sequelize.DATE,
        allowNull: true
      },
      calculation_method: {
        type: Sequelize.ENUM('satellite', 'field_measurement', 'estimation'),
        defaultValue: 'estimation'
      },
      last_satellite_check: {
        type: Sequelize.DATE,
        allowNull: true
      },
      health_status: {
        type: Sequelize.ENUM('EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CRITICAL'),
        defaultValue: 'GOOD'
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create carbon_credits table
    await queryInterface.createTable('carbon_credits', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      price_per_credit: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      total_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('AVAILABLE', 'RESERVED', 'SOLD', 'VERIFIED', 'CANCELLED'),
        defaultValue: 'AVAILABLE'
      },
      generation_start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      generation_end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      vintage: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      methodology: {
        type: Sequelize.STRING,
        allowNull: true
      },
      additionality_proof: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      permanence: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      leakage: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0
      },
      verification_status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      verification_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verification_methodology: {
        type: Sequelize.STRING,
        allowNull: true
      },
      certificate_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      blockchain_hash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      payment_method: {
        type: Sequelize.ENUM('bank_transfer', 'credit_card', 'cryptocurrency', 'other'),
        allowNull: true
      },
      transaction_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      blockchain_network: {
        type: Sequelize.STRING,
        allowNull: true
      },
      contract_address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      is_retired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      retirement_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      retirement_reason: {
        type: Sequelize.STRING,
        allowNull: true
      },
      area_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'areas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      supplier_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      retired_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      verified_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create companies table
    await queryInterface.createTable('companies', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      cnpj: {
        type: Sequelize.STRING(14),
        allowNull: false,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('SUPPLIER', 'BUYER', 'BOTH'),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      website: {
        type: Sequelize.STRING,
        allowNull: true
      },
      street: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      complement: {
        type: Sequelize.STRING,
        allowNull: true
      },
      neighborhood: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: false
      },
      state: {
        type: Sequelize.STRING,
        allowNull: false
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'Brazil'
      },
      zip_code: {
        type: Sequelize.STRING(9),
        allowNull: true
      },
      sector: {
        type: Sequelize.ENUM('AGRICULTURE', 'FORESTRY', 'MANUFACTURING', 'ENERGY', 'TRANSPORTATION', 'TECHNOLOGY', 'FINANCE', 'RETAIL', 'OTHER'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      size: {
        type: Sequelize.ENUM('MICRO', 'SMALL', 'MEDIUM', 'LARGE'),
        allowNull: false
      },
      founded_year: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      reputation_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_transactions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      successful_transactions: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_credits_traded: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0
      },
      verification_status: {
        type: Sequelize.ENUM('PENDING', 'IN_PROGRESS', 'VERIFIED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      verification_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      verification_feedback: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      owner_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      verified_by_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create remaining tables (user_reviews, company_reviews, etc.)
    await queryInterface.createTable('user_reviews', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reviewed_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('company_reviews', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      comment: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      transaction_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      reviewer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('verification_documents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('area_images', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('satellite', 'drone', 'ground'),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      area_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'areas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('area_certificates', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('environmental', 'carbon', 'sustainability'),
        allowNull: false
      },
      issuer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      issue_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      document_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'EXPIRED', 'REVOKED'),
        defaultValue: 'ACTIVE'
      },
      area_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'areas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('area_boundaries', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      area_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'areas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('area_risk_factors', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('FIRE', 'DEFORESTATION', 'DISEASE', 'DROUGHT'),
        allowNull: false
      },
      level: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH'),
        allowNull: false
      },
      detected_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      area_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'areas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('credit_documents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('measurement_report', 'satellite_data', 'field_verification', 'certificate'),
        allowNull: false
      },
      credit_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'carbon_credits',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.createTable('company_credentials', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('business_license', 'environmental_license', 'certification', 'other'),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      issuer: {
        type: Sequelize.STRING,
        allowNull: true
      },
      issue_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expiration_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      document_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'APPROVED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      company_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['user_type']);
    await queryInterface.addIndex('areas', ['owner_id']);
    await queryInterface.addIndex('areas', ['status']);
    await queryInterface.addIndex('areas', ['is_public']);
    await queryInterface.addIndex('carbon_credits', ['area_id']);
    await queryInterface.addIndex('carbon_credits', ['supplier_id']);
    await queryInterface.addIndex('carbon_credits', ['buyer_id']);
    await queryInterface.addIndex('carbon_credits', ['status']);
    await queryInterface.addIndex('carbon_credits', ['verification_status']);
    await queryInterface.addIndex('companies', ['cnpj']);
    await queryInterface.addIndex('companies', ['owner_id']);
    await queryInterface.addIndex('companies', ['verification_status']);
  },

  async down(queryInterface, Sequelize) {
    // Drop all tables in reverse order
    await queryInterface.dropTable('company_credentials');
    await queryInterface.dropTable('credit_documents');
    await queryInterface.dropTable('area_risk_factors');
    await queryInterface.dropTable('area_boundaries');
    await queryInterface.dropTable('area_certificates');
    await queryInterface.dropTable('area_images');
    await queryInterface.dropTable('verification_documents');
    await queryInterface.dropTable('company_reviews');
    await queryInterface.dropTable('user_reviews');
    await queryInterface.dropTable('companies');
    await queryInterface.dropTable('carbon_credits');
    await queryInterface.dropTable('areas');
    await queryInterface.dropTable('users');

    // Drop ENUM types
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_users_user_type;
      DROP TYPE IF EXISTS enum_areas_forest_type;
      DROP TYPE IF EXISTS enum_areas_project_type;
      DROP TYPE IF EXISTS enum_areas_status;
      DROP TYPE IF EXISTS enum_areas_calculation_method;
      DROP TYPE IF EXISTS enum_areas_health_status;
      DROP TYPE IF EXISTS enum_carbon_credits_status;
      DROP TYPE IF EXISTS enum_carbon_credits_verification_status;
      DROP TYPE IF EXISTS enum_carbon_credits_payment_method;
      DROP TYPE IF EXISTS enum_companies_type;
      DROP TYPE IF EXISTS enum_companies_sector;
      DROP TYPE IF EXISTS enum_companies_size;
      DROP TYPE IF EXISTS enum_verification_status;
      DROP TYPE IF EXISTS enum_companies_verification_status;
      DROP TYPE IF EXISTS enum_document_status;
      DROP TYPE IF EXISTS enum_certificate_status;
      DROP TYPE IF EXISTS enum_area_images_type;
      DROP TYPE IF EXISTS enum_area_certificates_type;
      DROP TYPE IF EXISTS enum_area_certificates_status;
      DROP TYPE IF EXISTS enum_area_risk_factors_type;
      DROP TYPE IF EXISTS enum_area_risk_factors_level;
      DROP TYPE IF EXISTS enum_credit_documents_type;
      DROP TYPE IF EXISTS enum_company_credentials_type;
      DROP TYPE IF EXISTS enum_company_credentials_status;
    `);
  }
};