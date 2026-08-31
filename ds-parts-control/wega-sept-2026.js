const DS_BUILD='20260831-1425';
const DS_ACCESS_HASH='dce87f984a28cce71834b5b0a83bc6ae17250b0b02dbbe9ed5503812915bba7b';
const DS_KEY_SLOT_LOCAL='dsp_key_slot_v2';
const DS_KEY_SLOT_PATH='ds-parts-control/key-slot.enc.json';
const WEGA_UPDATE_PARTS=['wega-data/c00.txt','wega-data/c01.txt','wega-data/c02.txt','wega-data/c03.txt','wega-data/c04.txt','wega-data/c05.txt','wega-data/c06.txt','wega-data/c07.txt'];

function withBuild(u){return u+(u.includes('?')?'&':'?')+'v='+DS_BUILD}
function wegaNorm(s){let x=String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');let m=x.match(/^([A-Z]+)0+([0-9].*)$/);return m?m[1]+m[2]:x}
function isWegaProduct(p){let t=(String(p?.brand||'')+' '+String(p?.source||'')).toUpperCase();return t.includes('WEGA')}
async function loadWegaUpdate(pass){let t='';for(let u of WEGA_UPDATE_PARTS){let r=await fetch(withBuild(u),{cache:'no-store'});if(!r.ok)throw Error('No se pudo cargar '+u);t+=await r.text()}return dec(JSON.parse(t),pass)}
async function loadWegaPatch(pass){let r=await fetch(withBuild('wega-data/patch.enc.json'),{cache:'no-store'});if(!r.ok)return null;return dec(JSON.parse(await r.text()),pass)}
function applyWegaUpdate(o){if(!o||!o.general)throw Error('Actualización WEGA inválida');DATA.products=Array.isArray(DATA.products)?DATA.products:[];let by=new Map();DATA.products.forEach(p=>{let k=wegaNorm(p.code);if(k&&isWegaProduct(p)&&!by.has(k))by.set(k,p)});let stats={general:0,kits:0,offers:0,added:0,offerZero:0};
Object.entries(o.general||{}).forEach(([k,v])=>{let p=by.get(k),price=Number(v?.[0]),base=Number(v?.[1]);if(!Number.isFinite(price)||price<=0)return;if(p){p.price=price;p.reference_price=Number.isFinite(base)&&base>0?base:null;p.source='WEGA General 09/2026';p.offer=false;delete p.normal_price;delete p.offer_cost;stats.general++}else{p={brand:'WEGA',code:v?.[2]||k,category:'Catálogo WEGA',description:'',price,reference_price:Number.isFinite(base)&&base>0?base:null,source:'WEGA General 09/2026',offer:false};DATA.products.push(p);by.set(k,p);stats.added++;stats.general++}});
Object.entries(o.kits||{}).forEach(([k,v])=>{let p=by.get(k),price=Number(v?.[0]),base=Number(v?.[1]),code=v?.[2]||k,desc=v?.[3]||'';if(!Number.isFinite(price)||price<=0)return;if(p){p.price=price;p.reference_price=Number.isFinite(base)&&base>0?base:null;p.source='WEGA Kits 09/2026';p.category=p.category||'Kit WEGA';if(desc&&!p.description)p.description=desc;p.offer=false;stats.kits++}else{p={brand:'WEGA',code,category:'Kit WEGA',description:desc,price,reference_price:Number.isFinite(base)&&base>0?base:null,source:'WEGA Kits 09/2026',offer:false};DATA.products.push(p);by.set(k,p);stats.added++;stats.kits++}});
Object.entries(o.offers||{}).forEach(([k,v])=>{let offer=Number(v?.[0]);if(!Number.isFinite(offer)||offer<=0){stats.offerZero++;return}let p=by.get(k),code=(v?.length>=4?v?.[2]:k)||k,desc=(v?.length>=4?v?.[3]:v?.[2])||'';if(p){let normal=Number(p.price);p.normal_price=Number.isFinite(normal)&&normal>0?normal:null;p.normal_reference_price=p.reference_price??null;p.price=offer;p.reference_price=p.normal_price;p.offer_cost=Number(v?.[1])||null;p.source='WEGA Oferta 09/2026';p.offer=true;if(desc&&!p.description)p.description=desc;stats.offers++}else{p={brand:'WEGA',code,category:'Oferta WEGA',description:desc,price:offer,reference_price:null,offer_cost:Number(v?.[1])||null,source:'WEGA Oferta 09/2026',offer:true};DATA.products.push(p);by.set(k,p);stats.added++;stats.offers++}});
let wc=DATA.products.filter(isWegaProduct).length;if(Array.isArray(DATA.brands)){let b=DATA.brands.find(x=>String(x.name||'').toUpperCase().includes('WEGA'));if(b){b.count=wc;b.summary='Precios actualizados · Septiembre 2026'}else DATA.brands.push({name:'WEGA',count:wc,summary:'Precios actualizados · Septiembre 2026'})}DATA.wegaUpdate={...stats,sourceDate:o.updatedAt||'2026-08-28',counts:o.counts||{}};return stats}

async function sha256hex(s){let a=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(s)));return[...new Uint8Array(a)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function accessPasswordIsValid(p){return(await sha256hex(p))===DS_ACCESS_HASH}

async function loadMainEnvelope(){
  let t='';
  for(let u of PARTS){
    let r=await fetch(withBuild(u),{cache:'no-store'});
    if(!r.ok)throw Error('No se pudo cargar '+u+' (HTTP '+r.status+').');
    let chunk=await r.text();
    if(!chunk)throw Error('El archivo '+u+' llegó vacío.');
    t+=chunk;
  }
  try{return JSON.parse(t)}catch(e){throw Error('Los archivos de la base cargaron, pero el cifrado está incompleto o dañado.')}
}

async function loadAvailableKeySlots(){
  let slots=[];
  let local=localStorage.getItem(DS_KEY_SLOT_LOCAL);
  if(local)try{slots.push(JSON.parse(local))}catch(e){localStorage.removeItem(DS_KEY_SLOT_LOCAL)}
  try{
    let r=await fetch(withBuild('key-slot.enc.json'),{cache:'no-store'});
    if(r.ok){let remote=JSON.parse(await r.text());if(remote)slots.push(remote)}
  }catch(e){}
  return slots;
}

async function resolveDataPassword(accessPass,mainEnvelope){
  try{
    let main=await dec(mainEnvelope,accessPass);
    return{dataPass:accessPass,main};
  }catch(e){}
  let slots=await loadAvailableKeySlots();
  for(let slot of slots){
    try{
      let meta=await dec(slot,accessPass);
      if(!meta?.dataPass)continue;
      let main=await dec(mainEnvelope,meta.dataPass);
      return{dataPass:meta.dataPass,main};
    }catch(e){}
  }
  return null;
}

async function openSystem(dataPass,mainData,accessMode='direct'){
  PASS=dataPass;
  DATA=mainData;
  STATE={records:{},campaignLog:[],updatedAt:null};
  let l=localStorage.getItem('dsp_state');
  if(l)try{STATE=await dec(JSON.parse(l),PASS)}catch(e){console.warn('Estado local anterior no legible; se inicia estado vacío.',e)}

  let wegaOk=false;
  try{
    let upd=await loadWegaUpdate(PASS);
    let patch=await loadWegaPatch(PASS);
    if(patch?.general)Object.assign(upd.general,patch.general);
    applyWegaUpdate(upd);
    wegaOk=true;
  }catch(wegaError){
    console.warn('Actualización WEGA no disponible. Se continúa con la base principal.',wegaError);
  }

  $('#migration')?.classList.add('hide');
  $('#lock').classList.add('hide');
  $('#app').classList.remove('hide');
  init();
  let sv=$('#searchVer');
  if(sv)sv.textContent=wegaOk?'WEGA 09/2026 · precios vigentes':'Base principal activa';
  let sm=$('#syncMini');
  if(sm)sm.textContent=accessMode==='migrated'?'Nueva clave activa · base operativa':wegaOk?'Base WEGA actualizada 28/08/2026':'Base principal activa';
  let msg=$('#msg');if(msg)msg.textContent='';
}

async function publishKeySlot(slot,token){
  if(!token)return false;
  let api=`https://api.github.com/repos/${REPO}/contents/${DS_KEY_SLOT_PATH}`;
  let r=await fetch(api,{headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json'}});
  let meta=null;
  if(r.ok)meta=await r.json();else if(r.status!==404)throw Error('GitHub lectura '+r.status);
  let body={message:'Update DS Parts encrypted access slot',content:b64out(new TextEncoder().encode(JSON.stringify(slot))),branch:'main'};
  if(meta)body.sha=meta.sha;
  let w=await fetch(api,{method:'PUT',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!w.ok)throw Error('GitHub escritura '+w.status);
  return true;
}

unlock=async function(){
  const msg=$('#msg');
  const accessPass=$('#pass').value;
  $('#migration')?.classList.add('hide');
  try{
    if(!accessPass){msg.textContent='Ingresá la clave de acceso.';return}
    if(!(await accessPasswordIsValid(accessPass))){msg.textContent='Clave incorrecta.';return}
    msg.textContent='Validando acceso y cargando base...';
    let mainEnvelope=await loadMainEnvelope();
    let resolved=await resolveDataPassword(accessPass,mainEnvelope);
    if(!resolved){
      msg.textContent='La nueva clave es correcta. Falta migrar el cifrado existente una sola vez.';
      $('#migration')?.classList.remove('hide');
      setTimeout(()=>$('#oldPass')?.focus(),50);
      return;
    }
    await openSystem(resolved.dataPass,resolved.main,resolved.dataPass===accessPass?'direct':'migrated');
  }catch(e){
    console.error('DS Parts login:',e);
    msg.textContent=e?.message||'No se pudo abrir la base.';
  }
}

async function migrateAccess(){
  const msg=$('#migMsg');
  const accessPass=$('#pass').value;
  const oldPass=$('#oldPass').value;
  try{
    if(!(await accessPasswordIsValid(accessPass))){msg.textContent='Primero ingresá la nueva clave correcta.';return}
    if(!oldPass){msg.textContent='Ingresá la clave anterior para completar la migración.';return}
    msg.textContent='Verificando clave anterior...';
    let mainEnvelope=await loadMainEnvelope(),mainData;
    try{mainData=await dec(mainEnvelope,oldPass)}catch(e){msg.textContent='La clave anterior no coincide con la base cifrada.';return}
    msg.textContent='Creando acceso con la nueva clave...';
    let slot=await enc({v:1,dataPass:oldPass,createdAt:new Date().toISOString()},accessPass);
    localStorage.setItem(DS_KEY_SLOT_LOCAL,JSON.stringify(slot));

    let published=false,publishWarning='';
    let token=localStorage.getItem('dsp_gh')||'';
    if(token)try{published=await publishKeySlot(slot,token)}catch(e){publishWarning=e.message;console.warn('No se pudo publicar el slot de acceso.',e)}

    msg.textContent=published?'Migración completada. Abriendo sistema...':publishWarning?'Migración local completada. Abriendo sistema...':'Migración completada. Abriendo sistema...';
    await openSystem(oldPass,mainData,'migrated');
  }catch(e){
    console.error('DS Parts migration:',e);
    msg.textContent=e?.message||'No se pudo completar la migración.';
  }
}
