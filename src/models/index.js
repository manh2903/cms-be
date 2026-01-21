const sequelize = require('../config/db');
const User = require('./User');
const Post = require('./Post');

// Set up associations if needed
Post.belongsTo(User, { as: 'creator', foreignKey: 'created_by' });
Post.belongsTo(User, { as: 'updater', foreignKey: 'updated_by' });

module.exports = {
  sequelize,
  User,
  Post
};
