import { cpSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { resolve, join, relative } from "node:path";
const root = resolve(import.meta.dirname,"..");
const output = join(root,".next/standalone");
if (!existsSync(join(output,"server.js"))) throw new Error("Build the standalone app first.");
cpSync(join(root,"public"),join(output,"public"),{recursive:true});
cpSync(join(root,".next/static"),join(output,".next/static"),{recursive:true});
for (const file of readdirSync(output,{withFileTypes:true})) {
  if (file.isFile() && file.name.startsWith(".env") && file.name !== ".env.example") {
    const target=join(output,file.name);
    if (relative(output,target).startsWith("..")) throw new Error("Invalid package path");
    unlinkSync(target);
  }
}
console.log("Standalone app packaged with local assets; no environment files included.");
