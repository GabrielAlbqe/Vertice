const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Vertice123!",
  database: process.env.DB_NAME || "valen"
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados MySQL:", err.message);
    return;
  }
  console.log(`✅ Conexão com MySQL realizada com sucesso (${process.env.DB_NAME || "valen"})!`);
});

module.exports = connection;
