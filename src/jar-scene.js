/* Camera and meshes are exported from the approved Phase 02C .blend. */
(() => {
  const assets = 'assets/';
  const param = new URLSearchParams(location.search);
  const vertex = `
    varying vec3 vNormal;
    varying vec3 vLocal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vLocal = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;

  const qualities={
    high:{cap:2.35,refraction:1,mesh:'original'},
    balanced:{cap:1.8,refraction:.93,mesh:'jar'},
    low:{cap:1.3,refraction:.86,mesh:'jar'},
  };
  const glassShader = `
    uniform sampler2D uOpaque;
    uniform sampler2D uPlate;
    uniform vec2 uSize, uRatio;
    uniform vec4 uCrop;
    varying vec3 vNormal;
    varying vec3 vLocal;
    vec3 linearPlate(vec2 uv){
      vec3 c=texture2D(uPlate,(uCrop.xy+uv*uCrop.zw-.5)*uRatio+.5).rgb;
      return mix(c/12.92,pow((c+.055)/1.055,vec3(2.4)),step(.04045,c));
    }
    vec3 transmitted(vec2 uv){
      vec4 p=texture2D(uOpaque,uv);
      return mix(linearPlate(uv),p.rgb,p.a);
    }
    float band(float at,float width,float x){
      float t=(x-at)/width;
      return exp(-t*t);
    }
    void main(){
      vec3 n=normalize(vNormal);
      vec3 view=vec3(0.,0.,1.);
      float angle=clamp(abs(n.z),.001,1.);
      float fresnel=.039+.961*pow(1.-angle,5.);
      float thickness=1.-smoothstep(.10,.32,vLocal.y);
      float neck=smoothstep(2.06,2.33,vLocal.y);
      float phi=atan(vLocal.z,vLocal.x);
      float flute=cos(phi*28.);
      vec2 uv=gl_FragCoord.xy/uSize;
      vec2 aspect=vec2(1.,uSize.x/uSize.y);
      vec3 ray=refract(-view,n,1./1.46);
      vec2 bias=(ray.xy*.071 - n.xy*(.006+.040*thickness+.025*neck))*aspect;
      vec3 light=transmitted(uv+bias);
      vec3 straight=transmitted(uv);
      vec3 refraction=mix(straight,light,.84);
      float foot=band(.158+.010*flute,.032,vLocal.y);
      float inner=band(.255+.010*flute,.018,vLocal.y);
      float pale=band(.075+.008*flute,.035,vLocal.y);
      if (vLocal.y < .32) {
        vec3 caustic=transmitted(uv+vec2(n.x*.006,.026));
        refraction=mix(refraction,caustic,inner*.47+pale*.19);
      }
      vec3 reflection=reflect(-view,n);
      float wide=band(-.83,.31,reflection.x)*band(.26,.95,reflection.y);
      float key=band(-.84,.19,reflection.x)*band(.28,.80,reflection.y);
      float rim=band(.85,.21,reflection.x)*band(.20,1.08,reflection.y);
      float soft=band(.55,.58,reflection.y)*band(-.18,.78,reflection.x);
      float mouth=band(2.327,.031,vLocal.y);
      float mouthShade=band(2.25,.036,vLocal.y);
      float spine=smoothstep(.46,.97,abs(n.x))*(.8+.2*flute);
      vec3 lights=vec3(.99,.91,.92)*(.28*wide+.27*key+.42*rim+.16*soft);
      vec3 mirror=mix(vec3(.18,.13,.175),vec3(.78,.66,.72),.54*wide+.4*rim);
      vec3 color=mix(refraction*vec3(.997,.984,.990),mirror,fresnel*.90);
      color*=1.-foot*.75-inner*.27-mouthShade*.35-spine*.22;
      color+=lights*(.38+.54*pow(1.-angle,2.))+vec3(.91,.86,.90)*(.21*pale+.19*mouth+.08*inner);
      #ifdef CHRISTMAS
        float polish=.17*wide+.22*rim+.09*soft;
        color+=vec3(.95,.87,.77)*(polish+.14*mouth+.11*pale);
      #endif
      gl_FragColor=vec4(color,1.);
      #include <encodings_fragment>
    }`;

  async function geometry(THREE, stem) {
    const [meta, data] = await Promise.all([
      fetch(assets+stem+'.json').then(response => {
        if (!response.ok) throw Error('Jar manifest '+response.status);
        return response.json();
      }),
      fetch(assets+stem+'.bin').then(response => {
        if (!response.ok) throw Error('Jar mesh '+response.status);
        return response.arrayBuffer();
      }),
    ]);
    const parts = {};
    try {
      for (const [name, part] of Object.entries(meta.parts)) {
        const {vertices, indices, offset, colors} = part;
        const g = new THREE.BufferGeometry();
        parts[name] = g;
        const packed = new Int16Array(data,offset,vertices*6);
        const pos = new Float32Array(vertices*3);
        const normal = new Float32Array(vertices*3);
        for (let v=0;v<vertices;v++) {
          for (let axis=0;axis<3;axis++) {
            pos[3*v+axis] = packed[6*v+axis] / 10000;
            normal[3*v+axis] = packed[6*v+3+axis] / 32767;
          }
        }
        g.setAttribute('position',new THREE.BufferAttribute(pos,3));
        g.setAttribute('normal',new THREE.BufferAttribute(normal,3));
        g.setIndex(new THREE.BufferAttribute(new Uint16Array(data,offset+vertices*12,indices),1));
        if (colors) {
          const source = new Uint8Array(data,offset+vertices*12+indices*2,vertices*3);
          const linear = new Float32Array(source.length);
          for (let i=0; i<source.length;i++) {
            const c=source[i]/255;
            linear[i]=c<=.04045?c/12.92:((c+.055)/1.055)**2.4;
          }
          g.setAttribute('color',new THREE.BufferAttribute(linear,3));
        }
      }
    } catch (error) {
      Object.values(parts).forEach(part => part.dispose());
      throw error;
    }
    return {meta, parts};
  }

  function studioEnvironment(THREE) {
    // A small lat-long light rig baked to a texture. It represents the broad
    // key, rim and overhead silk without a costly HDR download.
    const canvas = document.createElement('canvas');
    canvas.width=256;
    canvas.height=128;
    const ctx=canvas.getContext('2d');
    const image=ctx.createImageData(256,128);
    const windows=[
      {u:.17,v:.33,spreadU:.102,spreadV:.22,tone:[.54,.50,.44]},
      {u:.77,v:.41,spreadU:.070,spreadV:.28,tone:[.62,.52,.54]},
      {u:.49,v:.16,spreadU:.27,spreadV:.15,tone:[.58,.57,.55]},
    ];
    for (let y=0;y<128;y++) for (let x=0;x<256;x++) {
      const i=(y*256+x)*4;
      const shade=.095+.11*(1-y/128);
      const color=[shade,shade*.87,shade*.97];
      for (const light of windows) {
        const dx=Math.abs(x/256-light.u);
        const dy=y/128-light.v;
        const gain=Math.exp(-((Math.min(dx,1-dx)/light.spreadU)**2+(dy/light.spreadV)**2)*1.9);
        light.tone.forEach((t,c) => { color[c]+=gain*t; });
      }
      for(let c=0;c<3;c++) image.data[i+c]=Math.min(255,Math.round(color[c]*255));
      image.data[i+3]=255;
    }
    ctx.putImageData(image,0,0);
    const texture=new THREE.CanvasTexture(canvas);
    texture.mapping=THREE.EquirectangularReflectionMapping;
    return texture;
  }

  async function create(canvas, options={}) {
    const T=options.three||window.THREE;
    if (!T) throw Error('Three.js r128 unavailable');
    const modern=Number(T.REVISION)>128;
    const initial=options.initial === true || options.method==='alpha';
    const physical=options.method==='physical' && modern;
    const hint=options.quality||param.get('quality')||(param.has('low')?'low':null);
    const winter=Boolean(options.winter);
    const plateAsset=winter?'CHRISTMAS_PLATE.webp':'ROMANTIC_PLATE.webp';
    const convertShader=source=>modern?source.replaceAll('encodings_fragment','colorspace_fragment'):source;
    const makeShader=spec=>new T.ShaderMaterial({...spec,fragmentShader:convertShader(spec.fragmentShader)});
    const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
    const gl=renderer.getContext();
    const extension=gl.getExtension('WEBGL_debug_renderer_info');
    const gpu=extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : '';
    const lowMemory=navigator.deviceMemory&&navigator.deviceMemory<=2;
    const software=/swiftshader|llvmpipe|software rasterizer/i.test(gpu);
    const desktopGPU=/apple|amd|radeon|nvidia/i.test(gpu)&&matchMedia('(pointer:fine)').matches&&devicePixelRatio>=2;
    const quality=Object.hasOwn(qualities,hint)?hint:(lowMemory||software?'low':desktopGPU?'high':'balanced');
    const profile=qualities[quality];
    const resources=[];
    if(!options.method)document.documentElement.dataset.visualQuality=quality;
    try {
      const modelPromise=geometry(T,options.gift?'gift':profile.mesh).then(result => {
        resources.push(...Object.values(result.parts));
        return result;
      });
      const loader=new T.TextureLoader();
      const platePromise=loader.loadAsync(assets+plateAsset).then(texture => {
        resources.push(texture);
        return texture;
      }).catch(() => { throw Error('Optical background failed to load'); });
      // Settle both requests so a late load never retains resources after an error.
      const results=await Promise.allSettled([modelPromise,platePromise]);
      const failure=results.find(result=>result.status==='rejected');
      if(failure) throw failure.reason;
      const [{meta,parts},plate]=results.map(result=>result.value);
      if(modern) renderer.outputColorSpace=T.SRGBColorSpace;
      else renderer.outputEncoding=T.sRGBEncoding;
      renderer.toneMapping=T.NoToneMapping;
      renderer.toneMappingExposure=1;
      renderer.setClearColor(0xf8f3f4,1);
      renderer.autoClear=false;
      renderer.info.autoReset=false;
      const scene=new T.Scene();
      const camera=new T.OrthographicCamera(-1,1,1,-1,.01,45);
      camera.position.fromArray(meta.camera.position);
      const q=meta.camera.quaternion;
      camera.quaternion.set(q[1],q[2],q[3],q[0]);
      camera.updateMatrixWorld();
      const ortho=new T.OrthographicCamera(-1,1,1,-1,0,2);

      const envSource=studioEnvironment(T);
      const pmrem=new T.PMREMGenerator(renderer);
      const env=pmrem.fromEquirectangular(envSource);
      pmrem.dispose(); envSource.dispose();
      scene.environment=env.texture;
      resources.push(env);

      const plateMaterial=makeShader({
        depthTest:false,depthWrite:false,
        uniforms:{uPlate:{value:plate},uRatio:{value:new T.Vector2(1,1)},uCrop:{value:new T.Vector4(0,0,1,1)}},
        vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',
        fragmentShader:`uniform sampler2D uPlate;uniform vec2 uRatio;uniform vec4 uCrop;varying vec2 vUv;
          void main() {
            gl_FragColor=vec4(texture2D(uPlate,(uCrop.xy+vUv*uCrop.zw-.5)*uRatio+.5).rgb,1.);
          }`,
      });
      const plateScene=new T.Scene();
      const plane=new T.PlaneGeometry(2,2);
      const backdrop=new T.Mesh(plane,plateMaterial);
      backdrop.frustumCulled=false;
      backdrop.renderOrder=-100;
      if(physical) scene.add(backdrop);
      else plateScene.add(backdrop);
      resources.push(plateMaterial,plane);
      const jar=new T.Group();
      jar.position.fromArray(meta.jar);
      scene.add(jar);
      const lid=new T.Group();
      lid.position.fromArray(meta.lid);
      jar.add(lid);

      function material(spec) {
        const m=new T.MeshStandardMaterial(spec);
        if(spec.color&&!modern) m.color.convertSRGBToLinear();
        resources.push(m);
        return m;
      }
      const paper=material({vertexColors:true,roughness:.94,metalness:0,envMapIntensity:.34,side:T.FrontSide});
      const cap=makeShader({
        vertexShader:vertex,
        fragmentShader:`varying vec3 vNormal; varying vec3 vLocal;
          void main() {
            vec3 n=normalize(vNormal);
            float pool=exp(-dot(vLocal.xz+vec2(.29,-.12),vLocal.xz+vec2(.29,-.12))*2.0);
            float ridge=smoothstep(.0,.16,n.y);
            vec3 tone=mix(${winter?'vec3(.51,.32,.115),vec3(.90,.72,.39)':'vec3(.61,.44,.52),vec3(.94,.80,.84)'},ridge);
            float highlight=pow(max(0.,dot(n,normalize(vec3(-.24,.81,.48)))),11.);
            tone+=vec3(.04,.05,.048)*pool + vec3(.07,.061,.06)*highlight + .022*max(0.,-n.x);
            gl_FragColor=vec4(tone,1.);
            #include <encodings_fragment>
          }`,
      });
      resources.push(cap);
      const rim=options.gift?material({color:0xe9bc67,roughness:.29,metalness:.32,envMapIntensity:1.12,side:T.DoubleSide})
        :material({color:winter?0xc3944d:0xbfa5b2,roughness:.29,metalness:.52,envMapIntensity:.72});
      const liner=material({color:options.gift?0xf0d5a6:0xdebfb4,roughness:.57});
      const wrapping=options.gift?makeShader({
        uniforms:{tone:{value:new T.Vector3(.40,.022,.057)}},
        vertexShader:vertex,
        fragmentShader:`uniform vec3 tone;varying vec3 vNormal,vLocal;
          float grain(vec3 x){return fract(sin(dot(floor(x*520.),vec3(127.1,311.7,269.5)))*43758.5453);}
          void main(){
            vec3 n=normalize(vNormal);
            float diffuse=max(0.,dot(n,normalize(vec3(-.48,.65,.70))));
            float soft=max(0.,dot(n,normalize(vec3(.70,.35,.39))));
            float light=.53+.63*diffuse+.19*soft;
            float fold=pow(max(0.,n.y),4.);
            float glance=pow(max(0.,dot(n,normalize(vec3(-.16,.92,.36)))),15.);
            float center=exp(-dot(vLocal.xz,vLocal.xz)*.64);
            vec2 pattern=vec2(atan(vLocal.z,vLocal.x)*.7,vLocal.y)*22.;
            float stitch=1.-smoothstep(.04,.13,length(fract(pattern)-.5));
            vec3 rgb=tone*light+fold*vec3(.13,.023,.036)
                +glance*center*vec3(.08,.035,.029)
                +vec3(.07,.015,.016)*stitch+(grain(vLocal)-.5)*.014;
            gl_FragColor=vec4(rgb,1.);
            #include <encodings_fragment>
          }`,
      }):null;
      if(wrapping)resources.push(wrapping);
      function add(name,m,parent) {
        const mesh=new T.Mesh(parts[name],m);
        parent.add(mesh);
        return mesh;
      }
      const notes=add('paper',paper,jar);
      add('cap',wrapping||cap,lid);
      if(parts.bodyRibbon)add('bodyRibbon',rim,jar);
      add('rim',rim,lid);
      add('liner',liner,lid);
      const slip=add('scroll',paper,scene);
      const forward=camera.getWorldDirection(new T.Vector3()).negate();
      const viewRotation=camera.quaternion.clone();
      const lipRotation=new T.Quaternion();
      const turn=new T.Quaternion();
      const scrollEuler=new T.Euler();
      const mouth=new T.Vector3();
      const scrollCenter=new T.Vector3();
      const scrollBounds=new T.Box3();
      const scrollCorner=new T.Vector3();
      parts.scroll.computeBoundingBox();
      const paperBounds=parts.scroll.boundingBox;
      const lineOfSight=new T.Vector3();
      slip.visible=false;
      scene.add(new T.HemisphereLight(winter?0xffefd2:0xfff3f4,winter?0x567b66:0x745967,.62));
      const key=new T.DirectionalLight(winter?0xffdb9e:0xffeee3,winter?.85:.72);
      key.position.set(-3,6,4);
      const rimLight=new T.DirectionalLight(winter?0xbfe4c7:0xffd9e9,.41);
      rimLight.position.set(4,4,-3);
      const bounce=new T.DirectionalLight(0xfff5fa,.19);
      bounce.position.set(3,1,5);
      scene.add(key,rimLight,bounce);

      const shadowGeometry=new T.PlaneGeometry(5.0,3.4);
      const shadowMaterial=makeShader({
        transparent:true,depthWrite:false,depthTest:true,
        uniforms:{strength:{value:1}},
        vertexShader:`varying vec2 p;void main(){p=2.*uv-1.;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
        fragmentShader:`uniform float strength;varying vec2 p;void main(){
          float d=${options.gift?'pow(pow(abs(p.x*2.5),4.)+pow(abs(p.y*1.71),4.),.25)':'length(p*vec2(2.5,1.71))'};
          float edge=exp(-pow((d-.74)/.34,2.));
          float core=exp(-d*d*1.88);
          float contact=exp(-pow((d-.83)/.14,2.));
          float a=(.19*edge+.26*core+.21*contact)*strength;
          gl_FragColor=vec4(.135,.083,.112,a);
          #include <encodings_fragment>
        }`,
      });
      const shadow = new T.Mesh(shadowGeometry,shadowMaterial);
      shadow.rotation.x=-Math.PI/2;
      shadow.position.set(jar.position.x+.04,.004,-.04);
      scene.add(shadow);
      resources.push(shadowGeometry,shadowMaterial);

      let glass,target=null;
      const uSize=new T.Vector2(1,1);
      if(options.gift) {
        glass=wrapping;
      } else if(physical) {
        glass=new T.MeshPhysicalMaterial({color:0xfff1f5,roughness:.064,metalness:0,
          transmission:1,thickness:.13,ior:1.46,attenuationDistance:2.5,
          attenuationColor:new T.Color(0xf0cede),clearcoat:.16,envMapIntensity:.7,side:T.FrontSide});
        renderer.transmissionResolutionScale=.9;
      } else if(initial) {
        glass=new T.MeshPhysicalMaterial({
          color:0xffe7ee,transparent:true,opacity:.29,roughness:.11,
          metalness:.18,clearcoat:.76,envMapIntensity:1.4,depthWrite:false,side:T.FrontSide,
        });
        if(!modern) glass.color.convertSRGBToLinear();
      } else {
        target=new T.WebGLRenderTarget(1,1,{
          minFilter:T.LinearFilter,magFilter:T.LinearFilter,depthBuffer:true,
          stencilBuffer:false,generateMipmaps:false,
        });
        resources.push(target);
        glass=makeShader({
          uniforms:{uOpaque:{value:target.texture},uSize:{value:uSize},uPlate:{value:plate},uRatio:plateMaterial.uniforms.uRatio,uCrop:plateMaterial.uniforms.uCrop},
          defines:winter?{CHRISTMAS:1}:{},vertexShader:vertex,fragmentShader:glassShader,
        });
      }
      if(glass!==wrapping)resources.push(glass);
      const shell=add('glass',glass,jar);
      const dimensions=new T.Vector2();
      const position=new T.Vector3();
      const initialRoot=jar.position.clone();
      const initialLid=lid.position.clone();
      let frames=0;
      let stats={calls:0,triangles:0,frames:0};
      let disposed=false, sized=false;
      let box=null, opticalPose='', resizeKey='', needsTransmission=true;

      function resize() {
        box=canvas.getBoundingClientRect();
        const width=canvas.clientWidth;
        const height=canvas.clientHeight;
        if (!width || !height){sized=false;return;}
        sized=true;
        const host=canvas.parentElement;
        const cropped=canvas.classList.contains('scene-viewport');
        const totalWidth=cropped?host.clientWidth:width;
        const totalHeight=cropped?host.clientHeight:height;
        const x=cropped?canvas.offsetLeft:0;
        const y=cropped?canvas.offsetTop:0;
        const dpr=Math.min(profile.cap,window.devicePixelRatio||1);
        const key=[width,height,totalWidth,totalHeight,x,y,dpr].join('/');
        if(key===resizeKey)return;
        resizeKey=key;
        needsTransmission=true;
        const ratio=totalWidth/totalHeight;
        plateMaterial.uniforms.uCrop.value.set(x/totalWidth,1-(y+height)/totalHeight,width/totalWidth,height/totalHeight);
        plateMaterial.uniforms.uRatio.value.set(Math.min(1,ratio/meta.aspect),Math.min(1,meta.aspect/ratio));
        // Same cover crop as the fallback plate.
        camera.top=meta.height/2 * Math.min(1,meta.aspect/ratio);
        camera.bottom=-camera.top;
        camera.right=camera.top*ratio;
        camera.left=-camera.right;
        camera.setViewOffset(totalWidth,totalHeight,x,y,width,height);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width,height,false);
        renderer.getDrawingBufferSize(dimensions);
        uSize.copy(dimensions);
        if(target)target.setSize(Math.max(1,Math.round(dimensions.x*profile.refraction)),Math.max(1,Math.round(dimensions.y*profile.refraction)));
      }

      function pass(destination) {
        renderer.setRenderTarget(destination);
        renderer.clear(true,true,true);
        if(!physical)renderer.render(plateScene,ortho);
        renderer.render(scene,camera);
      }

      function render() {
        if(disposed || !sized || renderer.getContext().isContextLost()) return;
        if(!frames && software){
          // The moving paper must run once against the actual framebuffer;
          // the linear upload pass does not exercise the presentation path.
          slip.position.copy(initialRoot).add(mouth.set(0,1.7,0));
          slip.visible=true;
          pass(null);
          slip.visible=false;
        }
        renderer.info.reset();
        if (target && needsTransmission) {
          renderer.setRenderTarget(target);
          renderer.setClearColor(0,0);
          renderer.clear(true,true,true);
          shell.visible=false;
          lid.visible=false;
          shadow.visible=false;
          const floatingPaper=slip.visible;
          slip.visible=false;
          renderer.render(scene,camera);
          slip.visible=floatingPaper;
          shell.visible=true;
          lid.visible=true;
          shadow.visible=true;
          renderer.setClearColor(0xf8f3f4,1);
          needsTransmission=false;
        }
        if(target)notes.visible=false;
        pass(null);
        notes.visible=true;
        frames++;
        stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,frames};
      }

      const lidBounds=new T.Box3();
      const lidPoint=new T.Vector3();
      const lidShift=new T.Vector3();
      const lidOrigin=new T.Vector3();
      function projectLid() {
        jar.updateMatrixWorld(true);
        lidBounds.makeEmpty();
        for(const mesh of lid.children) {
          if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
          const bounds=mesh.geometry.boundingBox;
          for(const x of [bounds.min.x,bounds.max.x])
            for(const y of [bounds.min.y,bounds.max.y])
              for(const z of [bounds.min.z,bounds.max.z])
                lidBounds.expandByPoint(lidPoint.set(x,y,z).applyMatrix4(mesh.matrixWorld).project(camera));
        }
        return lidBounds;
      }

      function setPose(pose) {
        const signature=[pose.yaw,pose.pitch,pose.raise,pose.scale,pose.roll]
          .map(v=>Math.round((v||0)*230)).join('|');
        if(signature!==opticalPose)needsTransmission=true;
        opticalPose=signature;
        jar.position.copy(initialRoot);
        jar.position.y+=pose.raise||0;
        jar.scale.setScalar(pose.scale??1);
        jar.rotation.set(pose.pitch||0,pose.yaw||0,pose.roll||0);
        lid.position.set(initialLid.x+(pose.lidX||0),initialLid.y+(pose.lidY||0),initialLid.z+(pose.lidZ||0));
        lid.rotation.set(pose.lidTilt||0,pose.lidTwist||0,pose.lidRoll||0);
        if (pose.lidY) {
          const bounds=projectLid();
          const dx=Math.max(0,-.97-bounds.min.x)-Math.max(0,bounds.max.x-.97);
          const dy=Math.max(0,-.97-bounds.min.y)-Math.max(0,bounds.max.y-.97);
          if(dx||dy){
            lidOrigin.set(0,0,0).unproject(camera);
            lidShift.set(dx,dy,0).unproject(camera);
            lid.position.add(jar.worldToLocal(lidShift).sub(jar.worldToLocal(lidOrigin)));
          }
        }
        slip.visible=Boolean(pose.scroll);
        if (pose.flight) {
          const {lip,rise,approach,flatten,roll,fade}=pose.flight;
          jar.updateMatrixWorld(true);
          mouth.set(0,lip,0).applyMatrix4(jar.matrixWorld);
          const baselineDepth=lineOfSight.copy(camera.position).sub(mouth).dot(forward);
          const toward=2.65*approach;
          slip.position.copy(mouth).addScaledVector(forward,toward);
          slip.position.y+=rise;
          // Project the paper as a perspective dolly at the orthographic stage scale.
          const magnification=baselineDepth/(baselineDepth-toward);
          slip.scale.setScalar(magnification*(.94+.22*flatten)*(1-.04*fade));
          scrollEuler.set(.18,pose.yaw||0,-.62);
          lipRotation.setFromEuler(scrollEuler);
          turn.setFromAxisAngle(forward,roll);
          slip.quaternion.copy(lipRotation).slerp(viewRotation,flatten).premultiply(turn);
        }
        shadow.position.x=jar.position.x+.04;
        shadow.position.y=jar.position.y+.004;
        shadow.scale.setScalar(pose.scale??1);
        if(options.gift)shadow.rotation.z=-(pose.yaw||0);
        shadowMaterial.uniforms.strength.value=1-Math.abs(jar.rotation.z)*.28;
      }

      function projectScroll() {
        slip.updateWorldMatrix(true,false);
        scrollBounds.makeEmpty();
        for(const x of [paperBounds.min.x,paperBounds.max.x]){
          for(const y of [paperBounds.min.y,paperBounds.max.y]){
            for(const z of [paperBounds.min.z,paperBounds.max.z]){
              scrollBounds.expandByPoint(scrollCorner.set(x,y,z).applyMatrix4(slip.matrixWorld).project(camera));
            }
          }
        }
        scrollBounds.getCenter(scrollCenter);
        return {x:box.left+(scrollCenter.x+1)*box.width/2,y:box.top+(1-scrollCenter.y)*box.height/2,
          width:(scrollBounds.max.x-scrollBounds.min.x)*box.width/2,
          height:(scrollBounds.max.y-scrollBounds.min.y)*box.height/2,
          depth:position.copy(camera.position).sub(slip.position).dot(forward)};
      }

      function hit(x,y) {
        box=canvas.getBoundingClientRect();
        return x>box.left+.12*box.width && x<box.right-.12*box.width &&
          y>box.top+.34*box.height && y<box.top+.76*box.height;
      }

      function dispose() {
        if(disposed)return;
        disposed=true;
        resources.forEach(resource => resource.dispose());
        renderer.dispose();
      }
      // Upload the hidden paper geometry with a tiny non-presentation pass.
      const warmup=new T.WebGLRenderTarget(1,1);
      try {
        slip.visible=true;
        slip.position.set(0,1,0);
        shell.visible=false;
        pass(warmup);
      } finally {
        renderer.setRenderTarget(null);
        warmup.dispose();
        slip.visible=false;
        shell.visible=true;
      }
      return {resize,render,setPose,projectScroll,hit,dispose,
        lidBounds:()=>{const bounds=projectLid();return {min:bounds.min.toArray(),max:bounds.max.toArray()};},
        stats:()=>({...stats,geometry:renderer.info.memory.geometries,textures:renderer.info.memory.textures,
          quality, framebuffer:dimensions.toArray(),refraction:target?[target.width,target.height]:null}),
        syncBounds:()=>{box=canvas.getBoundingClientRect();},
        context:()=>renderer.getContext()};
    } catch (error) {
      resources.forEach(resource => resource.dispose());
      renderer.dispose();
      throw error;
    }
  }
  window.JarScene={create};
})();
