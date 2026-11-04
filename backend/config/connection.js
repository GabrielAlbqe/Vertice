const mysql = require("mysql2");
const { databaseOptions } = require('./environment');
const connection = mysql.createPool({...databaseOptions(),connectionLimit:5,maxIdle:5,idleTimeout:60000,waitForConnections:true,queueLimit:100});

connection.getConnection((err, acquired) => {
  if (err) {
    console.error(
      "❌ Erro ao conectar ao banco de dados MySQL:",
      err.code
    );
    return;
  }

  acquired.release();

  console.log(
    `✅ Conexão com MySQL realizada com sucesso (${process.env.DB_NAME})!`
  );
});

module.exports = connection;
