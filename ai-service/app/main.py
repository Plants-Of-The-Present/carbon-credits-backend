#!/usr/bin/env python3
"""
API Flask para servir o modelo Veridis AI
Segmentação de imagens de satélite para análise florestal
"""

import os
import logging
import traceback
from datetime import datetime
import numpy as np
from PIL import Image
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import io
import base64

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Flask
app = Flask(__name__)
CORS(app)

# Configurações
MODEL_PATH = './modelo_keras'
IMG_SIZE = (256, 256)
CLASSES = {
    0: {"name": "Não Floresta", "color": [128, 128, 128], "hex": "#808080"},
    1: {"name": "Floresta Degradada", "color": [255, 165, 0], "hex": "#FFA500"},
    2: {"name": "Floresta Densa", "color": [0, 128, 0], "hex": "#008000"}
}

# Variável global para o modelo
model = None
model_loaded = False

def load_model():
    """Carregar o modelo Keras"""
    global model, model_loaded

    try:
        logger.info("🔄 Carregando modelo Veridis AI...")

        # Reconstituir modelo a partir dos arquivos
        config_path = os.path.join(MODEL_PATH, 'config.json')
        weights_path = os.path.join(MODEL_PATH, 'model.weights.h5')

        if not os.path.exists(config_path) or not os.path.exists(weights_path):
            raise FileNotFoundError(f"Arquivos do modelo não encontrados em {MODEL_PATH}")

        # Carregar configuração
        import json
        with open(config_path, 'r') as f:
            config = json.load(f)

        # Reconstruir modelo
        model = tf.keras.models.model_from_json(json.dumps(config))
        model.load_weights(weights_path)

        logger.info("✅ Modelo carregado com sucesso!")
        logger.info(f"   - Input shape: {model.input_shape}")
        logger.info(f"   - Output shape: {model.output_shape}")
        logger.info(f"   - Parâmetros: {model.count_params():,}")

        model_loaded = True
        return True

    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo: {e}")
        logger.error(traceback.format_exc())
        model_loaded = False
        return False

def preprocess_image(image_data):
    """Preprocessar imagem para o modelo"""
    try:
        # Converter para PIL Image
        image = Image.open(io.BytesIO(image_data))

        # Converter para RGB se necessário
        if image.mode != 'RGB':
            image = image.convert('RGB')

        # Redimensionar para 256x256
        image = image.resize(IMG_SIZE, Image.Resampling.LANCZOS)

        # Converter para array numpy
        img_array = np.array(image)

        # Normalizar para [0, 1]
        img_array = img_array.astype(np.float32) / 255.0

        # Adicionar dimensão batch
        img_batch = np.expand_dims(img_array, axis=0)

        return img_batch, image

    except Exception as e:
        logger.error(f"Erro no preprocessamento: {e}")
        raise

