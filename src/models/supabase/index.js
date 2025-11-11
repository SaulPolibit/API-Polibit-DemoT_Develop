// models/supabase/index.js
// Centralized exports for all Supabase models

const User = require('./user');
const Company = require('./company');
const NotificationSettings = require('./notificationSettings');
const Project = require('./project');
const SmartContract = require('./smartContract');

module.exports = {
  User,
  Company,
  NotificationSettings,
  Project,
  SmartContract,
};
