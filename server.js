// Ro-Viewer server: static files, proxy to Roblox PUBLIC APIs (CORS), and JSON-file persistence (data.json).
const http=require('http'),fs=require('fs'),path=require('path');
const PUB=path.join(__dirname,'public'),DATA=path.join(__dirname,'data.json');
const SVC=['users','presence','friends','inventory','thumbnails','games','groups','avatar','catalog','apis'];
const body=q=>new Promise(r=>{let b='';q.on('data',d=>{b+=d;if(b.length>5e6)q.destroy()});q.on('end',()=>r(b))});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let csrf='';
http.createServer(async(q,r)=>{
 try{const u=new URL(q.url,'http://x');
  if(u.pathname==='/api/data'){if(q.method==='POST'){const b=await body(q);JSON.parse(b);fs.writeFileSync(DATA,b);r.writeHead(200);return r.end('ok')}
   r.writeHead(200,{'Content-Type':'application/json'});return r.end(fs.existsSync(DATA)?fs.readFileSync(DATA):'{}')}
  if(u.pathname==='/api/rbx'){const svc=u.searchParams.get('svc'),p=u.searchParams.get('path')||'';
   if(!SVC.includes(svc)||!/^\/[\w\-\/?=&.,%:]*$/.test(p)){r.writeHead(400);return r.end('{"error":"bad request"}')}
   const post=q.method==='POST',b=post?await body(q):undefined;let x;
   for(let i=0;i<4;i++){x=await fetch(`https://${svc}.roblox.com${p}`,{method:post?'POST':'GET',body:b,headers:{'Content-Type':'application/json','x-csrf-token':csrf}});
    if(x.status===403&&x.headers.get('x-csrf-token')&&x.headers.get('x-csrf-token')!==csrf){csrf=x.headers.get('x-csrf-token');continue}
    if(x.status===429){await sleep(1500*(i+1));continue}break}
   if(x.status>=400)console.log('Roblox error',svc,p.slice(0,90),'->',x.status);r.writeHead(x.status,{'Content-Type':'application/json'});return r.end(await x.text())}
  const f=path.join(PUB,u.pathname==='/'?'index.html':u.pathname);
  if(!f.startsWith(PUB)||!fs.existsSync(f)){r.writeHead(404);return r.end('Not found')}
  const T={'.html':'text/html','.png':'image/png','.svg':'image/svg+xml','.css':'text/css','.js':'text/javascript'};r.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});r.end(fs.readFileSync(f));
 }catch(e){r.writeHead(502,{'Content-Type':'application/json'});r.end(JSON.stringify({error:e.message.slice(0,100)}))}
}).listen(3200,'127.0.0.1',()=>console.log('Ro-Viewer running at http://localhost:3200'));
