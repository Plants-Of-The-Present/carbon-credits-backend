const { Area, User, Image } = require('../../database/models');
const aiService = require('../services/aiService');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const MAP_SIZE = '600x400';
const MAP_TYPE = 'satellite';

/**
 * Calcula a distância de Haversine entre dois pontos em coordenadas GPS.
 * @returns {number} Distância em metros.
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Raio da Terra em metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Calcula o nível de zoom adequado para enquadrar um polígono em uma imagem estática.
 * @param {object[]} points - Array de objetos com 'lat' e 'lng' de cada ponto.
 * @param {number} imgWidth - Largura da imagem em pixels.
 * @param {number} imgHeight - Altura da imagem em pixels.
 * @returns {number} O nível de zoom calculado.
 */
const calculateZoom = (points, imgWidth, imgHeight) => {
  if (points.length < 2) return 15; // Zoom padrão se houver poucos pontos

  const lats = points.map(p => p.lat);
  const lngs = points.map(p => p.lng);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const avgLat = (minLat + maxLat) / 2;

  const horizontalDistance = haversineDistance(avgLat, minLng, avgLat, maxLng);
  const verticalDistance = haversineDistance(minLat, minLng, maxLat, minLng);
  
  const metersPerPixelHoriz = horizontalDistance / imgWidth;
  const metersPerPixelVert = verticalDistance / imgHeight;
  const metersPerPixel = Math.max(metersPerPixelHoriz, metersPerPixelVert);

  const EARTH_CIRCUMFERENCE_EQUATOR = 40075016.686;
  const m_per_pixel_equator = EARTH_CIRCUMFERENCE_EQUATOR / 256;

  let zoom = Math.floor(
    Math.log2(
      (m_per_pixel_equator * Math.cos(Math.abs(avgLat) * Math.PI / 180)) / metersPerPixel
    )
  );

  return Math.min(Math.max(zoom, 1), 20);
};

/**
 * Cria a URL para a imagem estática do Google Maps.
 * @param {string} centerPoint - Coordenadas do centro (lat,lng).
 * @param {number} zoom - Nível de zoom calculado.
 * @returns {string} URL completa da imagem.
 */
const getStaticMapUrl = (centerPoint, zoom) => {
  return `https://maps.googleapis.com/maps/api/staticmap?` +
         `size=${MAP_SIZE}&` +
         `maptype=${MAP_TYPE}&` +
         `center=${centerPoint}&` +
         `zoom=${zoom}&` +
         `key=${GOOGLE_MAPS_API_KEY}`;
};

