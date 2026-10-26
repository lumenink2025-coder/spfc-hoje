/* Run: node tests/sw.test.cjs. No browser or production services are required. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../sw.js'),'utf8');
const reports=[];
function check(condition,label){assert.ok(condition,label);reports.push('PASS '+label);}
function response(body,status=200,type='text/plain'){const r=new Response(body,{status,headers:{'Content-Type':type}});Object.defineProperty(r,'type',{value:'basic'});const clone=r.clone.bind(r);r.clone=()=>{const c=clone();Object.defineProperty(c,'type',{value:'basic'});return c};return r;}
class FakeRequest{constructor(input,options={}){this.url=typeof input==='string'||input instanceof URL?String(input):input.url;this.method=options.method||input.method||'GET';this.mode=options.mode||input.mode||'cors';this.cache=options.cache||input.cache||'default';this.headers=new Headers(options.headers||input.headers||{});}}
function environment(base){
 const handlers={},db=new Map();let skipped=0,claimed=0,online=true,status=200,body='release-current';
 const context={URL,Request:FakeRequest,Response,console,Promise};
 const fetch=async request=>{if(!online)throw Error('offline');return response(body,status,/\.js/.test(request.url)?'application/javascript':'text/plain')};
 const caches={async keys(){return [...db.keys()]},async delete(key){return db.delete(key)},async open(name){if(!db.has(name))db.set(name,new Map());const entries=db.get(name);return {async addAll(requests){const values=await Promise.all(requests.map(async req=>{const r=await fetch(req);if(!r.ok)throw Error('install failed');return [req.url,r]}));for(const [url,r]of values)entries.set(url,r);},async put(key,r){entries.set(String(key),r)},async match(key){return entries.get(String(key))?.clone()},async keys(){return [...entries.keys()].map(url=>new FakeRequest(url))}}}};
 Object.assign(context,{fetch,caches,self:{registration:{scope:base,active:{}},location:new URL(base),clients:{async claim(){claimed++}},async skipWaiting(){skipped++},addEventListener(name,fn){handlers[name]=fn}}});
 vm.createContext(context);vm.runInContext(source+'\nglobalThis.testMeta={CACHE_NAME,CACHE_PREFIX};',context);
 async function lifecycle(name){let work;handlers[name]({waitUntil(p){work=p}});await work;}
 async function request(relative,options={}){let work,reply;handlers.fetch({request:new FakeRequest(new URL(relative,base),options),waitUntil(p){work=p},respondWith(p){reply=p}});if(!reply)return null;const result=await reply;await work;return result;}
 return {handlers,context,db,caches,request,lifecycle,meta:context.testMeta,get skipped(){return skipped},get claimed(){return claimed},network(settings){if(settings.online!==undefined)online=settings.online;if(settings.status!==undefined)status=settings.status;if(settings.body!==undefined)body=settings.body}};
}
(async()=>{
 for(const scope of ['https://test.example/','https://test.example/spfc-hoje/']){
  const e=environment(scope);await e.lifecycle('install');
  check(e.skipped===0,'Atualização aguarda a escolha do usuário em '+scope);
  const cache=await e.caches.open(e.meta.CACHE_NAME);
  check(!!await cache.match(new URL('index.html',scope).href),'Precache respeita a pasta de publicação');
  e.handlers.message({data:{type:'SKIP_WAITING'}});check(e.skipped===1,'Ativação explícita do novo worker');
  await e.caches.open(e.meta.CACHE_PREFIX+'old');await e.caches.open('outro-aplicativo');await e.caches.open('OneSignal-cache');
  await e.lifecycle('activate');
  check(!e.db.has(e.meta.CACHE_PREFIX+'old')&&e.db.has('outro-aplicativo')&&e.db.has('OneSignal-cache')&&e.claimed===1,'Limpeza preserva caches alheios e de notificações');
  e.network({body:'versão nova'});let r=await e.request('app.js?v=123');check(await r.text()==='versão nova','Rede tem prioridade sobre conteúdo antigo');
  e.network({online:false});r=await e.request('app.js?v=456');check(await r.text()==='versão nova','Offline encontra o asset mesmo com versão na URL');
  r=await e.request('./',{mode:'navigate'});check(r.ok,'Início abre pelo shell salvo sem rede');
  r=await e.request('nao-salvo.html',{mode:'navigate'});check(r.status===503&&(await r.text()).includes('Você está sem conexão'),'Página não salva recebe aviso offline claro');
  for(const target of ['admin.html','admin-auth.js','admin-config.js','admin-ui.js','cadastro.html','perfil.html','api/news','OneSignalSDKWorker.js','https://www.gstatic.com/firebase.js'])check((await e.request(target))===null,'Sem interceptação de '+target);
  check(await e.request('app.js',{method:'POST'})===null,'POST não entra no cache');
  check(await e.request('app.js',{headers:{Authorization:'test'}})===null,'Requisição autenticada não entra no cache');
  check(await e.request('assets/hero.jpg',{headers:{Range:'bytes=0-10'}})===null,'Range não recebe resposta integral do cache');
  e.network({online:true,status:404});r=await e.request('app.js');check(r.status===404,'Erro 404 não é escondido por uma versão antiga');
  e.network({status:503});r=await e.request('app.js');check(await r.text()==='versão nova','Falha temporária de servidor usa a cópia atual');
  if(scope.endsWith('/spfc-hoje/'))check(await e.request('../outro/app.js')===null,'Subpasta não intercepta outro projeto');
 }
 console.log(reports.join('\n'));console.log(reports.length+' verificações aprovadas.');
})().catch(e=>{console.error(e);process.exitCode=1});
