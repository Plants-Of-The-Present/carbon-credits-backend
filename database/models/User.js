const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 100]
      }
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    userType: {
      type: DataTypes.ENUM('BUYER', 'SUPPLIER'),
      allowNull: false
    },
    companyCnpj: {
      type: DataTypes.STRING(14),
      allowNull: false,
      unique: true,
      validate: {
        len: [14, 14]
      }
    }
  }, {
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      }
    }
  });

  User.prototype.comparePassword = async function(candidatePassword) {
    console.log('Senha enviada:', candidatePassword); // senha crua enviada
    console.log('Hash no banco:', this.password);     // hash armazenado
    return await bcrypt.compare(candidatePassword, this.password);
  };

  User.prototype.toJSON = function() {
    const values = { ...this.dataValues };
    delete values.password;
    return values;
  };

  User.associate = function(models) {
    // User has many Areas as supplier (1:N relationship)
    User.hasMany(models.Area, {
      foreignKey: 'supplierCnpj',
      sourceKey: 'companyCnpj',
      as: 'areas'
    });
  };

  return User;
};