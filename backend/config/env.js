const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
if (process.env.NODE_ENV === 'test' && process.env.DB_NAME !== 'valen_testes') {
  throw new Error('Testes exigem DB_NAME=valen_testes. Conexão recusada.');
}
if (!process.env.JWT_SECRET || Buffer.byteLength(process.env.JWT_SECRET) < 32) {
  throw new Error('Configure JWT_SECRET com pelo menos 32 bytes no backend/.env.');
}
module.exports = process.env;
