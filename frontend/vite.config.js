import { defineConfig,loadEnv } from 'vite';
import {fileURLToPath} from 'node:url';
import react from '@vitejs/plugin-react';
import offlineShell from './offline-shell.js';
import {publicOrigins} from './scripts/public-origins.mjs';

export default defineConfig(({mode}) => {
  const env={...loadEnv(mode,fileURLToPath(new URL('.',import.meta.url)),''),...process.env};
  if(Object.keys(env).some(key=>/^VITE_.*(?:PASSWORD|SECRET|TOKEN|PRIVATE|ACCESS_KEY)/i.test(key)))throw Error('Segredos não podem ser definidos em variáveis VITE_.');
  if(env.VERTICE_DEPLOY_TARGET==='cloud'){
    publicOrigins(env);
  }
  return {plugins:[react(),offlineShell()],...(env.VERTICE_DEPLOY_TARGET==='cloud'?{define:{'import.meta.env.VITE_API_URL':JSON.stringify('/api')}}:{})};
});
