var User = require(__dirname + '/../../app/models/user.js');
var Permission = require(__dirname + '/../../app/models/permission.js');
var Role = require(__dirname + '/../../app/models/role.js');
var UserRole = require(__dirname + '/../../app/models/user_role.js');

function sync_db() {
  return Permission.sequelize.sync({force: true})
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => User.sequelize.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}))
}

function create(user, permissionName, done) {
  var roleDef;
  var permissionDef;
  return sync_db()
    .then(()=> Permission.sequelize.create({name: permissionName, description: 'Permission Desc'}))
    .then((permission)=> permissionDef = permission)
    .then(()=> Role.sequelize.create({name: 'Role', description: "Role Desc"}))
    .then((role)=> roleDef = role)
    .then(()=> roleDef.setPermissions([permissionDef]))
    .then(()=> User.create(user, roleDef))
    .then(()=> {if(done) done()});
}

module.exports = {
  create: create
};
