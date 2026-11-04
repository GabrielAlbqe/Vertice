// Operação manual: aceita apenas bancos de teste, nunca o banco principal.
const fs = require('fs/promises');
const path = require('path');
const {databaseOptions} = require('../config/environment');
const executeSql = require('./executeSql');

function migrationOptions(env) {
  if (!/^vertice_test_[a-z0-9_]+$/.test(env.DB_NAME || '')) {
    throw Error('Migrações locais exigem DB_NAME com prefixo vertice_test_; valen e produção são bloqueados.');
  }
  return databaseOptions({...env, NODE_ENV:'test'});
}

async function migrate(env = process.env) {
  const options = migrationOptions(env);
  const connection = await require('mysql2/promise').createConnection(options);
  try {
    const directory = path.join(__dirname, 'migrations');
    const files = (await fs.readdir(directory)).filter(name => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
    // Uma conexão fixa mantém variáveis e procedimentos das migrações no mesmo banco.
    for (const file of files) {
      await executeSql(connection, await fs.readFile(path.join(directory, file), 'utf8'));
      console.log(`Migração concluída: ${file}`);
    }
  } finally {
    await connection.end();
  }
}

module.exports = {migrationOptions, migrate};
if (require.main === module) migrate().catch(error => {
  console.error('Migração interrompida:', error.code || error.message);
  process.exitCode = 1;
});
