const WEGA_UPDATE_PARTS=['wega-data/c00.txt','wega-data/c01.txt','wega-data/c02.txt','wega-data/c03.txt','wega-data/c04.txt','wega-data/c05.txt','wega-data/c06.txt','wega-data/c07.txt'];
function wegaNorm(s){let x=String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'');let m=x.match(/^([A-Z]+)0+([0-9].*)$/);return m?m[1]+m[2]:x}
function isWegaProduct(p){let t=(String(p?.brand||'')+' '+String(p?.source||'')).toUpperCase();return t.includes('WEGA')}
async function loadWegaUpdate(pass){let t='';for(let u of WEGA_UPDATE_PARTS){let r=await fetch(u,{cache:'no-store'});if(!r.ok)throw Error('No se pudo cargar '+u);t+=await r.text()}return dec(JSON.parse(t),pass)}
async function loadWegaPatch(pass){let r=await fetch('wega-data/patch.enc.json',{cache:'no-store'});if(!r.ok)return null;return dec(JSON.parse(await r.text()),pass)}
function applyWegaUpdate(o){if(!o||!o.general)throw Error('Actualización WEGA inválida');DATA.products=Array.isArray(DATA.products)?DATA.products:[];let by=new Map();DATA.products.forEach(p=>{let k=wegaNorm(p.code);if(k&&isWegaProduct(p)&&!by.has(k))by.set(k,p)});let stats={general:0,kits:0,offers:0,added:0,offerZero:0};
Object.entries(o.general||{}).forEach(([k,v])=>{let p=by.get(k),price=Number(v?.[0]),base=Number(v?.[1]);if(!Number.isFinite(price)||price<=0)return;if(p){p.price=price;p.reference_price=Number.isFinite(base)&&base>0?base:null;p.source='WEGA General 09/2026';p.offer=false;delete p.normal_price;delete p.offer_cost;stats.general++}else{p={brand:'WEGA',code:v?.[2]||k,category:'Catálogo WEGA',description:'',price,reference_price:Number.isFinite(base)&&base>0?base:null,source:'WEGA General 09/2026',offer:false};DATA.products.push(p);by.set(k,p);stats.added++;stats.general++}});
Object.entries(o.kits||{}).forEach(([k,v])=>{let p=by.get(k),price=Number(v?.[0]),base=Number(v?.[1]),code=v?.[2]||k,desc=v?.[3]||'';if(!Number.isFinite(price)||price<=0)return;if(p){p.price=price;p.reference_price=Number.isFinite(base)&&base>0?base:null;p.source='WEGA Kits 09/2026';p.category=p.category||'Kit WEGA';if(desc&&!p.description)p.description=desc;p.offer=false;stats.kits++}else{p={brand:'WEGA',code,category:'Kit WEGA',description:desc,price,reference_price:Number.isFinite(base)&&base>0?base:null,source:'WEGA Kits 09/2026',offer:false};DATA.products.push(p);by.set(k,p);stats.added++;stats.kits++}});
Object.entries(o.offers||{}).forEach(([k,v])=>{let offer=Number(v?.[0]);if(!Number.isFinite(offer)||offer<=0){stats.offerZero++;return}let p=by.get(k),code=(v?.length>=4?v?.[2]:k)||k,desc=(v?.length>=4?v?.[3]:v?.[2])||'';if(p){let normal=Number(p.price);p.normal_price=Number.isFinite(normal)&&normal>0?normal:null;p.normal_reference_price=p.reference_price??null;p.price=offer;p.reference_price=p.normal_price;p.offer_cost=Number(v?.[1])||null;p.source='WEGA Oferta 09/2026';p.offer=true;if(desc&&!p.description)p.description=desc;stats.offers++}else{p={brand:'WEGA',code,category:'Oferta WEGA',description:desc,price:offer,reference_price:null,offer_cost:Number(v?.[1])||null,source:'WEGA Oferta 09/2026',offer:true};DATA.products.push(p);by.set(k,p);stats.added++;stats.offers++}});
let wc=DATA.products.filter(isWegaProduct).length;if(Array.isArray(DATA.brands)){let b=DATA.brands.find(x=>String(x.name||'').toUpperCase().includes('WEGA'));if(b){b.count=wc;b.summary='Precios actualizados · Septiembre 2026'}else DATA.brands.push({name:'WEGA',count:wc,summary:'Precios actualizados · Septiembre 2026'})}DATA.wegaUpdate={...stats,sourceDate:o.updatedAt||'2026-08-28',counts:o.counts||{}};return stats}

unlock=async function(){
  const msg=$('#msg');
  try{
    if(msg)msg.textContent='Cargando base...';
    let t='';
    for(let u of PARTS){
      let r=await fetch(u,{cache:'no-store'});
      if(!r.ok)throw Error('Base principal no disponible: '+u);
      t+=await r.text();
    }
    PASS=$('#pass').value;
    DATA=await dec(JSON.parse(t),PASS);

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

    let l=localStorage.getItem('dsp_state');
    if(l)try{STATE=await dec(JSON.parse(l),PASS)}catch(e){}
    $('#lock').classList.add('hide');
    $('#app').classList.remove('hide');
    init();
    let sv=$('#searchVer');
    if(sv)sv.textContent=wegaOk?'WEGA 09/2026 · precios vigentes':'Base principal activa';
    let sm=$('#syncMini');
    if(sm)sm.textContent=wegaOk?'Base WEGA actualizada 28/08/2026':'Base principal activa · actualización WEGA no disponible';
    if(msg)msg.textContent='';
  }catch(e){
    console.error(e);
    if(msg)msg.textContent=e?.name==='OperationError'?'Clave incorrecta.':'No se pudo cargar la base principal. Recargá la página e intentá nuevamente.';
  }
}
