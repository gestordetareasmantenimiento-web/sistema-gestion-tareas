// db/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'development.db'); // '..' para subir un nivel y encontrar el archivo
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error al conectar con la base de datos:", err.message);
  } else {
    console.log("Conectado exitosamente a la base de datos SQLite.");
  }
});

module.exports = db;