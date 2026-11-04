import {publicOrigins} from './public-origins.mjs';
export function cloudConfiguration(env){
  const domains=publicOrigins(env);
  const headers={
    'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer',
    'Strict-Transport-Security':'max-age=31536000','Permissions-Policy':'camera=(self), microphone=(), geolocation=()',
    'Content-Security-Policy':`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' ${domains.api}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`,
  };
  return {version:3,routes:[
    {src:'/(.*)',headers,continue:true},
    {src:'/api/(.*)',dest:domains.api+'/api/$1',headers:{'Cache-Control':'no-store','x-vercel-enable-rewrite-caching':'0'},transforms:[{type:'request.headers',op:'set',target:{key:'x-origin-secret'},args:'$ORIGIN_SECRET',env:['ORIGIN_SECRET']}]},
    {src:'/api',dest:domains.api+'/api',headers:{'Cache-Control':'no-store','x-vercel-enable-rewrite-caching':'0'},transforms:[{type:'request.headers',op:'set',target:{key:'x-origin-secret'},args:'$ORIGIN_SECRET',env:['ORIGIN_SECRET']}]},
    {src:'/sw.js',headers:{'Cache-Control':'no-cache'},continue:true},
    {src:'/assets/(.*)',headers:{'Cache-Control':'public, max-age=31536000, immutable'},continue:true},
    {handle:'filesystem'},
    {src:'/(.*)',dest:'/index.html',headers:{'Cache-Control':'no-store'}},
  ]};
}
