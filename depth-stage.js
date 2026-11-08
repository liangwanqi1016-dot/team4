(() => {
 'use strict';
 const root=document.querySelector('.depth-hero');
 if(!root)return;
 const canvas=root.querySelector('.depth-canvas'),fallback=root.querySelector('.depth-fallback');
 const buttons=[...root.querySelectorAll('.depth-object')];
 const title=root.querySelector('.depth-object-name'),watch=root.querySelector('.depth-watch');
 const count=root.querySelector('.depth-count'),status=root.querySelector('.depth-status');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 let active=0,lit=true,zoom=1,rotationX=0,rotationY=0,targetX=0,targetY=0,lightX=.6,lightY=.48;
 let drag=null,request=0,visible=true,gl,program,texture,buffer,indexBuffer,indexCount=0,uniforms={};
 let textureRequest=0,ready=false,lastTime=0;
 const vertex=`attribute vec3 position;attribute vec2 uv;uniform float aspect;uniform float imageAspect;uniform vec2 rotation;uniform float zoom;varying vec2 vUv;varying float vDepth;
 void main(){vec3 p=position;float cy=cos(rotation.y),sy=sin(rotation.y),cx=cos(rotation.x),sx=sin(rotation.x);p.x*=imageAspect;p.x+=.27;p=vec3(p.x*cy+p.z*sy,p.y,-p.x*sy+p.z*cy);p=vec3(p.x,p.y*cx-p.z*sx,p.y*sx+p.z*cx);float cover=(aspect<1.0?aspect/imageAspect*1.24:max(aspect/imageAspect,1.0)*1.22)*zoom;p*=cover;if(aspect<1.0)p.y-=.34;float distance=3.8;float perspective=distance/(distance-p.z);gl_Position=vec4(p.x*perspective/aspect,p.y*perspective,0.0,1.0);vUv=uv;vDepth=position.z;}`;
 const fragment=`precision mediump float;uniform sampler2D picture;uniform vec2 light;uniform float lit;varying vec2 vUv;varying float vDepth;void main(){vec3 color=texture2D(picture,vUv).rgb;float glow=exp(-dot((vUv-light)*vec2(1.3,1.0),(vUv-light)*vec2(1.3,1.0))*5.0);float edge=(1.0-smoothstep(.25,.9,distance(vUv,vec2(.5))));color*=mix(.68,.83+glow*.28,lit);color*=.83+edge*.17;color+=vec3(.05,.036,.015)*glow*lit;float fade=smoothstep(0.0,.095,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));gl_FragColor=vec4(color,fade);}`;
 function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('Shader compilation failed');return s;}
 try{
  gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});
  if(!gl)throw new Error('No WebGL');
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Shader linking failed');
  gl.useProgram(program);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);buffer=gl.createBuffer();indexBuffer=gl.createBuffer();texture=gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  for(const name of ['aspect','imageAspect','rotation','zoom','picture','light','lit'])uniforms[name]=gl.getUniformLocation(program,name);
 }catch(error){gl=null;canvas.hidden=true;root.classList.add('depth-static');}
 let imageAspect=16/9;
 function mesh(image){
  const sampler=document.createElement('canvas');sampler.width=160;sampler.height=90;
  const context=sampler.getContext('2d',{willReadFrequently:true});context.drawImage(image,0,0,160,90);
  const pixels=context.getImageData(0,0,160,90).data,vertices=[],indices=[],cols=100,rows=58;
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){
   const u=x/cols,v=y/rows,px=Math.min(159,Math.floor(u*159)),py=Math.min(89,Math.floor(v*89)),i=(py*160+px)*4;
   const luminance=(pixels[i]*.2126+pixels[i+1]*.7152+pixels[i+2]*.0722)/255;
   const focus=Math.exp(-Math.pow((u-.5)/.28,4)-Math.pow((v-.55)/.44,4));
   const depth=focus*.14+(1-luminance)*focus*.025;
   vertices.push((u-.5)*2,(.5-v)*2,depth,u,v);
  }
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}
  gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position'),uv=gl.getAttribLocation(program,'uv');
  gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,3,gl.FLOAT,false,20,0);gl.enableVertexAttribArray(uv);gl.vertexAttribPointer(uv,2,gl.FLOAT,false,20,12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);indexCount=indices.length;
 }
 function schedule(){if(!request&&visible)request=requestAnimationFrame(draw);}
 function draw(time){
  request=0;
  if(!gl||!ready||!visible)return;
  const dt=Math.min((time-lastTime)/16.7||1,3);lastTime=time;
  rotationX+=(targetX-rotationX)*Math.min(.12*dt,1);rotationY+=(targetY-rotationY)*Math.min(.12*dt,1);
  const rect=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,1.7),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
  gl.uniform1f(uniforms.aspect,w/h);gl.uniform1f(uniforms.imageAspect,imageAspect);gl.uniform2f(uniforms.rotation,rotationX,rotationY);gl.uniform1f(uniforms.zoom,zoom);gl.uniform2f(uniforms.light,lightX,lightY);gl.uniform1f(uniforms.lit,lit?1:0);gl.uniform1i(uniforms.picture,0);
  gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
  if(Math.abs(targetX-rotationX)+Math.abs(targetY-rotationY)>.0003)schedule();
 }
 function load(index){
  active=index;const button=buttons[index],src=button.dataset.image,token=++textureRequest;
  title.textContent=button.dataset.name;count.textContent=String(index+1).padStart(2,'0')+' / 05';watch.href=button.dataset.film;
  fallback.src=src;fallback.alt=button.dataset.name;canvas.setAttribute('aria-label',button.dataset.name+' · '+canvas.dataset.interaction);
  buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));
  targetX=targetY=rotationX=rotationY=0;zoom=1;
  status.textContent=button.dataset.name;
  if(!gl)return;
  const image=new Image();image.onload=()=>{if(token!==textureRequest)return;imageAspect=image.naturalWidth/image.naturalHeight;
   try{mesh(image);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);ready=true;canvas.hidden=false;root.classList.add('depth-ready');schedule();}
   catch(error){ready=false;canvas.hidden=true;root.classList.add('depth-static');}
  };image.onerror=()=>{if(token===textureRequest){ready=false;canvas.hidden=true;}};image.src=src;
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>load(i)));
 function reset(){targetX=targetY=0;zoom=1;lightX=.6;lightY=.48;schedule();}
 root.querySelector('[data-depth="reset"]').addEventListener('click',reset);
 root.querySelector('[data-depth="in"]').addEventListener('click',()=>{zoom=Math.min(1.35,zoom+.08);schedule();});
 root.querySelector('[data-depth="out"]').addEventListener('click',()=>{zoom=Math.max(.9,zoom-.08);schedule();});
 const lightButton=root.querySelector('[data-depth="light"]');lightButton.addEventListener('click',()=>{lit=!lit;lightButton.setAttribute('aria-pressed',String(lit));schedule();});
 canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,rx:targetX,ry:targetY};canvas.setPointerCapture(event.pointerId);root.classList.add('depth-dragging');});
 canvas.addEventListener('pointermove',event=>{
  const rect=canvas.getBoundingClientRect();lightX=(event.clientX-rect.left)/rect.width;lightY=(event.clientY-rect.top)/rect.height;
  if(drag){targetY=Math.max(-.19,Math.min(.19,drag.ry+(event.clientX-drag.x)*.0007));targetX=Math.max(-.11,Math.min(.11,drag.rx+(event.clientY-drag.y)*.0005));}
  else if(event.pointerType==='mouse'&&!reduce){targetY=(lightX-.5)*.09;targetX=(lightY-.5)*.055;}
  if(reduce){rotationX=targetX;rotationY=targetY;}schedule();
 });
 function release(){drag=null;root.classList.remove('depth-dragging');}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);
 canvas.addEventListener('pointerleave',()=>{if(!drag){targetX=targetY=0;schedule();}});
 canvas.addEventListener('keydown',event=>{let handled=true;switch(event.key){case 'ArrowLeft':targetY=Math.max(-.19,targetY-.025);break;case 'ArrowRight':targetY=Math.min(.19,targetY+.025);break;case 'ArrowUp':targetX=Math.max(-.11,targetX-.02);break;case 'ArrowDown':targetX=Math.min(.11,targetX+.02);break;case '+':case '=':zoom=Math.min(1.35,zoom+.08);break;case '-':zoom=Math.max(.9,zoom-.08);break;case 'Escape':reset();break;default:handled=false;}if(handled){event.preventDefault();schedule();}});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();ready=false;canvas.hidden=true;root.classList.remove('depth-ready');});
 addEventListener('resize',schedule,{passive:true});
 document.addEventListener('visibilitychange',()=>{visible=!document.hidden;if(visible)schedule();});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&!document.hidden;if(visible)schedule();},{threshold:0}).observe(root);
 load(0);
})();