const createArea = async (req, res, next) => {
  try {
    const {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      isAllocated, buyerCnpj
    } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const tempArea = Area.build({
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y
    });

    const calculatedArea = tempArea.calculateAreaFromCoordinates();

    let imageUrl = null;
    let calculatedCredits = 0;
    let aiAnalysis = null;
    let calculatedZoom = 0;

    try {
      const points = [
        { lat: point1Y, lng: point1X },
        { lat: point2Y, lng: point2X },
        { lat: point3Y, lng: point3X },
        { lat: point4Y, lng: point4X },
      ];
      
      const avgLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
      const avgLng = points.reduce((sum, p) => sum + p.lng, 0) / points.length;
      const centerPoint = `${avgLat},${avgLng}`;
      
      const [imgWidth, imgHeight] = MAP_SIZE.split('x').map(Number);
      calculatedZoom = calculateZoom(points, imgWidth, imgHeight);

      imageUrl = getStaticMapUrl(centerPoint, calculatedZoom);
      
      console.log(`URL da Imagem Gerada: ${imageUrl}`);
      console.log(`Zoom Calculado: ${calculatedZoom}`);
      
      try {
        console.log('🤖 Usando IA para calcular créditos de carbono...');
        const aiResult = await aiService.calculateCarbonCredits(imageUrl, avgLat, calculatedZoom);

        if (aiResult.success) {
          calculatedCredits = aiResult.carbonCredits;
          aiAnalysis = aiResult.forestAnalysis;
          console.log(`✅ IA calculou ${calculatedCredits} créditos de carbono`);
        } else {
          console.log('⚠️  IA indisponível, créditos definidos como 0');
          calculatedCredits = 0;
        }
      } catch (error) {
        console.error('❌ Erro na análise da IA:', error.message);
        console.log('⚠️  Fallback: créditos definidos como 0');
        calculatedCredits = 0;
      }

    } catch (error) {
      console.log('Erro ao buscar imagem correspondente:', error.message);
      imageUrl = null;
      calculatedCredits = 0;
    }

    const areaData = {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      isAllocated: isAllocated || false,
      buyerCnpj,
      supplierCnpj: user.companyCnpj,
      totalArea: calculatedArea,
      carbonCredits: calculatedCredits,
      link_image: imageUrl
    };

    const area = await Area.create(areaData);

    const areaWithSupplier = await Area.findByPk(area.id, {
      include: [{ model: User, as: 'supplier' }]
    });

    res.status(201).json({
      success: true,
      message: 'Área cadastrada com sucesso',
      data: {
        area: areaWithSupplier,
        calculations: {
          calculatedArea: calculatedArea,
          calculatedCredits: calculatedCredits,
          aiAnalysis: aiAnalysis,
          hasImage: !!imageUrl,
          usedAI: !!aiAnalysis
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAreas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const where = {};

    if (req.query.supplierCnpj) {
      where.supplierCnpj = req.query.supplierCnpj;
    }

    if (req.query.isAllocated !== undefined) {
      where.isAllocated = req.query.isAllocated === 'true';
    }

    if (req.query.buyerCnpj) {
      where.buyerCnpj = req.query.buyerCnpj;
    }

    const { count, rows: areas } = await Area.findAndCountAll({
      where,
      include: [
        { model: User, as: 'supplier' },
        { model: Image, as: 'image' }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    res.json({
      success: true,
      data: {
        areas,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAreaById = async (req, res, next) => {
  try {
    const area = await Area.findByPk(req.params.id, {
      include: [
        { model: User, as: 'supplier' },
        { model: Image, as: 'image' }
      ]
    });

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área não encontrada'
      });
    }

    // Check if user has access to this area
    const user = await User.findByPk(req.user.id);
    if (area.supplierCnpj !== user.companyCnpj && area.buyerCnpj !== user.companyCnpj) {
      return res.status(403).json({
        success: false,
        error: 'Acesso negado a esta área'
      });
    }

    res.json({
      success: true,
      data: { area }
    });
  } catch (error) {
    next(error);
  }
};

const updateArea = async (req, res, next) => {
  try {
    const area = await Area.findByPk(req.params.id);

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área não encontrada'
      });
    }

    // Check if user is the supplier (owner)
    const user = await User.findByPk(req.user.id);
    if (area.supplierCnpj !== user.companyCnpj) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o fornecedor pode atualizar esta área'
      });
    }

    const allowedUpdates = [
      'name', 'totalArea', 'carbonCredits', 'isAllocated', 'buyerCnpj',
      'point1X', 'point1Y', 'point2X', 'point2Y',
      'point3X', 'point3Y', 'point4X', 'point4Y'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    await area.update(updates);

    const updatedArea = await Area.findByPk(req.params.id, {
      include: [{ model: User, as: 'supplier' }]
    });

    res.json({
      success: true,
      message: 'Área atualizada com sucesso',
      data: { area: updatedArea }
    });
  } catch (error) {
    next(error);
  }
};

const deleteArea = async (req, res, next) => {
  try {
    const area = await Area.findByPk(req.params.id);

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área não encontrada'
      });
    }

    // Check if user is the supplier (owner)
    const user = await User.findByPk(req.user.id);
    if (area.supplierCnpj !== user.companyCnpj) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o fornecedor pode deletar esta área'
      });
    }

    // Check if area is allocated
    if (area.isAllocated) {
      return res.status(400).json({
        success: false,
        error: 'Não é possível deletar área já alocada'
      });
    }

    await area.destroy();

    res.json({
      success: true,
      message: 'Área deletada com sucesso'
    });
  } catch (error) {
    next(error);
  }
};

