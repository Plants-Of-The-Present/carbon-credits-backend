# Serviço de IA - Veridis AI

Este serviço utiliza um modelo U-Net para análise de cobertura florestal e cálculo de créditos de carbono.

## ⚠️ Configuração do Modelo

**IMPORTANTE**: O modelo de IA não está incluído no repositório por ser muito pesado (2.3GB).

### Para usar este serviço, você precisa:

1. **Baixar o modelo** do seu local de armazenamento
2. **Colocar na pasta** `modelo_keras/` dentro de `ai-service/`
3. **Estrutura esperada:**
   ```
   ai-service/
   ├── modelo_keras/
   │   ├── config.json
   │   ├── model.weights.h5
   │   └── metadata.json
   ├── app/
   │   └── main.py
   ├── requirements.txt
   └── Dockerfile
   ```

## 🚀 Como usar

### Com Docker Compose (Recomendado)
```bash
docker compose up
```

### Local
```bash
cd ai-service
pip install -r requirements.txt
python app/main.py
```

## 📋 Endpoints

- `GET /health` - Status do serviço
- `GET /info` - Informações do modelo
- `POST /calculate-carbon-credits` - Calcula créditos baseado em URL de imagem

## 🔗 Integração

O serviço é automaticamente chamado pela API Node.js quando uma área é criada e possui imagem correspondente.