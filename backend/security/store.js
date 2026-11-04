const crypto=require('crypto');
class MemoryStore{
  constructor(){this.entries=new Map();}
  clean(){const now=Date.now();for(const [key,item]of this.entries)if(item.until<=now)this.entries.delete(key);}
  async get(key){const item=this.entries.get(key);return item?.until>Date.now()?item.value:null;}
  async set(key,value,until){this.clean();if(this.entries.size>=100000&&!this.entries.has(key))throw Error('SECURITY_CAPACITY');this.entries.set(key,{value,until});}
  async count(key,windowMs){this.clean();const now=Date.now(),old=this.entries.get(key);const value={count:(old?.value.count||0)+1,until:old?.until||now+windowMs};await this.set(key,value,value.until);return value;}
}
class MysqlStore{
  constructor(pool){this.pool=pool;this.operations=0;}
  async clean(){if(++this.operations%100===0)await this.pool.query('DELETE FROM vertice_security_state WHERE expira_em<=? LIMIT 100',[Date.now()]);}
  async get(key){const [rows]=await this.pool.query('SELECT valor FROM vertice_security_state WHERE chave=? AND expira_em>?',[key,Date.now()]);const v=rows[0]?.valor;return typeof v==='string'?JSON.parse(v):v||null;}
  async set(key,value,until){await this.clean();await this.pool.query('INSERT INTO vertice_security_state(chave,valor,expira_em) VALUES (?,?,?) ON DUPLICATE KEY UPDATE valor=VALUES(valor),expira_em=VALUES(expira_em)',[key,JSON.stringify(value),until]);}
  async count(key,windowMs){
    await this.clean();
    const c=await this.pool.getConnection(),now=Date.now();
    try{await c.beginTransaction();
      await c.query('INSERT INTO vertice_security_state(chave,valor,contador,expira_em) VALUES (?,JSON_OBJECT(),1,?) ON DUPLICATE KEY UPDATE contador=IF(expira_em<=?,1,contador+1),expira_em=IF(expira_em<=?,VALUES(expira_em),expira_em)',[key,now+windowMs,now,now]);
      const [rows]=await c.query('SELECT contador,expira_em FROM vertice_security_state WHERE chave=?',[key]);await c.commit();return {count:Number(rows[0].contador),until:Number(rows[0].expira_em)};
    }catch(e){await c.rollback();throw e;}finally{c.release();}
  }
}
let singleton;
function getStore(){if(!singleton){const driver=process.env.SECURITY_STORE||'memory';if(driver==='memory'&&process.env.NODE_ENV!=='production')singleton=new MemoryStore();else if(driver==='mysql')singleton=new MysqlStore(require('../config/operacional'));else throw Error('SECURITY_STORE_INVALID');}return singleton;}
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
module.exports={MemoryStore,MysqlStore,getStore,digest};
