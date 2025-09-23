const { Area, User, Image } = require('../../database/models');

const createArea = async (req, res, next) => {
  try {
    const {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      isAllocated, buyerCnpj
    } = req.body;

    // Get user's CNPJ
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Create temporary area instance to calculate values
    const tempArea = Area.build({
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y
    });

    // Calculate area and credits BEFORE creating in database
    const calculatedArea = tempArea.calculateAreaFromCoordinates();
    const calculatedCredits = tempArea.calculateCarbonCredits();

    // Create area with calculated values
    const areaData = {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      isAllocated: isAllocated || false,
      buyerCnpj,
      supplierCnpj: user.companyCnpj,
      totalArea: calculatedArea,
      carbonCredits: calculatedCredits
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
          calculatedCredits: calculatedCredits
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

    // Find images by coordinates for each area
    const areasWithImages = await Promise.all(areas.map(async (area) => {
      const image = await Image.findByCoordinates(
        area.point1X, area.point1Y, area.point2X, area.point2Y,
        area.point3X, area.point3Y, area.point4X, area.point4Y
      );

      return {
        ...area.toJSON(),
        image
      };
    }));

    res.json({
      success: true,
      data: {
        areas: areasWithImages,
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