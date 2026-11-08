(() => {
 'use strict';
 const links=[...document.querySelectorAll('.artifact-inspect')];
 if(!links.length||typeof HTMLDialogElement==='undefined')return;
 const lang=document.documentElement.lang.slice(0,2);
 const text={zh:{close:'关闭图片',in:'放大',out:'缩小',reset:'适应屏幕',hint:'滚轮缩放 · 放大后拖动 · 双击切换倍率',short:'点击 + 放大后可拖动查看细节',title:'图片细节'},en:{close:'Close image',in:'Zoom in',out:'Zoom out',reset:'Fit image',hint:'Scroll to zoom · Drag to pan · Double-click to zoom',short:'Zoom in, then drag to inspect',title:'Image details'},ko:{close:'이미지 닫기',in:'확대',out:'축소',reset:'화면에 맞춤',hint:'휠로 확대 · 확대 후 드래그 · 두 번 눌러 배율 변경',short:'확대한 후 드래그하여 살펴보세요',title:'이미지 상세'},ja:{close:'画像を閉じる',in:'拡大',out:'縮小',reset:'全体を表示',hint:'ホイールで拡大 · 拡大後ドラッグ · ダブルクリックで切替',short:'拡大後ドラッグして細部を確認',title:'画像の詳細'}}[lang]||{close:'Close',in:'Zoom in',out:'Zoom out',reset:'Fit',hint:'Scroll to zoom · Drag to pan',short:'Zoom and drag to inspect',title:'Image details'};
 const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value)n.textContent=value;return n;};
 const dialog=el('dialog','artifact-inspector');dialog.setAttribute('aria-label',text.title);
 const header=el('div','inspector-head'),name=el('h2','inspector-title'),close=el('button','inspector-close','×');close.type='button';close.setAttribute('aria-label',text.close);header.append(name,close);
 const viewport=el('div','inspector-viewport'),image=el('img','inspector-image');viewport.tabIndex=0;viewport.setAttribute('aria-label',text.hint);image.draggable=false;viewport.append(image);
 const footer=el('div','inspector-footer'),hint=el('p','inspector-hint',matchMedia('(pointer:coarse)').matches?text.short:text.hint),controls=el('div','inspector-controls');
 const minus=el('button',null,'−'),plus=el('button',null,'+'),reset=el('button','inspector-reset',text.reset),output=el('output','inspector-zoom','100%');
 for(const b of [minus,plus,reset])b.type='button';minus.setAttribute('aria-label',text.out);plus.setAttribute('aria-label',text.in);output.setAttribute('aria-live','polite');controls.append(minus,output,plus,reset);footer.append(hint,controls);dialog.append(header,viewport,footer);document.body.append(dialog);
 let zoom=1,x=0,y=0,drag=null,opener=null;
 function clamp(){const base=image.getBoundingClientRect();const maxX=Math.max(0,(base.width-viewport.clientWidth)/2),maxY=Math.max(0,(base.height-viewport.clientHeight)/2);x=Math.max(-maxX,Math.min(maxX,x));y=Math.max(-maxY,Math.min(maxY,y));}
 function render(){image.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;output.value=Math.round(zoom*100)+'%';viewport.classList.toggle('is-zoomed',zoom>1.01);minus.disabled=zoom<=1;plus.disabled=zoom>=3;}
 function setZoom(value){zoom=Math.max(1,Math.min(3,value));if(zoom===1)x=y=0;image.style.transform=`translate(${x}px,${y}px) scale(${zoom})`;clamp();render();}
 function fit(){zoom=1;x=y=0;render();}
 links.forEach(link=>{
  link.addEventListener('click',event=>{event.preventDefault();opener=link;name.textContent=link.querySelector('img').alt;image.alt=name.textContent;image.src=link.href;fit();dialog.showModal();close.focus();});
  let pending=0;
  link.addEventListener('pointermove',event=>{if(event.pointerType!=='mouse'||pending)return;const cx=event.clientX,cy=event.clientY;pending=requestAnimationFrame(()=>{const r=link.getBoundingClientRect();link.style.setProperty('--image-x',((cx-r.left)/r.width*100)+'%');link.style.setProperty('--image-y',((cy-r.top)/r.height*100)+'%');pending=0;});});
 });
 image.addEventListener('load',fit);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{drag=null;fit();opener?.focus();});
 minus.addEventListener('click',()=>setZoom(zoom-.25));plus.addEventListener('click',()=>setZoom(zoom+.25));reset.addEventListener('click',fit);
 viewport.addEventListener('wheel',event=>{event.preventDefault();setZoom(zoom+(event.deltaY<0?.12:-.12));},{passive:false});
 viewport.addEventListener('dblclick',()=>setZoom(zoom>1?1:2));
 viewport.addEventListener('pointerdown',event=>{if(event.button!==0||zoom<=1)return;drag={px:event.clientX,py:event.clientY,x,y};viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');});
 viewport.addEventListener('pointermove',event=>{if(!drag)return;x=drag.x+event.clientX-drag.px;y=drag.y+event.clientY-drag.py;clamp();render();});
 const release=()=>{drag=null;viewport.classList.remove('is-dragging');};viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
 dialog.addEventListener('keydown',event=>{let handled=true;switch(event.key){case '+':case '=':setZoom(zoom+.25);break;case '-':setZoom(zoom-.25);break;case '0':fit();break;case 'ArrowLeft':x+=40;clamp();render();break;case 'ArrowRight':x-=40;clamp();render();break;case 'ArrowUp':y+=40;clamp();render();break;case 'ArrowDown':y-=40;clamp();render();break;default:handled=false;}if(handled)event.preventDefault();});
 addEventListener('resize',()=>{if(dialog.open){clamp();render();}},{passive:true});
})();
