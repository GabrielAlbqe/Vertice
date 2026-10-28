const env = require('./env');
const mysql = require('mysql2');
const { AsyncLocalStorage } = require('node:async_hooks');
const context = new AsyncLocalStorage();
const pool = mysql.createPool({ host: env.DB_HOST || 'localhost', user: env.DB_USER,
  password: env.DB_PASSWORD, database: env.DB_NAME || 'valen', connectionLimit: 10,
  dateStrings: true, decimalNumbers: false, multipleStatements: false });
module.exports = {
  query(...args) { return (context.getStore() || pool).query(...args); },
  end(...args) { return pool.end(...args); },
  getConnection(...args) { return pool.getConnection(...args); },
  context,
};
