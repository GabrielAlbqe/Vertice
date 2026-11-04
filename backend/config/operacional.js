const mysql = require('mysql2/promise');
const {databaseOptions}=require('./environment');
// connection.js carrega e valida o ambiente antes de importar as rotas.
const pool = mysql.createPool({
  ...databaseOptions(), connectionLimit: 5, maxIdle:5, idleTimeout:60000,
  waitForConnections:true, queueLimit:100, dateStrings: true,
});
pool.on('connection', connection => connection.query("SET time_zone = '+00:00'"));
module.exports = pool;
