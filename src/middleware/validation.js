const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    next();
  };
};

const schemas = {
  register: Joi.object({
    username: Joi.string().min(2).max(100).required().messages({
      'string.min': 'Username deve ter pelo menos 2 caracteres',
      'string.max': 'Username deve ter no máximo 100 caracteres',
      'any.required': 'Username é obrigatório'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'any.required': 'Senha é obrigatória'
    }),
    userType: Joi.string().valid('BUYER', 'SUPPLIER').required().messages({
      'any.only': 'Tipo de usuário deve ser: BUYER ou SUPPLIER',
      'any.required': 'Tipo de usuário é obrigatório'
    }),
    companyName: Joi.string().max(200).required().messages({
      'string.max': 'Nome da empresa deve ter no máximo 200 caracteres',
      'any.required': 'Nome da empresa é obrigatório'
    }),
    companyCnpj: Joi.string().pattern(/^\d{14}$/).required().messages({
      'string.pattern.base': 'CNPJ deve ter 14 dígitos',
      'any.required': 'CNPJ é obrigatório'
    })
  }),

  login: Joi.object({
    username: Joi.string().required().messages({
      'any.required': 'Username é obrigatório'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Senha é obrigatória'
    })
  }),

  area: Joi.object({
    name: Joi.string().min(1).max(100).required().messages({
    'string.min': 'Nome da área é obrigatório',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome da área é obrigatório'
    }),
    point1X: Joi.number().required().messages({
      'any.required': 'Coordenada point1X é obrigatória'
    }),
    point1Y: Joi.number().required().messages({
      'any.required': 'Coordenada point1Y é obrigatória'
    }),
    point2X: Joi.number().required(),
    point2Y: Joi.number().required(),
    point3X: Joi.number().required(),
    point3Y: Joi.number().required(),
    point4X: Joi.number().required(),
    point4Y: Joi.number().required(),
    totalArea: Joi.number().positive().required().messages({
      'any.required': 'Total da área é obrigatório',
      'number.positive': 'Total da área deve ser um número positivo'
    }),
    carbonCredits: Joi.number().positive().required().messages({
      'any.required': 'Créditos de carbono são obrigatórios',
      'number.positive': 'Créditos de carbono devem ser positivos'
    }),
    isAllocated: Joi.boolean().default(false),
    buyerCnpj: Joi.string().pattern(/^\d{14}$/).allow(null).messages({
      'string.pattern.base': 'CNPJ do comprador deve ter 14 dígitos'
    })
  })
};

module.exports = {
  validateRequest,
  schemas
};