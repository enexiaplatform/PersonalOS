/** Export the canonical CSS recipes for isolated, independently published workspaces.
 * Usage: node scripts/export-design-system.mjs /absolute/output.css
 * The generated file contains no private source or data. */
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const app=fileURLToPath(new URL('../apps/personal-os-v1/',import.meta.url));
export async function bundleCSS(file,ancestors=[]){const path=resolve(file);if(ancestors.includes(path))throw Error('CSS import cycle: '+path);let css=await readFile(path,'utf8');const imports=[...css.matchAll(/@import\s+url\(["']([^"']+)["']\);/g)];for(const match of imports)css=css.replace(match[0],await bundleCSS(resolve(dirname(path),match[1]),[...ancestors,path]));return css;}
if(process.argv[1]===fileURLToPath(import.meta.url)){if(!process.argv[2])throw Error('Output CSS path required');let css='/* Generated from PersonalOS design-system v2. Run export-design-system.mjs to update. */\n'+await bundleCSS(app+'tokens.css')+'\n'+await bundleCSS(app+'design-system/components.css');css=css.replaceAll("url('../fonts/","url('/fonts/");css=css.replaceAll("url('/assets/henry-cosmos.webp')","url('/henry-cosmos.webp')");await writeFile(resolve(process.argv[2]),css);console.log('Exported shared foundations and recipes.');}
