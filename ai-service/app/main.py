#!/usr/bin/env python3
"""
API Flask para servir o modelo Veridis AI
Segmentação de imagens de satélite para análise florestal
"""

import os
import logging
import traceback
import io
import base64
import math
import json # Adicionado para carregar a configuração do modelo
from datetime import datetime

import numpy as np
import requests
import cv2 
import tensorflow as tf 
from PIL import Image 
from flask import Flask, request, jsonify
from flask_cors import CORS 

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar Flask
app = Flask(__name__)
CORS(app)

# Configurações
MODEL_PATH = './modelo_keras'
IMG_SIZE = (256, 256) # Tamanho da imagem que o modelo espera
MAP_SIZE = '600x400' # Tamanho da imagem requisitada da API (usado para obter dimensões, mas o modelo usa IMG_SIZE)
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
        with open(config_path, 'r') as f:
            config = json.load(f)

        # Reconstruir modelo (usando tf.keras.models, já importado)
        model = tf.keras.models.model_from_json(json.dumps(config))
        model.load_weights(weights_path)

        logger.info("✅ Modelo carregado com sucesso!")
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
        image = Image.open(io.BytesIO(image_data)).convert('RGB')
        # Garante que a imagem está no tamanho esperado pelo modelo
        image = image.resize(IMG_SIZE, Image.Resampling.LANCZOS) 
        img_array = np.array(image).astype(np.float32) / 255.0
        img_batch = np.expand_dims(img_array, axis=0)
        return img_batch, image
    except Exception as e:
        logger.error(f"Erro no preprocessamento: {e}")
        raise

def postprocess_prediction(prediction, original_size=None):
    """Pós-processar predição do modelo (sem cálculo de área real aqui)"""
    try:
        mask = np.argmax(prediction[0], axis=-1)
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

        height, width = mask.shape
        colored_mask = np.zeros((height, width, 3), dtype=np.uint8)
        for class_id in range(3):
            colored_mask[mask == class_id] = CLASSES[class_id]["color"]

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

def calculate_carbon_credits_from_prediction(prediction, latitude, zoom, img_width, img_height):
    """
    Calcular créditos de carbono baseado na área real (m²/pixel).

    :param prediction: Matriz de predição do modelo.
    :param latitude: Latitude do centro da imagem (float).
    :param zoom: Nível de zoom usado (int).
    :param img_width: Largura da imagem em pixels (e.g., 256).
    :param img_height: Altura da imagem em pixels (e.g., 256).
    :returns: Créditos de carbono calculados (float).
    """
    # 1. CÁLCULO DA ÁREA REAL POR PIXEL (m²)
    
    # Constante de escala do Google Maps para zoom 0 no Equador (em metros/pixel)
    m_per_pixel_equator_zoom0 = 40075016.686 / 256 

    # Tamanho do pixel em metros na latitude e zoom dados
    meters_per_pixel = m_per_pixel_equator_zoom0 * math.cos(math.radians(latitude)) / (2**zoom)
    
    # Área de um pixel em m²
    area_per_pixel_sq_m = meters_per_pixel**2

    # 2. FATORES DE CONVERSÃO (Créditos por m²)
    # 1 Crédito = 1 tCO2e (tonelada de CO2 equivalente)
    # 10,000 m² = 1 hectare. 10 Créditos/ha = 0.001 Créditos/m²
    credits_per_sq_m = {
        0: 0.0,      # Não Floresta
        1: 0.0005,   # Floresta Degradada (5 Créditos/ha/ano)
        2: 0.001     # Floresta Densa (10 Créditos/ha/ano)
    }
    
    # 3. CÁLCULO DOS CRÉDITOS TOTAIS
    mask = np.argmax(prediction[0], axis=-1)
    unique, counts = np.unique(mask, return_counts=True)
    
    total_credits = 0.0
    
    # Inicializa um dicionário para estatísticas de crédito detalhadas (para log)
    credit_details = {} 

    for class_id, count in zip(unique, counts):
        factor = credits_per_sq_m.get(int(class_id), 0.0)
        
        # Área real da classe (m²)
        area_for_class_sq_m = count * area_per_pixel_sq_m
        
        # Créditos para a classe = Area (m²) * Fator (Crédito/m²)
        credits_for_class = area_for_class_sq_m * factor
        total_credits += credits_for_class
        
        # Armazena detalhes para log/inspeção
        credit_details[CLASSES[class_id]["name"]] = {
            "area_sq_m": area_for_class_sq_m,
            "credits": credits_for_class
        }

    # Mantém limite de segurança para valores negativos, remove o limite superior de 1000
    final_credits = max(total_credits, 0) 

    return round(final_credits, 2), credit_details # Retorna os créditos e o detalhe


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
        "input_shape": list(model.input_shape if hasattr(model, 'input_shape') else [None, 256, 256, 3]), 
        "output_shape": list(model.output_shape if hasattr(model, 'output_shape') else [None, 256, 256, 3]),
        "parameters": int(model.count_params() if hasattr(model, 'count_params') else 0), 
        "classes": CLASSES,
        "image_size": IMG_SIZE
    })

