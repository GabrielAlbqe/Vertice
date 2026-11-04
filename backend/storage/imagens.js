const fs = require('fs/promises');
const {createReadStream}=require('fs');
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const { fail } = require('../utils/operacional');
const directory = path.resolve(process.env.PHOTO_STORAGE_PATH || path.join(__dirname, 'private/photos'));
function localDevelopment() {
  if (process.env.NODE_ENV === 'production') fail(503, 'Fotos em produção exigem um driver de armazenamento privado em nuvem.');
}
let remote;
function driver(){
  const name=process.env.PHOTO_STORAGE_DRIVER || 'local';
  if(name==='s3'){if(!remote)remote=require('./s3').createS3Store();return remote;}
  if(name!=='local')fail(503,'Driver de imagens inválido.');
  localDevelopment();return null;
}
// Interface local privada. Implementar put/read/remove em driver de object storage na nuvem.
async function put(input) {
  const store=driver();
  if (!Buffer.isBuffer(input) || !input.length || input.length > 5 * 1024 * 1024) fail(400, 'Selecione uma foto de até 5 MB.');
  let buffer;
  try {
    const image = sharp(input, { limitInputPixels: 25000000, animated: false, failOn: 'warning' });
    const info = await image.metadata();
    if (!['jpeg','png','webp'].includes(info.format) || (info.pages || 1) > 1) fail(400, 'Use uma imagem JPEG, PNG ou WebP sem animação.');
    // Decodifica e recodifica, remove EXIF/GPS e ignora nome/extensão enviados pelo cliente.
    buffer = await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  } catch (e) { if (e.status) throw e; fail(400, 'Arquivo de imagem inválido ou corrompido.'); }
  const filename = crypto.randomUUID() + '.webp';
  const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
  if(store)await store.put(filename,buffer,sha256);
  else {await fs.mkdir(directory,{recursive:true,mode:0o700});await fs.writeFile(path.join(directory,filename),buffer,{flag:'wx',mode:0o600});}
  return { arquivo: filename, mime: 'image/webp', tamanho: buffer.length, sha256 };
}
function location(filename) {
  localDevelopment();
  if (!/^[0-9a-f-]{36}\.webp$/.test(filename)) fail(500, 'Referência de imagem inválida.');
  return path.join(directory, filename);
}
function valid(filename){if(!/^[0-9a-f-]{36}\.webp$/.test(filename))fail(500,'Referência de imagem inválida.');}
async function read(filename){valid(filename);const store=driver();if(store)return store.read(filename);const file=location(filename);try{await fs.access(file);}catch(e){if(e.code==='ENOENT'){e.status=404;e.message='Foto não encontrada.';}throw e;}return createReadStream(file);}
async function remove(filename) {valid(filename);const store=driver();if(store)return store.remove(filename);await fs.unlink(location(filename)).catch(e => { if (e.code !== 'ENOENT') throw e; }); }
module.exports = { put, location, read, remove };
