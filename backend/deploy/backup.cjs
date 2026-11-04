const {databaseOptions}=require('../config/environment');
function dumpArguments(env,output,caPath){
  const config=databaseOptions(env);
  if(!output)throw Error('Informe o arquivo privado de backup.');
  if(env.DB_SSL_CA_BASE64&&!caPath)throw Error('A CA deve estar disponível em arquivo temporário para o mysqldump.');
  return ['--host='+config.host,'--port='+config.port,'--user='+config.user,
    '--ssl-mode='+(config.ssl?'VERIFY_IDENTITY':'PREFERRED'),
    ...(config.ssl&&(caPath||env.DB_SSL_CA_PATH)?['--ssl-ca='+(caPath||env.DB_SSL_CA_PATH)]:[]),
    '--single-transaction','--routines','--events','--triggers','--hex-blob','--no-tablespaces',
    '--set-gtid-purged=OFF','--result-file='+output,config.database];
}
module.exports={dumpArguments};
