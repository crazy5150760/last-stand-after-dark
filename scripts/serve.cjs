'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {root}=require('./lib/project.cjs');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.css':'text/css','.png':'image/png','.webp':'image/webp','.ogg':'audio/ogg'};
function createServer({directory=path.join(root,'web-dist'),base='/last-stand-after-dark/'}={}){
 const absolute=path.resolve(directory);
 return http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return;}
  if(pathname===base.slice(0,-1)){res.writeHead(302,{Location:base}).end();return;}
  if(!pathname.startsWith(base)){res.writeHead(404).end();return;}
  let target=path.resolve(absolute,pathname.slice(base.length)||'index.html');
  if(!target.startsWith(absolute+path.sep)){res.writeHead(403).end();return;}
  if(fs.existsSync(target)&&fs.statSync(target).isDirectory())target=path.join(target,'index.html');
  if(!fs.existsSync(target)||!fs.statSync(target).isFile()){res.writeHead(404).end();return;}
  res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(target).pipe(res);
 });
}
if(require.main===module){
 if(!fs.existsSync(path.join(root,'web-dist/index.html')))throw Error('Run npm run build first');
 const port=Number(process.env.PORT||8000),host=process.env.HOST||'127.0.0.1';
 const server=createServer();
 server.on('error',error=>{console.error('Cannot start local HTTP server: '+error.message+'. Use an environment that permits localhost sockets; no game files were changed.');process.exitCode=1;});
 server.listen(port,host,()=>console.log('Open http://'+host+':'+port+'/last-stand-after-dark/ (serve production output, not the root HTML template)'));
}
module.exports={createServer};