def postprocess_prediction(prediction, original_size=None):
    """Pós-processar predição do modelo"""
    try:
        # Obter classes preditas (argmax)
        mask = np.argmax(prediction[0], axis=-1)

        # Calcular estatísticas
        unique, counts = np.unique(mask, return_counts=True)
        total_pixels = mask.size

        statistics = {}
        for class_id, count in zip(unique, counts):
            percentage = (count / total_pixels) * 100
            statistics[int(class_id)] = {
                "name": CLASSES[class_id]["name"],
                "pixels": int(count),
                "percentage": round(float(percentage), 2),
                "color": CLASSES[class_id]["color"],
                "hex": CLASSES[class_id]["hex"]
            }

        # Criar máscara colorida
        height, width = mask.shape
        colored_mask = np.zeros((height, width, 3), dtype=np.uint8)

        for class_id in range(3):
            colored_mask[mask == class_id] = CLASSES[class_id]["color"]

        # Converter máscara para base64
        mask_image = Image.fromarray(colored_mask)
        buffer = io.BytesIO()
        mask_image.save(buffer, format='PNG')
        mask_base64 = base64.b64encode(buffer.getvalue()).decode()

        return {
            "statistics": statistics,
            "mask_base64": mask_base64,
            "mask_shape": mask.shape,
            "total_pixels": int(total_pixels)
        }

    except Exception as e:
        logger.error(f"Erro no pós-processamento: {e}")
        raise

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint de health check"""
    return jsonify({
        "status": "healthy" if model_loaded else "unhealthy",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat(),
        "service": "Veridis AI Service"
    })

@app.route('/info', methods=['GET'])
def model_info():
    """Informações sobre o modelo"""
    if not model_loaded:
        return jsonify({"error": "Modelo não carregado"}), 503

    return jsonify({
        "model_name": "Veridis AI - Forest Segmentation",
        "version": "1.0.0",
        "input_shape": list(model.input_shape),
        "output_shape": list(model.output_shape),
        "parameters": int(model.count_params()),
        "classes": CLASSES,
        "image_size": IMG_SIZE
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint principal de predição"""
    try:
        if not model_loaded:
            return jsonify({"error": "Modelo não está carregado"}), 503

        # Verificar se tem arquivo na requisição
        if 'file' not in request.files:
            return jsonify({"error": "Nenhum arquivo fornecido"}), 400

        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "Nenhum arquivo selecionado"}), 400

        # Ler dados da imagem
        image_data = file.read()

        logger.info(f"📸 Processando imagem: {file.filename} ({len(image_data)} bytes)")

        # Preprocessar imagem
        img_batch, original_image = preprocess_image(image_data)

        # Fazer predição
        logger.info("🔮 Executando predição...")
        start_time = datetime.now()

        prediction = model.predict(img_batch)

        end_time = datetime.now()
        inference_time = (end_time - start_time).total_seconds()

        logger.info(f"⚡ Predição concluída em {inference_time:.3f}s")

        # Pós-processar resultado
        result = postprocess_prediction(prediction)

        # Adicionar metadados
        result.update({
            "filename": file.filename,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "original_size": original_image.size,
            "processed_size": IMG_SIZE
        })

        logger.info("✅ Processamento concluído com sucesso")

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        logger.error(f"❌ Erro na predição: {e}")
        logger.error(traceback.format_exc())

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/predict-url', methods=['POST'])
def predict_from_url():
    """Predição a partir de URL de imagem"""
    try:
        if not model_loaded:
            return jsonify({"error": "Modelo não está carregado"}), 503

        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"error": "URL não fornecida"}), 400

        url = data['url']

        # Baixar imagem
        import requests
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        image_data = response.content

        logger.info(f"🌐 Processando imagem de URL: {url}")

        # Mesmo processamento do endpoint /predict
        img_batch, original_image = preprocess_image(image_data)

        start_time = datetime.now()
        prediction = model.predict(img_batch)
        end_time = datetime.now()

        inference_time = (end_time - start_time).total_seconds()
        result = postprocess_prediction(prediction)

        result.update({
            "source_url": url,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "original_size": original_image.size,
            "processed_size": IMG_SIZE
        })

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        logger.error(f"❌ Erro na predição por URL: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/calculate-carbon-credits', methods=['POST'])
def calculate_carbon_credits():
    """Endpoint específico para cálculo de créditos de carbono"""
    try:
        if not model_loaded:
            return jsonify({"error": "Modelo não está carregado"}), 503

        data = request.get_json()
        if not data or 'url' not in data:
            return jsonify({"error": "URL não fornecida"}), 400

        url = data['url']

        # Baixar imagem
        import requests
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        image_data = response.content

        logger.info(f"🌿 Calculando créditos de carbono para: {url}")

        # Processar imagem
        img_batch, original_image = preprocess_image(image_data)

        start_time = datetime.now()
        prediction = model.predict(img_batch)
        end_time = datetime.now()

        inference_time = (end_time - start_time).total_seconds()

        # Calcular créditos de carbono baseado na matriz de densidade
        carbon_credits = calculate_carbon_credits_from_prediction(prediction)

        # Obter estatísticas da floresta
        mask = np.argmax(prediction[0], axis=-1)
        unique, counts = np.unique(mask, return_counts=True)
        total_pixels = mask.size

        forest_stats = {}
        for class_id, count in zip(unique, counts):
            percentage = (count / total_pixels) * 100
            forest_stats[int(class_id)] = {
                "name": CLASSES[class_id]["name"],
                "pixels": int(count),
                "percentage": round(float(percentage), 2)
            }

        result = {
            "carbon_credits": carbon_credits,
            "forest_analysis": forest_stats,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "source_url": url,
            "image_size": IMG_SIZE
        }

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        logger.error(f"❌ Erro no cálculo de créditos: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def calculate_carbon_credits_from_prediction(prediction):
    """
    Calcular créditos de carbono baseado na matriz de predição

    Lógica:
    - Floresta Densa (classe 2): Máximo potencial de captura de carbono
    - Floresta Degradada (classe 1): Potencial médio de captura
    - Não Floresta (classe 0): Sem captura de carbono
    """
    # Obter classes preditas
    mask = np.argmax(prediction[0], axis=-1)

    # Contar pixels por classe
    unique, counts = np.unique(mask, return_counts=True)
    total_pixels = mask.size

    # Fatores de conversão para créditos de carbono
    # Baseado em estudos de captura de CO2 por hectare por ano
    carbon_factors = {
        0: 0.0,     # Não Floresta: 0 créditos
        1: 0.5,     # Floresta Degradada: 50% dos créditos máximos
        2: 1.0      # Floresta Densa: 100% dos créditos máximos
    }

    # Assumindo que cada pixel representa uma área proporcional
    # e que a área total pode gerar até 10 créditos por hectare
    max_credits_per_pixel = 10.0 / total_pixels

    total_credits = 0.0
    for class_id, count in zip(unique, counts):
        factor = carbon_factors.get(int(class_id), 0.0)
        credits_for_class = count * max_credits_per_pixel * factor
        total_credits += credits_for_class

    # Multiplicador baseado na densidade florestal total
    forest_pixels = sum(counts[unique == 1]) + sum(counts[unique == 2]) if len(unique) > 1 else 0
    forest_density = forest_pixels / total_pixels

    # Bonus por densidade: áreas com mais floresta geram mais créditos
    density_multiplier = 1.0 + (forest_density * 0.5)

    final_credits = total_credits * density_multiplier

    # Garantir que os créditos estejam em uma faixa realista (0-1000)
    final_credits = min(max(final_credits, 0), 1000)

    return round(final_credits, 2)

if __name__ == '__main__':
    # Carregar modelo na inicialização
    logger.info("🚀 Iniciando Veridis AI Service...")

    if load_model():
        logger.info("🎉 Serviço pronto!")
        app.run(host='0.0.0.0', port=5001, debug=False)
    else:
        logger.error("💥 Falha ao inicializar o serviço")
        exit(1)