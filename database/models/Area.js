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
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    carbonCredits: {
      type: DataTypes.DECIMAL(12, 2),
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
    },
    link_image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'URL da imagem correspondente às coordenadas da área'
    }
  }, {
    tableName: 'areas'
  });

  Area.prototype.calculateAreaFromCoordinates = function() {
    console.log('🔥 NOVO CÓDIGO FUNCIONANDO! Auto-ordenação ativada!');

    // Create array of points from the 4 coordinates
    const points = [
      { x: parseFloat(this.point1X), y: parseFloat(this.point1Y) },
      { x: parseFloat(this.point2X), y: parseFloat(this.point2Y) },
      { x: parseFloat(this.point3X), y: parseFloat(this.point3Y) },
      { x: parseFloat(this.point4X), y: parseFloat(this.point4Y) }
    ];

    // Auto-order points to form a valid polygon
    const orderedPoints = this.autoOrderPoints(points);

    // Extract ordered x and y arrays
    const x = orderedPoints.map(p => p.x);
    const y = orderedPoints.map(p => p.y);

    // Calculate area using the Shoelace formula
    let area = 0;
    const n = 4;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += x[i] * y[j];
      area -= x[j] * y[i];
    }

    area = Math.abs(area) / 2;

    // Convert from decimal degrees to hectares using Haversine-based approximation
    // At the equator: 1 degree latitude ≈ 111.32 km
    // For longitude, it varies by latitude: 1 degree longitude ≈ 111.32 * cos(latitude) km

    // Calculate average latitude for longitude conversion
    const avgLatitude = (y[0] + y[1] + y[2] + y[3]) / 4;
    const latitudeRadians = Math.abs(avgLatitude) * Math.PI / 180;

    // Conversion factors (km per degree)
    const kmPerDegreeLat = 111.32;
    const kmPerDegreeLon = 111.32 * Math.cos(latitudeRadians);

    // Convert area from square degrees to square kilometers
    const areaInKm2 = area * kmPerDegreeLat * kmPerDegreeLon;

    // Convert square kilometers to hectares (1 km² = 100 hectares)
    const areaInHectares = areaInKm2 * 100;

    return Math.round(areaInHectares * 100) / 100;
  };

  Area.prototype.autoOrderPoints = function(points) {
    // Find the centroid (center point) of all coordinates
    const centroidX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const centroidY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    // Calculate angle from centroid to each point
    const pointsWithAngles = points.map(point => {
      const deltaX = point.x - centroidX;
      const deltaY = point.y - centroidY;
      const angle = Math.atan2(deltaY, deltaX);
      return { ...point, angle };
    });

    // Sort points by angle (counter-clockwise order)
    pointsWithAngles.sort((a, b) => a.angle - b.angle);

    // Return sorted points without angle property
    return pointsWithAngles.map(({ x, y }) => ({ x, y }));
  };

  Area.prototype.calculateCarbonCredits = function() {
    // Generate random carbon credits between 100 and 10000
    // This is a temporary implementation as requested
    const minCredits = 100;
    const maxCredits = 10000;
    const randomCredits = Math.floor(Math.random() * (maxCredits - minCredits + 1)) + minCredits;

    return randomCredits;
  };

  Area.associate = function(models) {
    // Area belongs to User (supplier) via CNPJ
    Area.belongsTo(models.User, {
      foreignKey: 'supplierCnpj',
      targetKey: 'companyCnpj',
      as: 'supplier'
    });

    // No direct relationship with Image - images are found by coordinate matching
  };

  return Area;
};