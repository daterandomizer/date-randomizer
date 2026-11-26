/* Only the view owns timing. The application supplies the selection and commit. */
(() => {
  const root=document.documentElement;
  const search=new URLSearchParams(location.search);
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const duration=1680;
  const clamp=x=>Math.max(0,Math.min(1,x));
  const part=(t,a,b)=>clamp((t-a)/(b-a));
  const smooth=x=>x*x*(3-2*x);
  const ease=(t,a,b)=>smooth(part(t,a,b));
  let three;

  function loadThree() {
    if (!three) {
      three=new Promise((resolve,reject)=>{
        if (search.has('no3d')) { reject(Error('3D disabled by the test URL')); return; }
        const script=document.createElement('script');
        script.src='vendor/three.min.js';
        script.id='three-lib';
        script.onload=()=>window.THREE ? resolve() : reject(Error('Three.js unavailable'));
        script.onerror=()=>reject(Error('Three.js failed to load'));
        document.head.append(script);
      });
    }
    return three;
  }

  function setup({stage, canvas, note, button, update, cancelResult, gift=false, winter=window.NY_THEME}) {
    let gfx=null, loading=false, attempted=false, suspended=false;
    let active=false, frame=0, run=null, phase='fallback', timer=0;
    let yaw=0,pitch=0,velocity=0,lastFrame=0,pointer=null;
    let dirty=true, resultPose=false, animations=0, updates=0, interruptions=0, painted=false;

    function state(next) {
      phase=next;
      if(active)root.dataset.drawState=next;
    }

    function clearFlight() {
      delete note.dataset.flight;
      note.style.removeProperty('--flight-transform');
      note.style.removeProperty('--flight-alpha');
      note.style.removeProperty('--flight-copy');
      button.style.removeProperty('--press');
    }

    function queue() {
      if(!frame && active && !document.hidden && gfx && !suspended) frame=requestAnimationFrame(tick);
    }

    function updateScene() {
      if (!gfx || !dirty || suspended) return;
      gfx.setPose({yaw,pitch,raise:resultPose?(gift?.50:.43):0,scale:resultPose?.94:1});
      gfx.render();
      if (!painted && gfx.stats().frames>0) {
        painted=true;
        stage.dataset.ready='true';
        performance.mark('dr-3d-ready');
        stage.dispatchEvent(new Event('dr-scene-settled'));
      }
      dirty=false;
    }

    function finish(display) {
      if(!run)return;
      const attempt=run;
      run=null;
      clearTimeout(timer);
      clearFlight();
      if(display) {
        resultPose=active;
        if (!attempt.prepared) attempt.prepare();
        attempt.commit();
        updates++;
        state('revealed');
      } else {
        resultPose=false;
        interruptions++;
        state('interrupted');
        cancelResult();
      }
      dirty=true;
      update();
      queue();
    }

    function flightPose(t) {
      return {
        lip:gift?1.53:2.29,
        rise:-.40+(gift?.98:.84)*ease(t,.25,.49),
        approach:ease(t,.46,.68),
        flatten:ease(t,.40,.68),
        roll:.20*(1-ease(t,.42,.68)),
        fade:ease(t,.66,.71),
      };
    }

    function layoutFlight(position,t) {
      let box=run.box;
      if(!box) {
        note.style.setProperty('--flight-transform','none');
        box=note.getBoundingClientRect();
        run.box=box;
      }
      const unfold=ease(t,.66,.94);
      const targetY=box.top+box.height/2;
      const dx=(position.x-(box.left+box.width/2))*(1-unfold);
      const dy=(position.y-targetY)*(1-unfold);
      const width=position.width/box.width;
      const height=position.height/box.height;
      note.style.setProperty('--flight-transform',
        `translate(${dx}px,${dy}px) scale(${width+(1-width)*unfold},${height+(1-height)*unfold})`);
      note.style.setProperty('--flight-alpha',String(ease(t,.66,.72)));
      note.style.setProperty('--flight-copy',String(ease(t,.77,.95)));
    }

    function animate(time) {
      const t=clamp((time-run.at)/duration);
      const reaction=Math.sin(Math.PI*ease(t,.01,.17));
      const opening=ease(t,.15,.37)*(1-ease(t,.69,.98));
      const settling=ease(t,.77,1);
      const swing=gift?.63:.53;
      button.style.setProperty('--press',String(1-.035*reaction));
      const pose={
        yaw:yaw+.028*reaction,pitch,roll:-.027*reaction,
        raise:(gift?.50:.43)*settling,scale:1-.06*settling,
        lidX:swing*opening,lidY:(gift?.58:.53)*opening,lidZ:-.23*opening,
        lidTilt:.26*opening,lidTwist:(gift?.10:.32)*opening,lidRoll:-.30*opening,
        scroll:t>.26&&t<.72,
      };
      if(t>=.66 && !run.handoff) {
        gfx.setPose({...pose,flight:flightPose(.68)});
        run.handoff=gfx.projectScroll();
      }
      gfx.setPose({...pose,flight:t>=.25?flightPose(Math.min(t,.68)):null});
      if(search.has('lidDebug')) (window.drLidFrames??=[]).push({t,...gfx.lidBounds()});
      if(search.has('flightDebug')&&t>=.25&&t<.73) {
        const frame={...gfx.projectScroll(),t,yaw,gift};
        (window.drFlightFrames??=[]).push(frame);
      }
      if(run.handoff) {
        if(phase!=='revealing')state('revealing');
        layoutFlight(run.handoff,t);
      }
      gfx.render();
      if(t>=1)finish(true);
    }

    function tick(time) {
      frame=0;
      if(!active || document.hidden || !gfx || suspended) return;
      const dt=Math.min(36,time-(lastFrame||time-16));
      lastFrame=time;
      if(run && run.animated) animate(time);
      else {
        if(!pointer && (Math.abs(velocity)>.00011 || Math.abs(pitch)>.0004)) {
          yaw+=velocity*dt;
          velocity*=Math.exp(-dt/155);
          pitch*=Math.exp(-dt/95);
          dirty=true;
        }
        updateScene();
      }
      if((run && run.animated) || dirty || (!pointer&&(Math.abs(velocity)>.00011||Math.abs(pitch)>.0004)))queue();
      else lastFrame=0;
    }

    async function initialize() {
      if(loading||attempted||!active||document.hidden) return;
      loading=true;
      attempted=true;
      try {
        await loadThree();
        gfx=await JarScene.create(canvas,{winter,gift});
        if(suspended){gfx.dispose();gfx=null;return;}
        delete stage.dataset.error;
        if (active) gfx.resize();
        dirty=true;
        if(!run)state(note.classList.contains('show')?'revealed':'idle');
        queue();
      } catch (error) {
        stage.dataset.error=error.message;
        stage.dispatchEvent(new Event('dr-scene-settled'));
        if(!run)state('fallback');
        if (!search.has('no3d')) console.warn('Оптическая 3D-сцена недоступна:',error.message);
      } finally {
        loading=false;
      }
    }

    function activate(on) {
      active=on;
      if(on) {
        root.dataset.drawState=phase;
        if(gfx){ gfx.resize();dirty=true;queue(); }
        else if(!attempted) {
          if(window.requestIdleCallback)requestIdleCallback(initialize,{timeout:350});
          else setTimeout(initialize,40);
        }
      } else {
        cancelAnimationFrame(frame);
        frame=0;
        resultPose=false;
        velocity=0;
        pointer=null;
      }
    }

    function start(prepare,commit,{animate:wantAnimation=true}={}) {
      if(run)return false;
      resultPose=false;
      const animated=wantAnimation&&active&&Boolean(gfx)&&painted&&!suspended&&!motion.matches;
      run={prepare,commit,animated,at:performance.now(),prepared:false,box:null};
      velocity=0;
      state(animated?'drawing':(gfx?'revealing':'fallback'));
      update();
      if(animated){
        gfx.syncBounds();
        note.dataset.flight='true';
        note.style.setProperty('--flight-alpha','0');
        note.style.setProperty('--flight-copy','0');
        prepare();
        run.prepared=true;
        run.box=note.getBoundingClientRect();
        run.at=performance.now();
        animations++;
        queue();
      }
      else timer=setTimeout(()=>finish(true),motion.matches?40:175);
      return true;
    }

    const resize=()=>{
      if(!active||!gfx)return;
      if(run){run.box=null;run.handoff=null;}
      gfx.resize();dirty=true;queue();
    };
    new ResizeObserver(resize).observe(canvas);
    canvas.addEventListener('webglcontextlost',event=>{
      event.preventDefault();
      suspended=true;
      cancelAnimationFrame(frame);
      frame=0; painted=false;
      delete stage.dataset.ready;
      if(run)finish(true);
      state('fallback');
      update();
    });
    canvas.addEventListener('webglcontextrestored',()=>{
      // Three resets its internal state in the same event. A fresh scene
      // regenerates the baked reflection target once the context is usable.
      queueMicrotask(()=>{
        suspended=false;
        gfx?.dispose();
        gfx=null;
        attempted=false;
        if(active)initialize();
      });
    });
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden) {
        if(run)finish(false);
        cancelAnimationFrame(frame);frame=0;velocity=0;
      } else if(active)activate(true);
    });
    motion.addEventListener?.('change',()=>{
      if(run && motion.matches)finish(true);
      if(motion.matches)velocity=0;
    });
    window.addEventListener('pagehide',event=>{
      if(event.persisted)return;
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      gfx?.dispose();
      gfx=null;
    });

    canvas.addEventListener('pointerdown',e=>{
      if(!gfx||suspended||run||e.button!==0||!gfx.hit(e.clientX,e.clientY))return;
      pointer={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,at:e.timeStamp,locked:false};
      velocity=0;
    });
    canvas.addEventListener('pointermove',e=>{
      if(!pointer||e.pointerId!==pointer.id)return;
      if(!pointer.locked){
        const dx=Math.abs(e.clientX-pointer.x),dy=Math.abs(e.clientY-pointer.y);
        if(dy>8&&dy>dx){pointer=null;return;}
        if(dx<5)return;
        pointer.locked=true;
        canvas.setPointerCapture(e.pointerId);
      }
      const change=(e.clientX-pointer.lastX)*.0105;
      const dt=Math.max(8,e.timeStamp-pointer.at);
      yaw+=change;
      pitch=Math.max(-.10,Math.min(.10,(e.clientY-pointer.y)*.002));
      velocity=Math.max(-.012,Math.min(.012,change/dt*.80+velocity*.20));
      pointer.lastX=e.clientX;pointer.at=e.timeStamp;
      dirty=true;queue();
    });
    function release(e){
      if(!pointer||e.pointerId!==pointer.id)return;
      if(motion.matches||e.type==='pointercancel'||e.timeStamp-pointer.at>100)velocity=0;
      if(motion.matches)pitch=0;
      pointer=null;
      dirty=true;queue();
    }
    canvas.addEventListener('pointerup',release);
    canvas.addEventListener('pointercancel',release);
    canvas.addEventListener('pointerleave',e=>{if(pointer&&!pointer.locked)release(e);});

    return {
      activate,start,interrupt:()=>finish(false),busy:()=>Boolean(run),
      get state(){return phase;},
      get yaw(){return yaw;},
      stats:()=>({...gfx?.stats(),phase,animations,updates,interruptions,yaw,painted}),
      context:()=>gfx?.context(),
    };
  }
  window.DRExperience={setup,loadThree};
})();
