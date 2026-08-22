// Mobile keyboard guard: preserve native Android/Gboard editing behavior.
// app-ui.js previously registered a custom beforeinput delete handler that can block Gboard backspace.
(()=>{
  const originalAdd=document.addEventListener.bind(document);
  document.addEventListener=function(type,listener,options){
    if(type==='beforeinput' && typeof listener==='function'){
      const src=Function.prototype.toString.call(listener);
      if(src.includes('deleteContentBackward') || src.includes('deleteContentForward')) return;
    }
    return originalAdd(type,listener,options);
  };

  // Safety fallback: only intervene if native Backspace fires but the value did not change.
  originalAdd('keydown',e=>{
    if(e.key!=='Backspace') return;
    const el=e.target;
    if(!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || el.disabled || el.readOnly) return;
    const before=el.value;
    const start=el.selectionStart,end=el.selectionEnd;
    setTimeout(()=>{
      if(el.value!==before || document.activeElement!==el || start==null || end==null) return;
      let v=before,pos=start;
      if(start!==end){v=v.slice(0,start)+v.slice(end);pos=start}
      else if(start>0){v=v.slice(0,start-1)+v.slice(end);pos=start-1}
      else return;
      el.value=v;
      try{el.setSelectionRange(pos,pos)}catch(_){ }
      el.dispatchEvent(new Event('input',{bubbles:true}));
    },0);
  },true);
})();