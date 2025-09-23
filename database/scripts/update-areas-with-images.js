// Configurar variáveis de ambiente para conectar corretamente
process.env.POSTGRES_HOST = 'localhost';
process.env.POSTGRES_PORT = '5433';
process.env.POSTGRES_PASSWORD = 'postgres123';

const { Area, Image } = require('../models');

async function updateAreasWithImages() {
  try {
    console.log('🔄 Iniciando atualização de áreas com URLs de imagens...');

    // Buscar todas as áreas existentes que não têm link_image
    const areas = await Area.findAll({
      where: {
        link_image: null
      }
    });

    console.log(`📋 Encontradas ${areas.length} áreas para atualizar`);

    let updated = 0;
    let notFound = 0;

    for (const area of areas) {
      try {
        // Buscar imagem correspondente às coordenadas da área
        const correspondingImage = await Image.findByCoordinates(
          area.point1X, area.point1Y, area.point2X, area.point2Y,
          area.point3X, area.point3Y, area.point4X, area.point4Y
        );

        if (correspondingImage) {
          // Atualizar área com URL da imagem
          await area.update({
            link_image: correspondingImage.url
          });

          console.log(`✅ Área ${area.id} (${area.name}) atualizada com imagem: ${correspondingImage.url}`);
          updated++;
        } else {
          console.log(`⚠️  Área ${area.id} (${area.name}) - nenhuma imagem correspondente encontrada`);
          notFound++;
        }
      } catch (error) {
        console.error(`❌ Erro ao processar área ${area.id}:`, error.message);
      }
    }

    console.log('\n📊 Resumo da atualização:');
    console.log(`   ✅ Áreas atualizadas: ${updated}`);
    console.log(`   ⚠️  Áreas sem imagem: ${notFound}`);
    console.log(`   📋 Total processadas: ${areas.length}`);

    if (updated > 0) {
      console.log('\n🎉 Atualização concluída com sucesso!');
    } else {
      console.log('\n💡 Nenhuma área foi atualizada (todas já tinham imagens ou não foram encontradas imagens correspondentes)');
    }

  } catch (error) {
    console.error('❌ Erro durante a atualização:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  updateAreasWithImages()
    .then(() => {
      console.log('✨ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { updateAreasWithImages };