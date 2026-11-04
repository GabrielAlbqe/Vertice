const {databaseOptions}=require('../config/environment');
function accountStatements(env){
  databaseOptions({...env,NODE_ENV:'production'});
  if(!/^[a-zA-Z][a-zA-Z0-9_]{0,31}$/.test(env.DB_USER)||/^root|admin$/i.test(env.DB_USER))throw Error('Use um usuário exclusivo da aplicação.');
  if(!/^[a-zA-Z0-9_]+$/.test(env.DB_NAME))throw Error('DB_NAME inválido.');
  if(!env.DB_ACCOUNT_HOST||/[%_]/.test(env.DB_ACCOUNT_HOST))throw Error('DB_ACCOUNT_HOST exige host/rede autorizada sem curingas.');
  if(env.DB_PASSWORD.length<20||new Set(env.DB_PASSWORD).size<8)throw Error('Use uma senha exclusiva e aleatória com pelo menos 20 caracteres.');
  return [
    {sql:'CREATE USER ?@? IDENTIFIED BY ? REQUIRE SSL',values:[env.DB_USER,env.DB_ACCOUNT_HOST,env.DB_PASSWORD]},
    {sql:'GRANT SELECT, INSERT, UPDATE, DELETE ON ??.* TO ?@?',values:[env.DB_NAME,env.DB_USER,env.DB_ACCOUNT_HOST]},
  ];
}
async function provisionAccount(adminConnection,env,{authorized=false}={}){
  if(!authorized)throw Error('Provisionamento exige autorização explícita.');
  for(const statement of accountStatements(env))await adminConnection.query(statement.sql,statement.values);
}
module.exports={accountStatements,provisionAccount};
