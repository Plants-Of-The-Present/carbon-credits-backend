const axios = require('axios');

class AIService {
  constructor() {
    this.baseURL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // 30 segundos
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async isHealthy() {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('❌ AI Service health check failed:', error.message);
      return false;
    }
  }

  async calculateCarbonCredits(imageUrl, latitude, zoom) {
    try {
      if (latitude === undefined || zoom === undefined) {
        throw new Error('Latitude ou Zoom não foram fornecidos para o cálculo de créditos.');
      }
      
      console.log('🌿 Chamando IA para calcular créditos de carbono...');

      // ✨ ALTERAÇÃO CRÍTICA: Incluir latitude e zoom no payload da requisição ✨
      const response = await this.client.post('/calculate-carbon-credits', {
        url: imageUrl,
        latitude: latitude, // Enviando a latitude média calculada
        zoom: zoom        // Enviando o zoom dinâmico calculado
      });

      if (response.data.success) {
        const result = response.data.data;
        
        // Exibe a área real calculada para cada classe (opcional, mas útil para debug)
        const totalArea = result.forest_analysis 
            ? Object.values(result.forest_analysis).reduce((sum, item) => sum + item.area_sq_m, 0) 
            : 0;

        console.log(`✅ IA calculou ${result.carbon_credits} créditos de carbono.`);
        console.log(`(Área total analisada: ${totalArea.toFixed(2)} m²)`);

        return {
          success: true,
          carbonCredits: result.carbon_credits,
          forestAnalysis: result.forest_analysis,
          inferenceTime: result.inference_time,
          metadata: {
            timestamp: result.timestamp,
            imageSize: result.image_size,
            calculatedArea: (totalArea/10000)
          }
        };
      } else {
        throw new Error(response.data.error || 'Resposta inválida da IA');
      }
    } catch (error) {
      console.error('❌ Erro ao calcular créditos com IA:', error.message);

      // Se for erro de conexão/timeout, retorna 0 créditos
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.log('⚠️  Serviço de IA indisponível, usando créditos zero');
        return {
          success: false,
          carbonCredits: 0,
          error: 'Serviço de IA indisponível'
        };
      }

      throw error;
    }
  }

  async getModelInfo() {
    try {
      const response = await this.client.get('/info');
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter informações do modelo:', error.message);
      throw error;
    }
  }
}

module.exports = new AIService();