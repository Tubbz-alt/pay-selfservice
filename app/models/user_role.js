var sequelizeConfig = require('../utils/sequelize_config.js');
var sequelizeConnection = sequelizeConfig.sequelize;
var Sequelize = require('sequelize');

var UserRole = sequelizeConnection.define('user_role', {
    role_id: Sequelize.INTEGER,
    user_id: Sequelize.INTEGER
  },
  {
    tableName: 'user_role',
    indexes: [
      {
        name: 'userRoleIndex',
        unique: true,
        fields: ['user_id', 'role_id']
      }
    ]
  });

module.exports = {
  sequelize: UserRole,
};
