import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const files = { '/': ['index.html', 'text/html'], '/index.html': ['index.html', 'text/html'], '/prototype.css': ['prototype.css', 'text/css'], '/prototype.js': ['prototype.js', 'text/javascript'] };
const server = createServer(async (request, response) => {
  const file = files[new URL(request.url, 'http://localhost').pathname];
  if (!file) { response.writeHead(404); response.end(); return; }
  try {
    response.writeHead(200, { 'Content-Type': `${file[1]}; charset=utf-8`, 'Cache-Control': 'no-store' });
    response.end(await readFile(new URL(file[0], import.meta.url)));
  } catch { response.writeHead(500); response.end('Prototype file unavailable'); }
});
server.listen(4178, '127.0.0.1', () => console.log('Esmer prototype: http://127.0.0.1:4178/?variant=A'));
