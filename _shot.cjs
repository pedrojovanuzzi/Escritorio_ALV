const fs=require("fs");const http=require("http");
function gj(p){return new Promise((res,rej)=>{http.get("http://127.0.0.1:9222"+p,r=>{let d="";r.on("data",c=>d+=c);r.on("end",()=>res(JSON.parse(d)));}).on("error",rej);});}
const TXT="C:\GitHub\Escritorio_ALV\frontend\app\public\clientes_demo.txt";
(async()=>{
  const t=await gj("/json/list");const pg=t.find(x=>x.type==="page");const ws=new WebSocket(pg.webSocketDebuggerUrl);
  let id=0;const p={};const send=(m,pr={})=>new Promise(r=>{const i=++id;p[i]=r;ws.send(JSON.stringify({id:i,method:m,params:pr}));});
  ws.addEventListener("message",ev=>{const m=JSON.parse(ev.data);if(m.id&&p[m.id]){p[m.id](m.result);delete p[m.id];}});
  await new Promise(r=>ws.onopen=r);
  await send("Page.enable");await send("DOM.enable");
  await send("Page.navigate",{url:"http://localhost:3005/devlogin.html"});
  for(let i=0;i<35;i++){await new Promise(r=>setTimeout(r,700));const s=await send("Runtime.evaluate",{expression:"JSON.stringify({u:location.pathname,len:(document.getElementById('root')||{}).innerHTML?.length||0})",returnByValue:true});const st=JSON.parse(s.result.value);if(st.u==="/clientes"&&st.len>2000)break;}
  await new Promise(r=>setTimeout(r,800));
  // abre o modal
  await send("Runtime.evaluate",{expression:"[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Importar TXT'))?.click()"});
  await new Promise(r=>setTimeout(r,700));
  // injeta o arquivo no input
  const doc=await send("DOM.getDocument",{depth:-1});
  const q=await send("DOM.querySelector",{nodeId:doc.root.nodeId,selector:'input[type=file][accept*=".txt"]'});
  console.log("nodeId:",q.nodeId);
  await send("DOM.setFileInputFiles",{files:[TXT],nodeId:q.nodeId});
  await new Promise(r=>setTimeout(r,2500));
  const shot=await send("Page.captureScreenshot",{format:"png"});
  fs.writeFileSync("C:/tmp/import_shot.png",Buffer.from(shot.data,"base64"));
  console.log("ok");ws.close();process.exit(0);
})().catch(e=>{console.error("ERRO:",e.message);process.exit(1);});