const calculateCarbonCredits = async (req, res, next) => {
  try {
    const area = await Area.findByPk(req.params.id);

    if (!area) {
      return res.status(404).json({
        success: false,
        error: 'Área não encontrada'
      });
    }

    // Check if user has access to this area (either as supplier or buyer)
    const user = await User.findByPk(req.user.id);
    if (area.supplierCnpj !== user.companyCnpj && area.buyerCnpj !== user.companyCnpj) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para calcular créditos desta área'
      });
    }

    const calculatedCredits = area.calculateCarbonCredits();

    await area.update({ carbonCredits: calculatedCredits });

    res.json({
      success: true,
      message: 'Créditos de carbono calculados com sucesso',
      data: {
        calculatedCredits,
        areaSize: area.totalArea,
        calculationDate: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMyAreas = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get user's CNPJ
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const { Op } = require('sequelize');
    const where = {};

    // Show areas where user is supplier OR buyer (both types can create and buy areas)
    if (user.userType === 'SUPPLIER') {
      where[Op.or] = [
        { supplierCnpj: user.companyCnpj },
        { buyerCnpj: user.companyCnpj }
      ];
    } else if (user.userType === 'BUYER') {
      where[Op.or] = [
        { supplierCnpj: user.companyCnpj },
        { buyerCnpj: user.companyCnpj }
      ];
    }

    if (req.query.isAllocated !== undefined) {
      where.isAllocated = req.query.isAllocated === 'true';
    }

    const { count, rows: areas } = await Area.findAndCountAll({
      where,
      include: [
        { model: User, as: 'supplier' }
      ],
      order: [['created_at', 'DESC']],
      offset,
      limit
    });

    // Areas já contêm link_image, não precisamos mais buscar imagens separadamente
    const areasData = areas.map(area => {
      const areaJson = area.toJSON();

      // Se tiver link_image, criar objeto image para compatibilidade com frontend
      if (areaJson.link_image) {
        areaJson.image = {
          url: areaJson.link_image
        };
      } else {
        areaJson.image = null;
      }

      return areaJson;
    });

    res.json({
      success: true,
      data: {
        areas: areasData,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          hasNext: page < Math.ceil(count / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const uploadAreaImage = async (req, res, next) => {
  try {
    const { url, point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y } = req.body;

    // Get user for authorization
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Check if image already exists for these coordinates
    const existingImage = await Image.findByCoordinates(
      point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y
    );

    if (existingImage) {
      await existingImage.update({ url });

      res.json({
        success: true,
        message: 'Imagem atualizada com sucesso',
        data: { image: existingImage }
      });
    } else {
      // Create new image with auto-ordered coordinates
      const tempArea = { point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y };
      const points = [
        { x: parseFloat(point1X), y: parseFloat(point1Y) },
        { x: parseFloat(point2X), y: parseFloat(point2Y) },
        { x: parseFloat(point3X), y: parseFloat(point3Y) },
        { x: parseFloat(point4X), y: parseFloat(point4Y) }
      ];

      // Auto-order coordinates
      const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

      const pointsWithAngles = points.map(point => {
        const deltaX = point.x - centroidX;
        const deltaY = point.y - centroidY;
        const angle = Math.atan2(deltaY, deltaX);
        return { ...point, angle };
      });

      pointsWithAngles.sort((a, b) => a.angle - b.angle);
      const orderedPoints = pointsWithAngles.map(({ x, y }) => ({ x, y }));

      const image = await Image.create({
        url,
        point1X: orderedPoints[0].x,
        point1Y: orderedPoints[0].y,
        point2X: orderedPoints[1].x,
        point2Y: orderedPoints[1].y,
        point3X: orderedPoints[2].x,
        point3Y: orderedPoints[2].y,
        point4X: orderedPoints[3].x,
        point4Y: orderedPoints[3].y
      });

      res.status(201).json({
        success: true,
        message: 'Imagem carregada com sucesso',
        data: { image }
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createArea,
  getAreas,
  getAreaById,
  updateArea,
  deleteArea,
  calculateCarbonCredits,
  getMyAreas,
  uploadAreaImage
};