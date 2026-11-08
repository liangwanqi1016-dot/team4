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
const storyLabels={"":{"tour":"▶ 连看五部影片","random":"✦ 随机开启一段故事","prev":"← 上一部","next":"下一部 →","on":"连续播放：开启","off":"连续播放：关闭","start":"播放这一部","done":"五段故事，已全部看完","hint":"开启后，当前影片结束将自动播放下一部。","themes":["走进泥土与火","发现瓷盘的艺术","回到旧日课堂","寻找石中的形态","读懂石函的记忆"]},"en-":{"tour":"▶ Watch all five","random":"✦ Surprise me with a story","prev":"← Previous","next":"Next →","on":"Continuous play: on","off":"Continuous play: off","start":"Play this film","done":"All five stories completed","hint":"When enabled, the next film plays after the current film ends.","themes":["Explore clay and fire","Discover porcelain art","Step into the classroom","Find a form in stone","Read a memory in stone"]},"ko-":{"tour":"▶ 다섯 영상 이어보기","random":"✦ 무작위 이야기 만나기","prev":"← 이전 영상","next":"다음 영상 →","on":"이어보기: 켜짐","off":"이어보기: 꺼짐","start":"이 영상 재생","done":"다섯 이야기를 모두 감상했습니다","hint":"켜두면 현재 영상이 끝난 후 다음 영상이 재생됩니다.","themes":["흙과 불의 세계로","접시의 예술 만나기","옛 교실로 돌아가기","돌 속의 형태 찾기","석함 속 기억 읽기"]},"ja-":{"tour":"▶ 五つの映像を続けて見る","random":"✦ 偶然の物語に出会う","prev":"← 前の映像","next":"次の映像 →","on":"連続再生：オン","off":"連続再生：オフ","start":"この映像を再生","done":"五つの物語を見終えました","hint":"オンにすると、映像の終了後に次の映像を再生します。","themes":["土と火の世界へ","皿の芸術を発見","昔の教室へ","石の中の形を探す","石函の記憶を読む"]}};
const storyPrefix=({'en':'en-','ko':'ko-','ja':'ja-'})[document.documentElement.lang]||'';
const storyText=storyLabels[storyPrefix];
document.querySelectorAll('.story-surprise').forEach(link=>link.addEventListener('click',()=>{link.href=storyPrefix+'films.html#'+objects[Math.floor(Math.random()*objects.length)].id}));
const playlist=document.querySelector('#playlist');
if(playlist){
 const player=document.querySelector('#museum-video'),waiting=document.querySelector('#video-wait');
 let currentIndex=0,continuous=new URLSearchParams(location.search).get('mode')==='tour';
 const controls=el('div',null,'story-controls');
 const counter=el('span',null,'story-counter');
 const previous=el('button',storyText.prev,'story-step');previous.type='button';
 const next=el('button',storyText.next,'story-step');next.type='button';
 const tour=el('button',null,'story-toggle');tour.type='button';
 const play=el('button',storyText.start,'story-play');play.type='button';
 const status=el('p',storyText.hint,'story-hint');status.setAttribute('aria-live','polite');
 controls.append(previous,counter,next,tour,play);player.closest('.video-frame').after(controls,status);
 const updateControls=()=>{previous.disabled=currentIndex===0;next.disabled=currentIndex===objects.length-1;counter.textContent=String(currentIndex+1).padStart(2,'0')+' / '+String(objects.length).padStart(2,'0');tour.textContent=continuous?storyText.on:storyText.off;tour.setAttribute('aria-pressed',String(continuous))};
 const playSelected=()=>{player.play().catch(()=>{status.textContent=storyText.start;play.focus()})};
 const move=(index)=>{select(objects[index]);history.replaceState(null,'','#'+objects[index].id);playSelected()};
 previous.addEventListener('click',()=>{if(currentIndex>0)move(currentIndex-1)});
 next.addEventListener('click',()=>{if(currentIndex<objects.length-1)move(currentIndex+1)});
 tour.addEventListener('click',()=>{continuous=!continuous;const tourUrl=new URL(location.href);if(continuous)tourUrl.searchParams.set('mode','tour');else tourUrl.searchParams.delete('mode');history.replaceState(null,'',tourUrl);updateControls();status.textContent=storyText.hint;if(continuous)playSelected()});
 play.addEventListener('click',playSelected);
 player.addEventListener('ended',()=>{if(continuous&&currentIndex<objects.length-1)move(currentIndex+1);else if(continuous){continuous=false;updateControls();status.textContent=storyText.done}});
 const select=(o)=>{
  currentIndex=objects.findIndex(item=>item.id===o.id);updateControls();status.textContent=storyText.hint;
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
 if(continuous)playSelected();
}


