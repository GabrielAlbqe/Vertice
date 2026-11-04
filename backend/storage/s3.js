const {S3Client,PutObjectCommand,GetObjectCommand,DeleteObjectCommand}=require('@aws-sdk/client-s3');
const {Readable}=require('stream');
function createS3Store(env=process.env,client){
  if(!env.S3_BUCKET||!env.S3_REGION)throw Error('Configure S3_BUCKET e S3_REGION.');
  if(env.S3_ENDPOINT && new URL(env.S3_ENDPOINT).protocol!=='https:')throw Error('S3_ENDPOINT exige HTTPS.');
  const s3=client || new S3Client({region:env.S3_REGION,endpoint:env.S3_ENDPOINT || undefined,forcePathStyle:env.S3_FORCE_PATH_STYLE==='true',maxAttempts:2,requestHandler:{connectionTimeout:5000,requestTimeout:15000}});
  const prefix=(env.S3_PREFIX||'vertice/photos').replace(/^\/+|\/+$/g,'');
  if(!/^[a-zA-Z0-9/_-]+$/.test(prefix))throw Error('S3_PREFIX inválido.');
  const target=filename=>({Bucket:env.S3_BUCKET,Key:prefix+'/'+filename});
  return {
    async put(filename,buffer,sha256){await s3.send(new PutObjectCommand({...target(filename),Body:buffer,ContentType:'image/webp',ServerSideEncryption:'AES256',Metadata:{sha256}}));},
    async read(filename){try{const r=await s3.send(new GetObjectCommand(target(filename)));if(!r.Body)throw Error('Objeto sem conteúdo.');return typeof r.Body.pipe==='function'?r.Body:Readable.from(await r.Body.transformToByteArray());}catch(e){if(e.name==='NoSuchKey'||e.$metadata?.httpStatusCode===404){e.status=404;e.message='Foto não encontrada no armazenamento.';}throw e;}},
    async remove(filename){await s3.send(new DeleteObjectCommand(target(filename)));},
  };
}
module.exports={createS3Store};
