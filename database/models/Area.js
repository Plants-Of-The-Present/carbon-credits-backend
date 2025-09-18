module.exports = (sequelize, DataTypes) => {
  const Area = sequelize.define('Area', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100]
      }
    },
    point1X: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    point1Y: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    point2X: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    point2Y: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    point3X: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    point3Y: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    point4X: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
      validate: {
        min: -180,
        max: 180
      }
    },
    point4Y: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
      validate: {
        min: -90,
        max: 90
      }
    },
    totalArea: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    carbonCredits: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    isAllocated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    buyerCnpj: {
      type: DataTypes.STRING(14),
      allowNull: true,
      validate: {
        len: [14, 14]
      }
    },
    supplierCnpj: {
      type: DataTypes.STRING(14),
      allowNull: false,
      validate: {
        len: [14, 14]
      }
    }
  }, {
    tableName: 'areas'
  });

  Area.prototype.calculateAreaFromCoordinates = function() {
    // Calculate area using the Shoelace formula (for simple polygons)
    const x = [this.point1X, this.point2X, this.point3X, this.point4X];
    const y = [this.point1Y, this.point2Y, this.point3Y, this.point4Y];

    let area = 0;
    const n = 4;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += x[i] * y[j];
      area -= x[j] * y[i];
    }

    area = Math.abs(area) / 2;

    // Convert from degrees to hectares (rough approximation)
    // 1 degree ≈ 111 km, so 1 square degree ≈ 12321 km² ≈ 1,232,100 hectares
    const areaInHectares = area * 1232100;

    return Math.round(areaInHectares * 100) / 100;
  };

  Area.prototype.calculateCarbonCredits = function() {
    const baseRate = 10; // tons CO2/hectare/year
    const annualCredits = this.totalArea * baseRate;
    return Math.round(annualCredits * 100) / 100;
  };

  Area.associate = function(models) {
    // Area belongs to User (supplier) via CNPJ
    Area.belongsTo(models.User, {
      foreignKey: 'supplierCnpj',
      targetKey: 'companyCnpj',
      as: 'supplier'
    });

    // Area has one Image (1:1 relationship)
    Area.hasOne(models.Image, {
      foreignKey: 'areaId',
      as: 'image'
    });
  };

  return Area;
};