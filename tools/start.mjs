import nextEnv from "@next/env";
import { existsSync } from "node:fs";
const args=process.argv.slice(2);
const index=args.indexOf("--port");
if(index>=0){const port=Number(args[index+1]);if(!Number.isInteger(port)||port<1||port>65535)throw new Error("Invalid port");process.env.PORT=String(port);}
process.env.HOSTNAME=process.env.QUIETSPACE_HOST ?? "127.0.0.1";
process.env.NODE_ENV="production";
nextEnv.loadEnvConfig(process.cwd(),false);
if(!existsSync(new URL("../.next/standalone/server.js",import.meta.url)))throw new Error("Run npm run build first.");
await import("../.next/standalone/server.js");
