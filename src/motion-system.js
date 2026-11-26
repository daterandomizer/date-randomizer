(() => {
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const ease={arrive:'cubic-bezier(.18,.72,.24,1)',exit:'cubic-bezier(.44,0,.82,.34)',accent:'cubic-bezier(.34,.85,.28,1)'};
  const timings={sheetIn:400,sheetOut:285,section:220,enter:240,leave:180,toggle:185};
  const active=new WeakMap();
  function animate(el,frames,timing,easing=ease.arrive){
    if(!el||reduce.matches||!el.animate)return null;
    active.get(el)?.cancel();
    const action=el.animate(frames,{duration:timing,easing});
    active.set(el,action);
    return action;
  }
  function enter(el){
    return animate(el,[{opacity:.13,translate:'0 8px'},{opacity:1,translate:'0 0'}],timings.enter);
  }
  function count(el){
    animate(el,[{opacity:.50,translate:'0 3px'},{opacity:1,translate:'0 0'}],timings.toggle,ease.accent);
  }
  function leave(el){
    if (!el || !el.getClientRects().length || reduce.matches) return;
    const r=el.getBoundingClientRect();
    const still=el.cloneNode(true);
    still.inert=true;
    still.setAttribute('aria-hidden','true');
    still.classList.add('motion-ghost');
    Object.assign(still.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    document.body.append(still);
    const effect=animate(still,[{opacity:1,translate:'0 0'},{opacity:0,translate:'9px -3px'}],timings.leave,ease.exit);
    if(effect)effect.finished.then(()=>still.remove(),()=>still.remove());
    else still.remove();
  }
  function dock(){
    const nav=document.querySelector('.optical-dock');
    const current=nav.querySelector('.tab.active');
    const surface=nav.querySelector('.dock-track');
    if(!current||!surface)return;
    surface.style.width=current.offsetWidth+'px';
    surface.style.height=current.offsetHeight+'px';
    surface.style.transform='translate('+current.offsetLeft+'px,'+current.offsetTop+'px)';
  }

  let sectionAnimation=null;

  function switchSection(animateSwitch,update){
    sectionAnimation?.cancel();
    const content=update();
    if(!animateSwitch||!content)return;
    // The active panel changes atomically. Animate only its heading, never its glass or scene.
    const heading=content.querySelector('.section-title,.winter-title') ||
      (content.id==='main-tab' ? document.querySelector('.header h1') : null);
    sectionAnimation=animate(heading,[{opacity:.78,translate:'0 3px'},{opacity:1,translate:'0 0'}],145);
  }
  reduce.addEventListener?.('change',()=>{
    if(reduce.matches)sectionAnimation?.cancel();
  });

  function createSheet(dialog,trigger,{beforeOpen,onClose}){
    let animation=null,cycle=0,pointer=null;
    const closer=dialog.querySelector('#filters-close');
    const handle=dialog.querySelector('.optical-sheet-head');
    function visual(){
      animation?.pause();
      const computed=getComputedStyle(dialog).transform;
      animation?.cancel();
      animation=null;
      return computed==='none'?'translateY(0px)':computed;
    }
    function travel(from,to,duration,easing,done){
      const token=++cycle;
      if(reduce.matches||!dialog.animate){done?.();return;}
      animation=dialog.animate([{transform:from},{transform:to}],{duration,easing,fill:'both'});
      animation.finished.then(()=>{
        if(token!==cycle)return;
        animation.cancel();
        animation=null;
        done?.();
      },()=>{});
    }
    function open(){
      if(dialog.open && dialog.dataset.sheet!=='closing')return;
      beforeOpen();
      const from=dialog.open?visual():'translateY(102%)';
      if(!dialog.open)dialog.showModal();
      document.documentElement.classList.add('dialog-lock');
      dialog.dataset.sheet='opening';
      dialog.getBoundingClientRect();
      requestAnimationFrame(()=>{if(dialog.dataset.sheet==='opening')dialog.dataset.sheet='open';});
      trigger.setAttribute('aria-expanded','true');
      closer.focus({preventScroll:true});
      travel(from,'translateY(0px)',timings.sheetIn,ease.arrive);
    }
    function close(force=false){
      if(!dialog.open||(!force&&dialog.dataset.sheet==='closing'))return;
      const from=visual();
      pointer=null;
      dialog.style.removeProperty('transform');
      dialog.dataset.sheet='closing';
      const finish=()=>{dialog.close();delete dialog.dataset.sheet;};
      if(force){cycle++;finish();}
      else travel(from,'translateY(106%)',timings.sheetOut,ease.exit,finish);
    }
    trigger.addEventListener('click',open);
    closer.addEventListener('click',()=>close());
    dialog.querySelector('#filters-apply').addEventListener('click',()=>close());
    dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
    dialog.addEventListener('close',()=>{
      document.documentElement.classList.remove('dialog-lock');
      trigger.setAttribute('aria-expanded','false');
      onClose();
    });
    dialog.addEventListener('click',e=>{
      if(e.target!==dialog)return;
      const b=dialog.getBoundingClientRect();
      if(e.clientY<b.top||e.clientX<b.left||e.clientX>b.right)close();
    });
    handle.addEventListener('pointerdown',e=>{
      if(e.target.closest('button')||dialog.dataset.sheet==='closing'||reduce.matches||
          dialog.scrollTop>1||e.button!==0)return;
      animation?.cancel();animation=null;
      pointer={id:e.pointerId,y:e.clientY,last:0,time:e.timeStamp,velocity:0};
      handle.setPointerCapture(e.pointerId);
      dialog.dataset.sheet='dragging';
    });
    handle.addEventListener('pointermove',e=>{
      if(!pointer||e.pointerId!==pointer.id)return;
      const dy=Math.max(0,e.clientY-pointer.y);
      pointer.velocity=(dy-pointer.last)/Math.max(e.timeStamp-pointer.time,8);
      pointer.last=dy;
      pointer.time=e.timeStamp;
      dialog.style.transform=`translateY(${dy}px)`;
    });
    function release(e,canceled){
      if(!pointer||e.pointerId!==pointer.id)return;
      const {last,velocity}=pointer;
      if(!canceled&&(last>95||last>30&&velocity>.65)){close();return;}
      const from=visual();
      pointer=null;
      dialog.style.removeProperty('transform');
      dialog.dataset.sheet='open';
      travel(from,'translateY(0px)',230,ease.arrive);
    }
    handle.addEventListener('pointerup',e=>release(e,false));
    handle.addEventListener('pointercancel',e=>release(e,true));
    reduce.addEventListener?.('change',()=>{if(reduce.matches&&dialog.dataset.sheet==='closing')close(true);});
    trigger.setAttribute('aria-expanded','false');
    return {close};
  }

  window.DRMotion={enter,count,leave,dock,createSheet,switchSection,
    section:el=>animate(el,[{opacity:.72},{opacity:1}],timings.section),
    accent:el=>animate(el,[{scale:'.94'},{scale:'1'}],timings.toggle,ease.accent)};
})();
