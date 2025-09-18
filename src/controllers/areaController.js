const { Area, User, Image } = require('../../database/models');

const createArea = async (req, res, next) => {
  try {
    const {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      totalArea, carbonCredits, isAllocated, buyerCnpj
    } = req.body;

    // Get user's CNPJ
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const areaData = {
      name,
      point1X, point1Y, point2X, point2Y,
      point3X, point3Y, point4X, point4Y,
      totalArea, carbonCredits, isAllocated, buyerCnpj,
      supplierCnpj: user.companyCnpj
    };

    const area = await Area.create(areaData);

    const areaWithSupplier = await Area.findByPk(area.id, {
      include: [{ model: User, as: 'supplier' }]
    });

    res.status(201).json({
      success: true,
      message: 'Área cadastrada com sucesso',
      data: { area: areaWithSupplier }
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

    // Check if user is the supplier (owner)
    const user = await User.findByPk(req.user.id);
    if (area.supplierCnpj !== user.companyCnpj) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o fornecedor pode calcular créditos desta área'
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

    const where = {};

    // Show areas where user is supplier or buyer
    if (user.userType === 'SUPPLIER') {
      where.supplierCnpj = user.companyCnpj;
    } else if (user.userType === 'BUYER') {
      where.buyerCnpj = user.companyCnpj;
    }

    if (req.query.isAllocated !== undefined) {
      where.isAllocated = req.query.isAllocated === 'true';
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

const uploadAreaImage = async (req, res, next) => {
  try {
    const { areaId, url, point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y } = req.body;

    const area = await Area.findByPk(areaId);
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
        error: 'Apenas o fornecedor pode fazer upload de imagem para esta área'
      });
    }

    // Check if image already exists for this area
    const existingImage = await Image.findOne({ where: { areaId } });
    if (existingImage) {
      await existingImage.update({
        url, point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y
      });

      res.json({
        success: true,
        message: 'Imagem atualizada com sucesso',
        data: { image: existingImage }
      });
    } else {
      const image = await Image.create({
        areaId, url, point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y
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