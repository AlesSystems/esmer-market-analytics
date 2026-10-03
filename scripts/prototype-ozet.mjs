import { context } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
const output = "work/ozet-prototype";
await mkdir(output,{recursive:true});
await writeFile(`${output}/index.html`, '<!doctype html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Özet prototipleri</title><link rel="stylesheet" href="/app.css"></head><body><div id="root"></div><script type="module" src="/app.js"></script></body></html>');
const build=await context({entryPoints:["src/ui/overview/prototype/OzetPrototype.tsx"],outfile:`${output}/app.js`,bundle:true,platform:"browser",format:"esm",sourcemap:true,loader:{".woff2":"file"},define:{"process.env.NODE_ENV":'"development"'}});
await build.watch();
const server=await build.serve({servedir:output,host:"127.0.0.1",port:4173});
console.log(`Özet prototypes: http://${server.hosts[0]}:${server.port}/?variant=A`);
