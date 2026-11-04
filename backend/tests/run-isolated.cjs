// Cria um banco vazio exclusivo. Nunca executa testes de escrita em valen.
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
require("dotenv").config({ path: path.join(__dirname, "../.env"), quiet: true });
const mysql = require("mysql2/promise");

(async () => {
  const database = `vertice_test_${Date.now()}`;
  const options = require('../config/environment').databaseOptions({...process.env, NODE_ENV:'test', DB_NAME:database});
  delete options.database;
  const connection = await mysql.createConnection({...options, multipleStatements:true});
  try {
    await connection.query(`CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
    await connection.query(`USE \`${database}\``);
    await connection.query(fs.readFileSync(path.join(__dirname, "../database/valen_atualizado.sql"), "utf8"));
    await connection.query(fs.readFileSync(path.join(__dirname, "../database/migrations/004_security_state.sql"), "utf8"));
  } finally {
    await connection.end();
  }
  console.log(`Banco isolado: ${database} (preservado para inspeção).`);
  const root = path.resolve(__dirname, "../..");
  const result = spawnSync(process.execPath, [
    path.join(root, "node_modules/jest/bin/jest.js"),
    "--roots", path.join(root, "backend"), "--runInBand", "--silent",
  ], { cwd: root, stdio: "inherit", env: { ...process.env, NODE_ENV: "test", DB_NAME: database, SECURITY_STORE:'memory', REGISTRATION_MODE: 'office', PHOTO_STORAGE_DRIVER:'local', PHOTO_STORAGE_PATH: path.join(root,'backend/storage/private/tests',database) } });
  process.exitCode = result.status ?? 1;
})().catch(error => {
  console.error("Falha na preparação dos testes:", error.code || "erro de configuração");
  process.exitCode = 1;
});
