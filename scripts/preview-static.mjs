// Loopback-only review server. Mirrors static directory redirects/404s; no production APIs.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
const root = resolve('dist');
const port = Number(process.env.PREVIEW_PORT || 4175);
const bookingRedirects = JSON.parse(readFileSync(new URL('../firebase.json', import.meta.url), 'utf8')).hosting.redirects;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8'};
createServer(async(req,res)=>{
  try {
    const url = new URL(req.url,'http://127.0.0.1');
    const path = decodeURIComponent(url.pathname);
    let file = resolve(root, '.' + path);
    if (file !== root && !file.startsWith(root+sep)) {res.writeHead(400);res.end();return;}
    const booking = bookingRedirects.find(entry => entry.regex && new RegExp(entry.regex).test(path));
    if (booking) {res.writeHead(booking.type,{Location:booking.destination});res.end();return;}
    let info = await stat(file).catch(()=>null);
    if (info?.isDirectory()) {
      if (!path.endsWith('/')) {res.writeHead(301,{Location:path+'/'+url.search});res.end();return;}
      file = resolve(file,'index.html'); info=await stat(file).catch(()=>null);
    }
    const status = info?.isFile() ? 200 : 404;
    if(status===404) file=resolve(root,'404.html');
    let data=await readFile(file);
    // Do not contaminate production analytics with local review visits.
    if(extname(file)==='.html') data=Buffer.from(data.toString().replace(/<script\b[^>]*src=["']https:\/\/cloud\.umami\.is\/script\.js["'][^>]*><\/script>/gi,''));
    res.writeHead(status,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Robots-Tag':'noindex'});
    res.end(data);
  } catch {res.writeHead(400);res.end('Invalid request');}
}).listen(port,'127.0.0.1',()=>console.log(`Review preview: http://127.0.0.1:${port}/aec-proposal-software-guide/`));
