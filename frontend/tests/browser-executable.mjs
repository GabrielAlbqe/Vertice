import {existsSync} from 'node:fs';
import path from 'node:path';
export function browserCandidates(env=process.env,platform=process.platform){
 const explicit=env.VERTICE_BROWSER_EXECUTABLE||env.CHROME_BIN||env.CHROME_PATH;if(explicit)return [explicit];
 if(platform==='win32')return [path.win32.join(env.PROGRAMFILES||'C:\\Program Files','Google','Chrome','Application','chrome.exe'),path.win32.join(env.LOCALAPPDATA||'C:\\Users\\Default\\AppData\\Local','Google','Chrome','Application','chrome.exe')];
 if(platform==='darwin')return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
 return ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'];
}
export function resolveBrowserExecutable(env=process.env,platform=process.platform,exists=existsSync){const selected=browserCandidates(env,platform).find(file=>exists(file));if(!selected)throw Error('Chrome não encontrado. Configure VERTICE_BROWSER_EXECUTABLE para um navegador instalado e autorizado.');return selected;}
