const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Pa55w.rd!", // <--- Coloque a sua senha do MySQL aqui
  database: "valen"
});

//oi

connection.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco de dados MySQL:", err.message);
    return;
  }
  console.log("✅ Conexão com o banco de dados MySQL realizada com sucesso!");
});

module.exports = connection;