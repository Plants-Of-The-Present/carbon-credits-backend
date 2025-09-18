const { Sequelize } = require('sequelize');
const config = require('./sequelize.config.js');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;

const connectDB = async () => {
  try {
    if (dbConfig.use_env_variable) {
      sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
    } else {
      sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        dbConfig
      );
    }

    // Test the connection
    await sequelize.authenticate();
    console.log('🐘 PostgreSQL Connected successfully');

    // Sync models (only in development)
    if (env === 'development') {
      await sequelize.sync();
      console.log('✅ Database models synchronized');
    }

  } catch (error) {
    console.error('❌ Error connecting to PostgreSQL:', error.message);
    process.exit(1);
  }
};

const getSequelize = () => {
  if (!sequelize) {
    throw new Error('Database not connected. Call connectDB first.');
  }
  return sequelize;
};

const disconnectDB = async () => {
  if (sequelize) {
    await sequelize.close();
    console.log('🔌 PostgreSQL connection closed');
  }
};

// Graceful shutdown handlers
process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT. Closing database connection...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Received SIGTERM. Closing database connection...');
  await disconnectDB();
  process.exit(0);
});

process.on('beforeExit', async () => {
  await disconnectDB();
});

module.exports = {
  connectDB,
  getSequelize,
  disconnectDB,
  sequelize
};