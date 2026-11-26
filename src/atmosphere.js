(() => {
  const root=document.documentElement;
  const settings=new URLSearchParams(location.search);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const winter=window.NY_THEME;
  const scene=document.querySelector('.atmosphere');
  const canvas=scene.querySelector('canvas');
  const ctx=canvas.getContext('2d');
  const heart=new Image();
  const off=settings.get('decor')==='off';
  if(off)root.dataset.decorOff='';
  if(settings.has('lite'))root.dataset.lite='';

  let width=0,height=0,particles=[],frame=0,last=0,paints=0;
  let activeControl=null;
  const controls='.mode-btn,#open-filters,.randomize-btn,#filters-apply,.add-btn,.delete-btn,.restore-btn,.checkbox-label,.remove-idea-btn,.filter-btn,#filters-close,.tab';
  function release(){
    if(!activeControl)return;
    activeControl.style.removeProperty('--pulse');
    activeControl=null;
  }
  document.addEventListener('pointerdown',event=>{
    const el=event.target.closest(controls);
    if(!el||el.disabled||reduce.matches)return;
    release();
    const r=el.getBoundingClientRect();
    el.style.setProperty('--light-x',`${(event.clientX-r.left)/r.width*100}%`);
    el.style.setProperty('--light-y',`${(event.clientY-r.top)/r.height*100}%`);
    el.style.setProperty('--pulse','1');
    activeControl=el;
  },{passive:true});
  document.addEventListener('pointerup',release,{passive:true});
  document.addEventListener('pointercancel',release,{passive:true});
  window.addEventListener('blur',release);
  if(!ctx||off)return;

  const flakes=Array.from({length:3},(_,depth)=>{
    const stamp=document.createElement('canvas');
    stamp.width=stamp.height=28;
    const pen=stamp.getContext('2d');
    const g=pen.createRadialGradient(14,14,depth===1?3:1,14,14,13);
    g.addColorStop(0,depth===1?'#fff9ec':'#fff4e6');
    g.addColorStop(.43,'#fff9eed3');g.addColorStop(1,'#fff9ee00');
    pen.fillStyle=g;pen.fillRect(0,0,28,28);
    return stamp;
  });
  function lite(){return root.dataset.visualQuality==='low'||root.hasAttribute('data-lite');}
  function inFlight(){return /^(drawing|revealing)$/.test(root.dataset.drawState);}
  function visible(){return !document.hidden&&!reduce.matches&&!inFlight();}
  function initCount(){
    const count=winter?(lite()?21:48):(lite()?6:11);
    const offset=winter?0:.76;
    particles=Array.from({length:count},(_,i)=>{
      const depth=i%3;
      return {depth,x:winter?(i+.2+Math.random()*.6)/count:
        (i%2===0?.012+Math.random()*.24:offset+Math.random()*.225),
        seed:Math.random()*Math.PI*2,life:(i+(Math.random()-.5)*.7)/count,
        seconds:winter?13+Math.random()*10-depth*3:13+Math.random()*12,
        size:winter?[2.7,4.8,9.5][depth]*(.72+Math.random()*.56):
          [20,33,55][depth]*(.70+Math.random()*.50)};
    });
  }

  function draw(dt){
    if(!width||!height)return;
    paints++;
    ctx.clearRect(0,0,width,height);
    for(const p of particles){
      p.life=(p.life+dt/(p.seconds*1000))%1;
      const life=(p.life+1)%1;
      const fade=Math.min(1,life*7,(1-life)*7);
      const sway=Math.sin(p.seed+life*6.28);
      const x=(p.x*width)+sway*(winter?11:17);
      const y=(winter?life:1-life)*(height+80)-40;
      const size=p.size;
      if(winter){
        ctx.globalAlpha=fade*[.30,.65,.47][p.depth];
        ctx.drawImage(flakes[p.depth],x-size/2,y-size/2,size,size);
      }else if(heart.complete&&heart.naturalWidth){
        ctx.globalAlpha=fade*[.71,.89,.42][p.depth];
        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(sway*.32+p.seed*.07-.20);
        ctx.drawImage(heart,-size/2,-size/2,size,size);
        ctx.restore();
      }
    }
    ctx.globalAlpha=1;
  }

  function loop(t){
    frame=0;
    if(!visible())return;
    const step=lite()?54:39;
    if(!last||t-last>=step){
      draw(last?Math.min(90,t-last):0);
      last=t;
    }
    frame=requestAnimationFrame(loop);
  }
  function sync(){
    const paused=!visible();
    root.toggleAttribute('data-atmosphere-paused',paused);
    cancelAnimationFrame(frame);frame=0;last=0;
    if(!paused)frame=requestAnimationFrame(loop);
  }
  const resize=()=>{
    width=scene.clientWidth;height=scene.clientHeight;
    const dpr=Math.min(lite()?1:1.35,devicePixelRatio||1);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    draw(0);
  };
  initCount();
  new ResizeObserver(resize).observe(scene);
  new MutationObserver(mutations=>{
    if(mutations.some(m=>m.attributeName==='data-visual-quality')){initCount();resize();}
    sync();
  }).observe(root,{attributes:true,attributeFilter:['data-draw-state','data-visual-quality']});
  document.addEventListener('visibilitychange',sync);
  reduce.addEventListener?.('change',sync);
  if(!winter){heart.onload=()=>draw(0);heart.src='assets/GLASS_HEART.webp';}
  window.DRAtmosphere={stats:()=>({paints,count:particles.length,winter,paused:!visible(),buffer:[canvas.width,canvas.height]})};
  sync();
})();
