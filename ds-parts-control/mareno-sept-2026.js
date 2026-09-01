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
