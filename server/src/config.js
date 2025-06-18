require('dotenv').config();

module.exports = {
  AIS_API_KEY: process.env.AIS_API_KEY,
  DB_URI: process.env.DB_URI,
  PORT: process.env.PORT || 3000,
};