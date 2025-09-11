// backend/config.js
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development-only';
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const DB_PATH = process.env.DB_PATH || './development.db';
const UPLOADS_DIR = process.env.UPLOADS_DIR || './uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10485760; // 10MB
const ALLOWED_FILE_TYPES = process.env.ALLOWED_FILE_TYPES ? 
  process.env.ALLOWED_FILE_TYPES.split(',') : 
  ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 
   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
   'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

module.exports = {
  JWT_SECRET,
  PORT,
  NODE_ENV,
  DB_PATH,
  UPLOADS_DIR,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES
};