// Configurar variáveis de ambiente para conectar corretamente
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_PASSWORD = 'postgres123';

const { sequelize } = require('./database/models');

async function runMigration() {
  try {
    console.log('🔄 Executando migração para adicionar link_image...');

    // Adicionar coluna link_image na tabela areas
    await sequelize.query(`
      ALTER TABLE areas
      ADD COLUMN link_image TEXT;
    `);

    console.log('✅ Migração executada com sucesso!');
    console.log('   - Campo link_image adicionado à tabela areas');

  } catch (error) {
    if (error.message.includes('duplicate column name') ||
        error.message.includes('already exists')) {
      console.log('⚠️  Campo link_image já existe na tabela areas');
    } else {
      console.error('❌ Erro na migração:', error.message);
      throw error;
    }
  } finally {
    await sequelize.close();
  }
}

runMigration()
  .then(() => {
    console.log('🎉 Processo concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erro fatal:', error);
    process.exit(1);
  });