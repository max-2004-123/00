import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.txt':'text/plain' };
const port = Number(process.env.PORT || 5173);
http.createServer(async (req,res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const filename = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!filename.startsWith(root + path.sep) || path.relative(root, filename).split(path.sep).some(p=>p.startsWith('.'))) {
      res.writeHead(403).end('Forbidden'); return;
    }
    const data = await readFile(filename);
    res.writeHead(200, {'Content-Type':mime[path.extname(filename)] || 'application/octet-stream','Cache-Control':'no-cache'}).end(data);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port,'127.0.0.1',()=>console.log(`VOIDLINE ready at http://localhost:${port}`));
