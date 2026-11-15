const formatEra=era=>era.replace(/(\d{4})년(?:대|경)?/g,"$1'").replace(/[~～]/g,'-');
const $=s=>document.querySelector(s),state={initial:'',era:'',category:'',query:'',sort:'word',ascending:true,expanded:false};
const initials=[...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const first=w=>{const n=w.charCodeAt(0)-44032;return n>=0&&n<11172?({'ㄲ':'ㄱ','ㄸ':'ㄷ','ㅃ':'ㅂ','ㅆ':'ㅅ','ㅉ':'ㅈ'}[initials[Math.floor(n/588)]]||initials[Math.floor(n/588)]):w[0]};
function buttons(id,values,key){values.forEach(value=>{const b=document.createElement('button');b.textContent=value;b.type='button';b.onclick=()=>{state[key]=state[key]===value?'':value;render()};b.dataset.value=value;b.dataset.key=key;$(id).append(b)})}
buttons('#initials',[...'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ'],'initial');buttons('#eras',Array.from({length:11},(_,i)=>`${1920+i*10}년대`),'era');buttons('#categories',[...new Set(WORDS.map(w=>w.category))],'category');
function matchingEra(w,era){if(!era)return true;const years=[...w.era.matchAll(/\d{4}/g)].map(m=>+m[0]);const start=years[0],end=w.era.includes('현재')?2030:years.at(-1);return +era.slice(0,4)>=start&&+era.slice(0,4)<=end}
let detailRequest=0;
const closingPanels=new WeakMap();
function fadeDetail(panel,opening){
 if(!panel.animate||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return Promise.resolve();
 const animation=panel.animate(opening?[{opacity:0},{opacity:1}]:[{opacity:getComputedStyle(panel).opacity},{opacity:0}],{duration:opening?200:160,easing:'ease-out',fill:'forwards'});
 return animation.finished.catch(()=>{});
}
function closeDetail(panel){
 if(closingPanels.has(panel))return closingPanels.get(panel);
 const row=panel.previousElementSibling;
 row?.setAttribute('aria-expanded','false');
 const done=fadeDetail(panel,false).then(()=>panel.remove());
 closingPanels.set(panel,done);return done;
}
function compareWords(a,b){
 const group=w=>/^[가-힣ㄱ-ㅎ]/.test(w)?0:/^\d/.test(w)?2:1;
 return group(a)-group(b)||a.localeCompare(b,'ko');
}
function render(){detailRequest++;
const q=state.query.toLocaleLowerCase();const result=WORDS.filter(w=>(!state.initial||first(w.word)===state.initial)&&matchingEra(w,state.era)&&(!state.category||w.category===state.category)&&(!q||[w.word,w.meaning,w.era,w.category].some(v=>v.toLocaleLowerCase().includes(q)))).sort((a,b)=>(state.sort==='id'?a.id-b.id:state.sort==='word'?compareWords(a.word,b.word):String(a[state.sort]).localeCompare(String(b[state.sort]),'ko'))*(state.ascending?1:-1));$('#rows').replaceChildren();const frag=document.createDocumentFragment();result.forEach(w=>{const row=document.createElement('button');row.type='button';row.className='row';row.classList.toggle('is-current',w.status==='존속');[w.word,formatEra(w.era),w.category,String(w.id).padStart(3,'0')].forEach((v,i)=>{const cell=document.createElement('span');cell.textContent=v;if(i===0)cell.className='word';row.append(cell)});row.setAttribute('aria-expanded','false');row.onclick=async()=>{const request=++detailRequest;const existing=row.nextElementSibling;const collapse=existing?.classList.contains('inline-detail')&&row.getAttribute('aria-expanded')==='true';await Promise.all([...document.querySelectorAll('.inline-detail')].map(closeDetail));if(request!==detailRequest||!row.isConnected||collapse)return;const panel=document.createElement('div');panel.className='inline-detail';panel.classList.toggle('is-current',w.status==='존속');const rich=window.DETAILS?.[w.word];const meaning=document.createElement('div');meaning.className='inline-meaning';const status=document.createElement('p');status.className='status';status.setAttribute('role','img');status.setAttribute('aria-label',w.status+'단어.');status.title=w.status+'단어.';meaning.append(status);const definition=document.createElement('p');definition.textContent=w.meaning;meaning.append(definition);panel.append(meaning);if(rich){rich.images.forEach((src,i)=>{const figure=document.createElement('figure');figure.className='inline-photo photo-'+i;figure.dataset.marker='*'.repeat(i+1);const img=document.createElement('img');img.src=src;img.alt=rich.captions[i];if(rich.imageFit==='contain'){img.style.objectFit='contain';img.style.objectPosition='left top';const alignMarker=()=>{if(img.naturalWidth&&img.naturalHeight)figure.style.setProperty('--photo-visible-width',Math.min(344,219*img.naturalWidth/img.naturalHeight)+'px')};img.addEventListener('load',alignMarker);if(img.complete)alignMarker()}figure.append(img);panel.append(figure)});const note=document.createElement('p');note.className='inline-note';note.textContent=rich.note;panel.append(note);const captions=document.createElement('div');captions.className='inline-captions';rich.captions.forEach((text,i)=>{const p=document.createElement('p');const marker=document.createElement('span');marker.className='caption-marker';marker.textContent='('+('*'.repeat(i+1))+')';p.append(marker,document.createTextNode(text));captions.append(p)});panel.append(captions)}row.after(panel);row.setAttribute('aria-expanded','true');fadeDetail(panel,true)};frag.append(row)});$('#rows').append(frag);$('#empty').hidden=result.length>0;document.querySelectorAll('aside button[data-key]').forEach(b=>{const on=state[b.dataset.key]===b.dataset.value;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on)})}
document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{if(state.sort===b.dataset.sort)state.ascending=!state.ascending;else{state.sort=b.dataset.sort;state.ascending=true}render()});render();

$('#reset-order').onclick=()=>{Object.assign(state,{initial:'',era:'',category:'',query:'',sort:'word',ascending:true});render()};
