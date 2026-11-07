'use strict';
const tr = text => window.uiText[text] || text;
const {themes,objects,source}=window.MUSEUM_DATA;
const menu=document.querySelector('.menu'),nav=document.querySelector('#nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');nav.classList.remove('open')}});
const dialog=document.querySelector('#object-dialog'),content=document.querySelector('#dialog-content');
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n};
document.querySelectorAll('.object-open').forEach(button=>button.addEventListener('click',()=>{
 const o=objects.find(x=>x.id===button.dataset.object);if(!o)return;
 const t=themes.find(x=>x.id===o.theme);content.replaceChildren(el('p',t.name+' / '+tr('馆藏选粹'),'eyebrow'),el('h2',o.name),el('p',o.ko,'korean'));
 const figure=el('figure',null,'object-figure');const image=el('img');image.src='assets/objects/'+o.id+'.jpg';image.alt=o.name;image.width=960;image.height=540;figure.append(image,el('figcaption',({'en':'Still from the supplied AI film','ko':'제공된 AI 영상의 장면','ja':'提供されたAI映像の一場面'})[document.documentElement.lang]||'用户提供的 AI 影片截帧'));content.append(figure);
 const dl=el('dl');[['年代',o.date],['材质',o.material],['尺寸 / 补充',o.size]].forEach(([k,v])=>{const row=el('div');row.append(el('dt',tr(k)),el('dd',v));dl.append(row)});
 content.append(dl,el('p',o.text,'body-text'),el('p',o.detail,'body-text'),el('p',o.note,'object-note'));
 const a=el('a',tr('馆刊原始记录 ↗'),'text-link');a.href=source;a.target='_blank';a.rel='noreferrer';content.append(a);
 if(window.MUSEUM_MEDIA[o.id]?.src){const film=el('a',tr('观看 AI 影片 →'),'text-link');const prefix=({'en':'en-','ko':'ko-','ja':'ja-'})[document.documentElement.lang]||'';film.href=prefix+'films.html#'+o.id;content.append(film)}
 dialog.showModal();
}));
document.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog){const b=dialog.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)dialog.close()}});
const filters=document.querySelectorAll('[data-filter]');filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));let count=0;document.querySelectorAll('.catalog-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.theme!==button.dataset.filter;if(!card.hidden)count++});document.querySelector('#filter-status').textContent=({'en':count+' objects','ko':count+'점 표시','ja':count+'件を表示'})[document.documentElement.lang] || `显示 ${count} 组藏品`;}));
const playlist=document.querySelector('#playlist');
if(playlist){
 const player=document.querySelector('#museum-video'),waiting=document.querySelector('#video-wait');
 const select=(o)=>{
  const t=themes.find(t=>t.id===o.theme),m=window.MUSEUM_MEDIA[o.id]||{};
  player.pause();player.replaceChildren();player.removeAttribute('src');player.removeAttribute('poster');
  const url=m.src?new URL(m.src,location.href):null;
  if(url&&['http:','https:'].includes(url.protocol)){
   player.src=url.href;if(m.poster)player.poster=m.poster;
   if(m.captions){const track=document.createElement('track');track.kind='captions';track.srclang='zh';track.label=tr('中文字幕');track.src=m.captions;track.default=true;player.append(track)}
   player.hidden=false;waiting.hidden=true;
  }else{player.hidden=true;waiting.hidden=false}
  player.load();
  waiting.querySelector('p').textContent=tr('影像筹备中');
  document.querySelector('#wait-title').textContent=o.name;
  document.querySelector('#film-title').textContent=o.name;
  document.querySelector('#film-theme').textContent=t.name;
  document.querySelector('#film-description').textContent=o.text;
  document.querySelector('#film-state').textContent=tr(url?'已发布':'待发布');
  playlist.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===o.id)));
 };
 objects.forEach((o,i)=>{const b=el('button',null,'playlist-item');b.type='button';b.dataset.id=o.id;b.setAttribute('aria-pressed','false');const text=el('div');text.append(el('strong',o.name),el('small',tr(window.MUSEUM_MEDIA[o.id]?.src?'观看影片':'影像筹备中')));b.append(el('span',String(i+1).padStart(2,'0')),text);b.addEventListener('click',()=>{select(o);history.replaceState(null,'','#'+o.id)});playlist.append(b)});
 player.addEventListener('error',()=>{player.hidden=true;waiting.hidden=false;document.querySelector('#film-state').textContent=tr('暂时无法播放');waiting.querySelector('p').textContent=tr('影片暂时无法加载，请稍后重试');});
 const selectFromHash=()=>select(objects.find(o=>o.id===location.hash.slice(1))||objects[0]);
 window.addEventListener('hashchange',selectFromHash);
 selectFromHash();
}
