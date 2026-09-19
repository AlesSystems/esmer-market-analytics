// Throwaway, local-only wireframe entry. Production builds never import this file.
import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
const bundle = await build({ entryPoints: ['src/ui/sales-prototype.tsx'], bundle: true, write: false, platform: 'browser', define: { 'process.env.NODE_ENV': '"development"' } });
const css = await readFile('src/ui/sales-prototype.css');
const html = '<!doctype html><html lang="tr"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Esmer Market · Satış akışı taslağı</title><link rel="stylesheet" href="/style.css"><div id="root"></div><script src="/app.js"></script></html>';
const files = { '/': [html, 'text/html; charset=utf-8'], '/app.js': [bundle.outputFiles[0].contents, 'text/javascript; charset=utf-8'], '/style.css': [css, 'text/css; charset=utf-8'] };
createServer((req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  res.writeHead(file ? 200 : 404, { 'Content-Type': file?.[1] ?? 'text/plain', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(file?.[0] ?? 'Not found');
}).listen(4175, '127.0.0.1', () => console.log('Sales wireframe: http://127.0.0.1:4175/?variant=A'));
