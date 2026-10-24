import { existsSync,readdirSync,readFileSync } from "node:fs";
import { join } from "node:path";
function files(root){return readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(root,entry.name)):[join(root,entry.name)]);}
const artifact=".next/standalone";
if(!existsSync(join(artifact,"server.js")))throw new Error("Production artifact is missing.");
if(readdirSync(artifact).some(name=>name.startsWith('.env')&&name!=='.env.example'))throw new Error("Environment file present in production artifact.");
const secrets=[];
if(existsSync('.env.local'))for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)){
  const match=line.match(/^(DATABASE_URL|LOCAL_OPERATOR_DATABASE_URL|SUPABASE_SERVICE_ROLE_KEY|REPORT_ABUSE_SECRET)=(.+)$/);
  if(match&&match[2].length>=16)secrets.push(match[2]);
}
const clientFiles=files('.next/static').filter(path=>path.endsWith('.js'));
for(const file of clientFiles){const source=readFileSync(file,'utf8');if(secrets.some(secret=>source.includes(secret)))throw new Error("A private configuration value was found in browser assets.");}
console.log(`Release check passed: ${clientFiles.length} client JavaScript assets scanned; no local secret values or packaged environment files.`);