# Endpoint de predição via arquivo
@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint principal de predição"""
    try:
        if not model_loaded:
            return jsonify({"error": "Modelo não está carregado"}), 503

        if 'file' not in request.files:
            return jsonify({"error": "Nenhum arquivo fornecido"}), 400

        file = request.files['file']
        image_data = file.read()

        logger.info(f"📸 Processando imagem: {file.filename}")
        img_batch, original_image = preprocess_image(image_data)

        start_time = datetime.now()
        prediction = model.predict(img_batch)
        inference_time = (datetime.now() - start_time).total_seconds()

        result = postprocess_prediction(prediction)
        result.update({
            "filename": file.filename,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "original_size": original_image.size,
            "processed_size": IMG_SIZE
        })

        return jsonify({"success": True, "data": result})

    except Exception as e:
        logger.error(f"❌ Erro na predição: {e}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": str(e)}), 500

# Endpoint de predição via URL
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
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        image_data = response.content

        logger.info(f"🌐 Processando imagem de URL: {url}")
        img_batch, original_image = preprocess_image(image_data)

        start_time = datetime.now()
        prediction = model.predict(img_batch)
        inference_time = (datetime.now() - start_time).total_seconds()
        
        result = postprocess_prediction(prediction)
        result.update({
            "source_url": url,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "original_size": original_image.size,
            "processed_size": IMG_SIZE
        })

        return jsonify({"success": True, "data": result})

    except Exception as e:
        logger.error(f"❌ Erro na predição por URL: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/calculate-carbon-credits', methods=['POST'])
def calculate_carbon_credits():
    """
    Endpoint específico para cálculo de créditos de carbono, utilizando
    a escala real (m²/pixel) fornecida pela latitude e zoom.
    """
    try:
        if not model_loaded:
            return jsonify({"error": "Modelo não está carregado"}), 503

        data = request.get_json()
        if not data or 'url' not in data or 'latitude' not in data or 'zoom' not in data:
            return jsonify({"error": "URL, Latitude ou Zoom não fornecidos"}), 400

        url = data['url']
        latitude = float(data['latitude']) # Garante que é um float
        zoom = int(data['zoom'])          # Garante que é um inteiro

        # Dimensões da imagem usada pelo modelo (e, portanto, pela matriz de predição)
        img_width, img_height = IMG_SIZE 

        # Baixar imagem
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        image_data = response.content

        logger.info(f"🌿 Calculando créditos de carbono para: {url} (Lat: {latitude}, Zoom: {zoom})")

        # Processar imagem
        img_batch, original_image = preprocess_image(image_data)

        start_time = datetime.now()
        prediction = model.predict(img_batch)
        end_time = datetime.now()

        inference_time = (end_time - start_time).total_seconds()

        # Chamada da função de cálculo, que agora retorna os créditos e os detalhes
        carbon_credits, credit_details = calculate_carbon_credits_from_prediction(
            prediction, latitude, zoom, img_width, img_height
        )

        # NOVO LOG DE DETALHES DE CRÉDITO PARA VALIDAÇÃO
        logger.info("--- Detalhe dos Créditos Calculados (sem limite) ---")
        total_real_area = sum(d["area_sq_m"] for d in credit_details.values())
        logger.info(f"Área Total Analisada (m²): {total_real_area:,.2f}")
        logger.info(f"Créditos Reais Calculados (tCO2e): {carbon_credits:,.2f}")
        for class_name, details in credit_details.items():
            logger.info(f"  - {class_name}: Área={details['area_sq_m']:,.2f} m², Créditos={details['credits']:,.2f}")
        logger.info("--------------------------------------------------")
        
        # Obter estatísticas da floresta (em área real)
        mask = np.argmax(prediction[0], axis=-1)
        unique, counts = np.unique(mask, return_counts=True)
        total_pixels = mask.size

        # Recalcula a área por pixel para usar nas estatísticas de área (para retorno JSON)
        m_per_pixel_equator_zoom0 = 40075016.686 / 256
        meters_per_pixel = m_per_pixel_equator_zoom0 * math.cos(math.radians(latitude)) / (2**zoom)
        area_per_pixel_sq_m = meters_per_pixel**2
        total_area_sq_m = total_pixels * area_per_pixel_sq_m

        forest_stats = {}
        for class_id, count in zip(unique, counts):
            area_sq_m = count * area_per_pixel_sq_m
            percentage = (area_sq_m / total_area_sq_m) * 100
            
            forest_stats[int(class_id)] = {
                "name": CLASSES[class_id]["name"],
                "pixels": int(count),
                "area_sq_m": round(area_sq_m, 2), # Área em m²
                "percentage": round(float(percentage), 2)
            }

        result = {
            "carbon_credits": carbon_credits,
            "forest_analysis": forest_stats,
            "inference_time": round(inference_time, 3),
            "timestamp": datetime.now().isoformat(),
            "source_url": url,
            "image_size": f"{img_width}x{img_height}"
        }

        return jsonify({
            "success": True,
            "data": result
        })

    except Exception as e:
        logger.error(f"❌ Erro no cálculo de créditos: {e}")
        logger.error(traceback.format_exc())
        # Retorna o traceback completo no erro para facilitar o debug
        return jsonify({
            "success": False,
            "error": str(traceback.format_exc())
        }), 500

if __name__ == '__main__':
    # Carregar modelo na inicialização
    logger.info("🚀 Iniciando Veridis AI Service...")

    if load_model():
        logger.info("🎉 Serviço pronto!")
        app.run(host='0.0.0.0', port=5000, debug=False)
    else:
        logger.error("💥 Falha ao inicializar o serviço")
        exit(1)
