module.exports = (sequelize, DataTypes) => {
  const Image = sequelize.define('Image', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false
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
    // Removed areaId - images are now identified by coordinates only
  }, {
    tableName: 'images'
  });

  // Helper method to find image by coordinates
  Image.findByCoordinates = async function(point1X, point1Y, point2X, point2Y, point3X, point3Y, point4X, point4Y) {
    // Auto-order coordinates using the same algorithm as Area model
    const points = [
      { x: parseFloat(point1X), y: parseFloat(point1Y) },
      { x: parseFloat(point2X), y: parseFloat(point2Y) },
      { x: parseFloat(point3X), y: parseFloat(point3Y) },
      { x: parseFloat(point4X), y: parseFloat(point4Y) }
    ];

    // Calculate centroid and order points
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

    // Search for image with these ordered coordinates
    return await Image.findOne({
      where: {
        point1X: orderedPoints[0].x,
        point1Y: orderedPoints[0].y,
        point2X: orderedPoints[1].x,
        point2Y: orderedPoints[1].y,
        point3X: orderedPoints[2].x,
        point3Y: orderedPoints[2].y,
        point4X: orderedPoints[3].x,
        point4Y: orderedPoints[3].y
      }
    });
  };

  Image.associate = function(models) {
    // No direct association with Area anymore - relationship is coordinate-based
  };

  return Image;
};