/* DS Parts · Actualización MARENO 01/09/2026
   Comunicado del proveedor: incremento lineal del 6% hasta recibir la nueva lista oficial. */
(()=>{
  'use strict';
  const RATE=0.06;
  const EFFECTIVE_DATE='2026-09-01';
  const SOURCE_NOTE='MARENO +6% 01/09/2026';
  const MONEY_FIELDS=['price','reference_price','normal_price','normal_reference_price','offer_cost','cost'];

  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const isMareno=p=>norm(`${p?.brand||''} ${p?.source||''}`).includes('MARENO');
  const round2=n=>Math.round((Number(n)+Number.EPSILON)*100)/100;

  function applyMarenoIncrease(mainData){
    if(!mainData||!Array.isArray(mainData.products))return{updated:0};
    if(mainData.marenoUpdate?.effectiveDate===EFFECTIVE_DATE&&mainData.marenoUpdate?.rate===RATE)return mainData.marenoUpdate;
    let updated=0;
    for(const p of mainData.products){
      if(!isMareno(p))continue;
      let changed=false;
      for(const field of MONEY_FIELDS){
        const value=Number(p[field]);
        if(Number.isFinite(value)&&value>0){
          if(field==='price'&&p.price_before_mareno_20260901==null)p.price_before_mareno_20260901=value;
          p[field]=round2(value*(1+RATE));
          changed=true;
        }
      }
      if(changed){
        const src=String(p.source||'MARENO');
        if(!norm(src).includes('MARENO +6%'))p.source=`${src} · ${SOURCE_NOTE}`;
        updated++;
      }
    }
    const meta={provider:'MARENO',rate:RATE,effectiveDate:EFFECTIVE_DATE,updated,temporary:true,note:'Incremento lineal comunicado por proveedor; reemplazar por lista oficial cuando sea recibida.'};
    mainData.marenoUpdate=meta;
    return meta;
  }

  const baseOpenSystem=openSystem;
  openSystem=async function(dataPass,mainData,accessMode='direct'){
    const mareno=applyMarenoIncrease(mainData);
    await baseOpenSystem(dataPass,mainData,accessMode);
    if(mareno.updated){
      const sm=document.querySelector('#syncMini');
      if(sm)sm.textContent=`MARENO +6% vigente · ${mareno.updated} precios actualizados`;
    }
  };

  window.DS_MARENO_UPDATE={rate:RATE,effectiveDate:EFFECTIVE_DATE,apply:applyMarenoIncrease};
})();

/* DS Parts · Exportador VCF compatible Android / Google Contacts
   Formato mínimo vCard 3.0, sin campos Apple, sin Zona Oeste y sin duplicados. */
(()=>{
  'use strict';
  const normText=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().trim();
  const ZONA_OESTE=new Set([
    'MORON','HAEDO','CASTELAR','ITUZAINGO','HURLINGHAM','RAMOS MEJIA','CIUDADELA','CASEROS','LINIERS',
    'VILLA SARMIENTO','ISIDRO CASANOVA','PARQUE LELOIR','VILLA UDAONDO','SAN JUSTO','LA TABLADA',
    'VILLA LUZURIAGA','RAFAEL CASTILLO','GREGORIO DE LAFERRERE','GONZALEZ CATAN','MERLO',
    'SAN ANTONIO DE PADUA','LIBERTAD','MARCO PAZ','MARCOS PAZ'
  ]);

  const isZonaOeste=c=>{
    const l=normText(c?.localidad);
    if(ZONA_OESTE.has(l))return true;
    const n=normText(c?.nombre);
    return n.includes('DS PARTS Z/O')||n.includes('ZONA OESTE');
  };

  const vEsc=s=>String(s||'')
    .replace(/\\/g,'\\\\')
    .replace(/\r?\n/g,'\\n')
    .replace(/;/g,'\\;')
    .replace(/,/g,'\\,');

  function normalizePhone(c){
    const isWa=Boolean(c?.whatsapp);
    let raw=String(c?.whatsapp||c?.telefono||'').trim();
    let d=raw.replace(/\D/g,'');
    if(!d)return'';
    if(d.startsWith('00'))d=d.slice(2);
    if(d.startsWith('54'))return'+'+d;
    while(d.startsWith('0'))d=d.slice(1);
    if(d.length===8)d='11'+d;
    if(isWa&&d.startsWith('11')&&d.length===10)d='9'+d;
    if(d.length>=10&&d.length<=13)return'+54'+d;
    if(d.length>=8&&d.length<=15)return'+'+d;
    return'';
  }

  window.exportVCF=function(){
    if(typeof DATA==='undefined'||!DATA||!Array.isArray(DATA.contacts)){
      alert('La base de contactos todavía no está disponible.');
      return;
    }
    const seen=new Set();
    const rows=[];
    for(const base of DATA.contacts){
      const c=(typeof rec==='function'&&base?.id)?rec(base.id):base;
      if(!c||isZonaOeste(c))continue;
      const phone=normalizePhone(c);
      if(!phone)continue;
      const key=phone.replace(/\D/g,'');
      if(seen.has(key))continue;
      seen.add(key);
      const locality=String(c.localidad||'').trim();
      const business=String(c.nombre||'Contacto').trim();
      const name=`DS Parts - ${locality?locality+' - ':''}${business}`;
      rows.push([
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${vEsc(name)};;;;`,
        `FN:${vEsc(name)}`,
        `TEL;TYPE=CELL:${phone}`,
        'END:VCARD'
      ].join('\r\n'));
    }
    if(!rows.length){
      alert('No se encontraron contactos con teléfono fuera de Zona Oeste.');
      return;
    }
    const body='\ufeff'+rows.join('\r\n')+'\r\n';
    dl('DS_Parts_WhatsApp_SIN_Zona_Oeste_Compatible.vcf',body,'text/vcard;charset=utf-8');
    const sm=document.querySelector('#syncMini');
    if(sm)sm.textContent=`VCF compatible generado · ${rows.length} contactos`;
  };
})();
