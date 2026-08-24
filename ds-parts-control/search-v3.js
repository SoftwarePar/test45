/* DS Parts Search Engine v3.1 — isolated, cache-safe, no keyboard interception */
(()=>{
  'use strict';
  const timers=new Map();

  // Important: DATA is declared with top-level `let` in app-core.js.
  // It is therefore NOT available as window.DATA, even though prices/quick/prospects
  // can access it through their own lexical scope. Do not gate searches on window.DATA.
  const run=(id)=>{
    try{
      if(id==='qSearch' && typeof window.quick==='function') window.quick();
      else if(id==='pS' && typeof window.prospects==='function') window.prospects();
      else if(id==='prS' && typeof window.prices==='function') window.prices();
    }catch(err){
      console.error('[DS Search v3.1]',id,err);
    }
  };

  const schedule=(id,delay=100)=>{
    clearTimeout(timers.get(id));
    timers.set(id,setTimeout(()=>run(id),delay));
  };

  const ids=new Set(['qSearch','pS','prS']);

  document.addEventListener('input',e=>{
    const el=e.target;
    if(!el||!ids.has(el.id)||e.isComposing)return;
    schedule(el.id,100);
  },true);

  document.addEventListener('compositionend',e=>{
    const el=e.target;
    if(el&&ids.has(el.id))schedule(el.id,30);
  },true);

  // Fallback for Android/Gboard and browsers that may omit a normal input event.
  document.addEventListener('keyup',e=>{
    const el=e.target;
    if(!el||!ids.has(el.id)||e.isComposing)return;
    schedule(el.id,120);
  },true);

  document.addEventListener('search',e=>{
    const el=e.target;
    if(el&&ids.has(el.id))schedule(el.id,20);
  },true);

  document.addEventListener('change',e=>{
    const el=e.target;
    if(el&&ids.has(el.id))schedule(el.id,20);
  },true);

  // Manual diagnostic hook if needed from console.
  window.DS_SEARCH_V3={version:'3.1.0',run,schedule};
  document.documentElement.dataset.searchEngine='v3.1';
})();
