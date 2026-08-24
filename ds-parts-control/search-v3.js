/* DS Parts Search Engine v3 — isolated, cache-safe, no keyboard interception */
(()=>{
  'use strict';
  const timers=new Map();
  const run=(id)=>{
    if(!window.DATA)return;
    try{
      if(id==='qSearch' && typeof window.quick==='function') window.quick();
      else if(id==='pS' && typeof window.prospects==='function') window.prospects();
      else if(id==='prS' && typeof window.prices==='function') window.prices();
    }catch(err){console.error('[DS Search v3]',id,err)}
  };
  const schedule=(id,delay=90)=>{
    clearTimeout(timers.get(id));
    timers.set(id,setTimeout(()=>run(id),delay));
  };
  const ids=new Set(['qSearch','pS','prS']);
  document.addEventListener('input',e=>{
    const el=e.target;
    if(!el||!ids.has(el.id)||e.isComposing)return;
    schedule(el.id);
  },true);
  document.addEventListener('compositionend',e=>{
    const el=e.target;
    if(el&&ids.has(el.id))schedule(el.id,30);
  },true);
  document.addEventListener('keyup',e=>{
    const el=e.target;
    if(!el||!ids.has(el.id)||e.isComposing)return;
    // Fallback for browsers/keyboards that do not dispatch a normal input event.
    schedule(el.id,110);
  },true);
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el&&ids.has(el.id))schedule(el.id,20);
  },true);
  // Expose a manual diagnostic hook.
  window.DS_SEARCH_V3={version:'3.0.0',run,schedule};
  document.documentElement.dataset.searchEngine='v3';
})();
