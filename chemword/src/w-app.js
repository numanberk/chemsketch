
/* ================= basics ================= */
const PW=794,PH=1123,GAP=28,PP=PH+GAP,MT=96,CH=PH-192,CW=602,PS=0.64;
let ZOOM=1,NPAGES=1;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ed=$('#doc'),paper=$('#paper'),stage=$('#stage'),scroller=$('#scroller');
function toast(m,ms=2600){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(t._t);t._t=setTimeout(()=>t.hidden=true,ms);}
let DRAW={},OPTS={pn:false};

/* ================= files ================= */
let _dl=null;async function dlCap(){if(_dl)return _dl;try{if(window.claude&&typeof window.claude.use==='function'){const d=await window.claude.use('downloads');if(d)_dl=d;}}catch(e){}return _dl;}
dlCap();
const FRAMED=(()=>{try{return window.self!==window.top;}catch(e){return true;}})();
const MIME={pdf:'application/pdf',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',json:'application/json',png:'image/png',svg:'image/svg+xml'};
function toBlob(name,data){if(data instanceof Blob)return data;const ext=name.split('.').pop().toLowerCase();return new Blob([data],{type:MIME[ext]||'application/octet-stream'});}
function anchorSave(name,blob){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),120000);return url;}
async function saveFile(name,data,imgURL){const blob=toBlob(name,data);const dl=await dlCap();
 if(dl){try{await dl.save({filename:name,data:blob});toast('Saved '+name);return;}
  catch(e){const c=e&&e.code;if(c==='declined'){toast('Save cancelled');return;}if(c==='rate_limited'){toast('A save prompt is already open. Finish it first.');return;}if(c==='too_large'){toast('That file is too large to save here.',5000);return;}}}
 if(!FRAMED){anchorSave(name,blob);toast('Downloaded '+name);return;}
 if(imgURL)return showImg(imgURL,name);
 noSaveSheet(name,blob);}
function noSaveSheet(name,blob){const url=URL.createObjectURL(blob);const d=document.createElement('div');d.className='sheet';
 d.innerHTML=`<div><b>This window blocks file downloads</b><p class="hint" style="white-space:normal;margin:0">The panel ChemWord is open in does not let pages save files. Open ChemWord on claude.ai in your web browser (Chrome, Safari, Edge…) and export from there.</p>
 <div style="display:grid;gap:8px"><a class="b pri" href="https://claude.ai/artifact/G16oCKDPxBEJQvBYQgqCr2" target="_blank" rel="noopener" style="text-decoration:none">Open ChemWord on claude.ai</a><a class="b" href="${url}" download="${esc(name)}" style="text-decoration:none">Try downloading ${esc(name)} anyway</a><button class="b">Close</button></div>
 <p class="hint" style="white-space:normal;margin:0">Your work is kept in the browser it was typed in. If the new tab opens empty, copy your text across, or keep using this window and export later from a browser.</p></div>`;
 d.querySelector('button').onclick=()=>{d.remove();URL.revokeObjectURL(url);};d.onclick=e=>{if(e.target===d)d.remove();};document.body.appendChild(d);}
function showImg(url,name){const d=document.createElement('div');d.className='sheet';d.innerHTML=`<div><b>${esc(name)}</b><img src="${url}" alt="${esc(name)}"><p class="hint" style="white-space:normal">Press and hold (phone) or right-click (computer) the image to save or copy it.</p><button class="b">Close</button></div>`;d.querySelector('button').onclick=()=>d.remove();d.onclick=e=>{if(e.target===d)d.remove();};document.body.appendChild(d);}
const slug=s=>String(s||'document').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'document';
function docName(){for(const el of ed.children){const t=(el.innerText||'').trim();if(t)return slug(t.split('\n')[0]);}return'document';}
function loadScript(src){return new Promise((res,rej)=>{if($(`script[src="${src}"]`))return res();const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('could not load a library'));document.head.appendChild(s);});}

/* ================= persistence ================= */
const LS='chemword.v1';
function sanitizeDoc(html){const t=document.createElement('template');t.innerHTML=String(html||'');
 t.content.querySelectorAll('script,iframe,object,embed,link,meta,style,base,form,input,textarea,button,select').forEach(x=>x.remove());
 t.content.querySelectorAll('svg').forEach(s=>{if(!s.closest('figure.chem'))s.remove();});
 t.content.querySelectorAll('*').forEach(el=>{for(const a of [...el.attributes]){const n=a.name.toLowerCase();if(n.startsWith('on')||((n==='href'||n==='src'||n==='xlink:href')&&/^\s*javascript:/i.test(a.value))||(n==='src'&&!/^data:image\//i.test(a.value)&&el.tagName==='IMG'))el.removeAttribute(a.name);}});
 const d=document.createElement('div');d.appendChild(t.content);return d.innerHTML;}
function serialize(){const c=ed.cloneNode(true);
 c.querySelectorAll('[data-pb]').forEach(el=>{el.style.marginTop='';el.removeAttribute('data-pb');if(!el.getAttribute('style'))el.removeAttribute('style');});
 c.querySelectorAll('figure.chem').forEach(f=>{f.innerHTML='';f.classList.remove('sel');});c.querySelectorAll('.isel').forEach(x=>x.classList.remove('isel'));
 return c.innerHTML;}
let saveT;function save(){clearTimeout(saveT);saveT=setTimeout(saveNow,400);}
function saveNow(){const used=new Set($$('figure.chem',ed).map(f=>f.dataset.id));for(const k in DRAW)if(!used.has(k))delete DRAW[k];
 try{localStorage.setItem(LS,JSON.stringify({v:1,html:serialize(),draws:DRAW,opts:OPTS}));}catch(e){if(e&&(e.name==='QuotaExceededError'||e.code===22)&&!saveNow.warned){saveNow.warned=1;toast('Too large to autosave in this browser. Use File → Save project.',5000);}}}
function loadDoc(o){DRAW={};OPTS={pn:false};let html='<p><br></p>';
 if(o&&o.v===1){html=sanitizeDoc(o.html)||html;for(const k in(o.draws||{}))DRAW[k]=normalize(o.draws[k]);OPTS=Object.assign({pn:false},o.opts||{});}
 ed.innerHTML=html;if(!ed.firstElementChild)ed.innerHTML='<p><br></p>';
 $$('figure.chem',ed).forEach(f=>{f.setAttribute('contenteditable','false');if(!DRAW[f.dataset.id])DRAW[f.dataset.id]=newDrawing();buildFig(f);});
 $('#optPn').checked=!!OPTS.pn;reflow();updateStatus();}

/* ================= chem areas in the document ================= */
function figSVG(d,w,h){const R=renderDrawing(d);if(!R.bbox)return`<svg class="csvg" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg>`;
 const b=R.bbox,pad=6,bw=b.x2-b.x1+2*pad,bh=b.y2-b.y1+2*pad;const s=Math.min(PS,w/bw,h/bh);const vw=w/s,vh=h/s,cx=(b.x1+b.x2)/2,cy=(b.y1+b.y2)/2;
 return`<svg class="csvg" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="${w}" height="${h}" viewBox="${f2(cx-vw/2)} ${f2(cy-vh/2)} ${f2(vw)} ${f2(vh)}"><g font-family="Arial, Helvetica, sans-serif" fill="#000" style="white-space:pre">${R.svg}</g></svg>`;}
function figBox(f){return{w:parseFloat(f.style.width)||300,h:parseFloat(f.style.height)||150,ml:parseFloat(f.style.marginLeft)||0};}
function buildFig(f){const d=DRAW[f.dataset.id]||newDrawing();const{w,h}=figBox(f);f.classList.toggle('empty',isEmpty(d));
 f.innerHTML=figSVG(d,w,h)+'<span class="clab">ChemDraw area · click to draw</span><div class="cui"><button data-c="edit" title="Open in ChemDraw">Edit</button><button data-c="al" title="Align left" aria-label="Align left">⇤</button><button data-c="ac" title="Centre" aria-label="Centre">↔</button><button data-c="ar" title="Align right" aria-label="Align right">⇥</button><button data-c="del" class="dl" title="Delete this area">Delete</button></div><div class="crs" title="Drag to resize"></div>';}
function refreshFigSVG(f){const old=f.querySelector('svg.csvg');const{w,h}=figBox(f);const t=document.createElement('template');t.innerHTML=figSVG(DRAW[f.dataset.id],w,h);if(old)old.replaceWith(t.content.firstChild);}
function paperXY(e){const r=paper.getBoundingClientRect();return{x:(e.clientX-r.left)/ZOOM,y:(e.clientY-r.top)/ZOOM};}
function lineH(){const p=document.createElement('p');p.innerHTML='<br>';ed.appendChild(p);const h=p.offsetHeight+parseFloat(getComputedStyle(p).marginBottom);p.remove();return h||27;}
const flowY=y=>{const p=Math.max(0,Math.floor(y/PP));return p*CH+Math.max(0,Math.min(CH,y-p*PP-MT));};
function insertChemArea(r){const ml=Math.round(Math.max(0,Math.min(CW-60,r.x-96))),w=Math.round(Math.max(60,Math.min(CW-ml,r.w))),h=Math.round(Math.max(40,Math.min(CH-20,r.h)));
 const id='c'+Math.random().toString(36).slice(2,9);DRAW[id]=newDrawing();
 const f=document.createElement('figure');f.className='chem empty';f.setAttribute('contenteditable','false');f.dataset.id=id;f.style.cssText=`width:${w}px;height:${h}px;margin-left:${ml}px`;buildFig(f);
 clearPB();const pt=paper.getBoundingClientRect().top;let placed=false;
 for(const k of ed.children){const kr=k.getBoundingClientRect(),t=(kr.top-pt)/ZOOM,b=(kr.bottom-pt)/ZOOM;if(b>r.y){if(r.y<(t+b)/2)k.before(f);else k.after(f);placed=true;break;}}
 if(!placed){const last=ed.lastElementChild;const lb=last?(last.getBoundingClientRect().bottom-pt)/ZOOM:MT;const n=Math.max(0,Math.min(80,Math.floor((flowY(r.y)-flowY(lb))/lineH())));
  const fr=document.createDocumentFragment();for(let i=0;i<n;i++){const p=document.createElement('p');p.innerHTML='<br>';fr.appendChild(p);}fr.appendChild(f);ed.appendChild(fr);}
 if(!f.nextElementSibling||f.nextElementSibling.tagName==='FIGURE'){const p=document.createElement('p');p.innerHTML='<br>';f.after(p);}
 reflow();save();toast('ChemDraw area added. Click it to draw.');}
/* area-select mode */
const area=$('#area'),arect=$('#arect');let AR=null;
function setAreaMode(on){area.hidden=!on;$('#bChem').setAttribute('aria-pressed',on);if(on)toast('Drag a box on the page where the drawing should go. Esc cancels.',3500);}
$('#bChem').onclick=()=>setAreaMode(area.hidden);
area.addEventListener('pointerdown',e=>{e.preventDefault();area.setPointerCapture(e.pointerId);const p=paperXY(e);AR={s:p,p};arect.hidden=false;drawAR();});
area.addEventListener('pointermove',e=>{if(!AR)return;AR.p=paperXY(e);drawAR();});
function drawAR(){const x=Math.min(AR.s.x,AR.p.x),y=Math.min(AR.s.y,AR.p.y);Object.assign(arect.style,{left:x+'px',top:y+'px',width:Math.abs(AR.p.x-AR.s.x)+'px',height:Math.abs(AR.p.y-AR.s.y)+'px'});}
area.addEventListener('pointerup',e=>{if(!AR)return;const a=AR;AR=null;arect.hidden=true;setAreaMode(false);let x=Math.min(a.s.x,a.p.x),y=Math.min(a.s.y,a.p.y),w=Math.abs(a.p.x-a.s.x),h=Math.abs(a.p.y-a.s.y);
 if(w<20||h<20){w=360;h=170;x=a.s.x;y=a.s.y;}insertChemArea({x,y,w,h});});
area.addEventListener('pointercancel',()=>{AR=null;arect.hidden=true;});
/* clicks on chem areas */
let RS=null;
ed.addEventListener('pointerdown',e=>{const c=e.target.closest('figure.chem .crs');if(!c)return;e.preventDefault();e.stopPropagation();const f=c.closest('figure');c.setPointerCapture(e.pointerId);RS={f,sx:e.clientX,sy:e.clientY,...figBox(f)};});
ed.addEventListener('pointermove',e=>{if(!RS)return;const{f}=RS;const w=Math.round(Math.max(60,Math.min(CW-RS.ml,RS.w+(e.clientX-RS.sx)/ZOOM))),h=Math.round(Math.max(40,Math.min(CH-20,RS.h+(e.clientY-RS.sy)/ZOOM)));f.style.width=w+'px';f.style.height=h+'px';refreshFigSVG(f);});
ed.addEventListener('pointerup',()=>{if(RS){RS=null;reflow();save();}});
ed.addEventListener('click',e=>{const f=e.target.closest('figure.chem');
 $$('img.isel',ed).forEach(i=>i.classList.remove('isel'));
 if(e.target.tagName==='IMG'&&ed.contains(e.target)){e.target.classList.add('isel');IMG=e.target;updateCtxGroups();return;}IMG=null;updateCtxGroups();
 if(!f)return;e.preventDefault();if(e.target.closest('.crs'))return;const b=e.target.closest('.cui button');
 if(b){const c=b.dataset.c,bx=figBox(f);if(c==='edit')openCD(f);else if(c==='del'){if(b.dataset.armed){f.remove();reflow();save();toast('Area deleted');}else{b.dataset.armed='1';b.textContent='Confirm';setTimeout(()=>{if(b.isConnected){b.textContent='Delete';delete b.dataset.armed;}},2500);}}
  else{f.style.marginLeft=(c==='al'?0:c==='ac'?Math.round((CW-bx.w)/2):CW-bx.w)+'px';save();}return;}
 openCD(f);});

/* ================= word processing ================= */
let SAVED=null,IMG=null;
const FONTS=[['Calibri','Calibri, Carlito, sans-serif'],['Arial','Arial, Arimo, Helvetica, sans-serif'],['Times New Roman','"Times New Roman", Tinos, Times, serif'],['Cambria','Cambria, Caladea, Georgia, serif'],['Georgia','Georgia, serif'],['Courier New','"Courier New", Cousine, monospace'],['Verdana','Verdana, sans-serif']];
const SIZES=[8,9,10,10.5,11,12,14,16,18,20,24,28,36,48,72];
$('#sFont').innerHTML=FONTS.map(f=>`<option value="${f[0]}">${f[0]}</option>`).join('');
$('#sSize').innerHTML=SIZES.map(s=>`<option value="${s}">${s}</option>`).join('');$('#sSize').value='11';
function inEd(n){return n&&(n===ed||ed.contains(n.nodeType===1?n:n.parentNode));}
document.addEventListener('selectionchange',()=>{const s=getSelection();if(s.rangeCount&&inEd(s.anchorNode)){SAVED=s.getRangeAt(0).cloneRange();syncUI();}});
function restore(){ed.focus({preventScroll:true});if(SAVED&&ed.contains(SAVED.startContainer)){const s=getSelection();s.removeAllRanges();s.addRange(SAVED);}}
function ensureFocus(){if(document.activeElement!==ed)restore();}
function topBlock(){const s=getSelection();if(!s.rangeCount||!inEd(s.anchorNode))return SAVED&&ed.contains(SAVED.startContainer)?topOf(SAVED.startContainer,SAVED.startOffset):ed.lastElementChild;const r=s.getRangeAt(0);return topOf(r.startContainer,r.startOffset);}
function topOf(n,off){if(n===ed)return ed.children[Math.max(0,off-1)]||ed.firstElementChild;let x=n.nodeType===1?n:n.parentElement;while(x&&x.parentElement!==ed)x=x.parentElement;return x||ed.lastElementChild;}
function caretIn(el,end){if(!el)return;ed.focus({preventScroll:true});const r=document.createRange();r.selectNodeContents(el);r.collapse(!end);const s=getSelection();s.removeAllRanges();s.addRange(r);SAVED=r.cloneRange();}
function insertBlock(html,pick){const blk=topBlock();const t=document.createElement('template');t.innerHTML=html;const nodes=[...t.content.children];const empty=blk&&blk.tagName==='P'&&!blk.textContent.trim()&&!blk.querySelector('img');
 if(!blk)ed.append(...nodes);else{blk.after(...nodes);if(empty)blk.remove();}const last=nodes[nodes.length-1];if(!last.nextElementSibling||last.tagName!=='P'){const p=document.createElement('p');p.innerHTML='<br>';last.after(p);}
 caretIn(pick?pick(nodes):last.tagName==='P'?last:last.nextElementSibling,false);afterEdit();updateCtxGroups();}
function exec(cmd,val){ensureFocus();try{document.execCommand('styleWithCSS',false,['foreColor','hiliteColor','backColor'].includes(cmd));}catch(e){}document.execCommand(cmd,false,val??null);afterEdit();syncUI();}
function fixNesting(){const bad=ed.querySelectorAll('p>ul,p>ol,p>p,p>table,p>h1,p>h2,p>h3,p>div,p>figure,p>hr,p>blockquote');if(!bad.length)return;
 const s=getSelection();const r=s.rangeCount?s.getRangeAt(0):null;const sv=r?[r.startContainer,r.startOffset,r.endContainer,r.endOffset]:null;
 const BL=/^(UL|OL|P|TABLE|H1|H2|H3|DIV|FIGURE|HR|BLOCKQUOTE)$/;let guard=0;
 while(guard++<50){const b=ed.querySelector('p>ul,p>ol,p>p,p>table,p>h1,p>h2,p>h3,p>div,p>figure,p>hr,p>blockquote');if(!b)break;const p=b.parentElement;const out=[];let cur=null;
  for(const n of [...p.childNodes]){if(n.nodeType===1&&BL.test(n.tagName)){cur=null;out.push(n);}else{if(n.nodeType===3&&!n.nodeValue.trim()&&!cur)continue;if(!cur){cur=document.createElement('p');if(p.getAttribute('style'))cur.setAttribute('style',p.getAttribute('style'));out.push(cur);}cur.appendChild(n);}}
  p.replaceWith(...out);}
 if(sv&&ed.contains(sv[0])&&ed.contains(sv[2])){try{const nr=document.createRange();nr.setStart(sv[0],sv[1]);nr.setEnd(sv[2],sv[3]);s.removeAllRanges();s.addRange(nr);}catch(e){}}}
function afterEdit(){fixNesting();ensureRoot();reflowSoon(30);save();updateStatus();}
function ensureRoot(){if(!ed.firstElementChild||ed.innerHTML==='<br>'){ed.innerHTML='<p><br></p>';const r=document.createRange();r.setStart(ed.firstChild,0);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r);}}
function famLabel(css){const first=(css||'').split(',')[0].replace(/["']/g,'').trim().toLowerCase();const map={carlito:'Calibri',arimo:'Arial',tinos:'Times New Roman',caladea:'Cambria',cousine:'Courier New',helvetica:'Arial',times:'Times New Roman'};
 const f=FONTS.find(x=>x[0].toLowerCase()===first);return f?f[0]:(map[first]||'Calibri');}
function syncUI(){for(const b of $$('#rib [data-cmd][aria-pressed]')){let on=false;try{on=document.queryCommandState(b.dataset.cmd);}catch(e){}b.setAttribute('aria-pressed',on);}
 const s=getSelection();if(!s.rangeCount)return;let n=s.focusNode;if(!n)return;if(n.nodeType!==1)n=n.parentElement;if(!n||!ed.contains(n))return;const cs=getComputedStyle(n);
 const fam=famLabel(cs.fontFamily);if(document.activeElement!==$('#sFont'))$('#sFont').value=fam;
 const pt=Math.round(parseFloat(cs.fontSize)*0.75*2)/2;const sz=$('#sSize');if(document.activeElement!==sz){if(!SIZES.includes(pt)&&!sz.querySelector(`option[value="${pt}"]`)){const o=document.createElement('option');o.value=pt;o.textContent=pt;o.dataset.tmp=1;sz.appendChild(o);}sz.value=pt;}
 const blk=n.closest('h1,h2,h3,p,li,td,th,div');const tag=blk&&/^H[123]$/.test(blk.tagName)?blk.tagName.toLowerCase():'p';$('#sStyle').value=tag;
 updateCtxGroups();}
function updateCtxGroups(){const s=getSelection();let n=s.rangeCount?s.anchorNode:null;if(n&&n.nodeType!==1)n=n.parentElement;const inT=!!(n&&ed.contains(n)&&n.closest('td,th'));$('#gTable').hidden=!inT;$('#gImg').hidden=!IMG;}
$('#rib').addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault();});
$('#rib').addEventListener('click',e=>{const b=e.target.closest('[data-cmd]');if(b){exec(b.dataset.cmd);return;}
 const t=e.target.closest('[data-t]');if(t){tableOp(t.dataset.t);return;}
 const im=e.target.closest('[data-i]');if(im&&IMG){if(im.dataset.i==='del'){IMG.remove();IMG=null;}else{IMG.style.width=im.dataset.i+'%';IMG.removeAttribute('width');IMG.style.height='auto';}updateCtxGroups();afterEdit();}});
$('#sStyle').onchange=e=>exec('formatBlock',e.target.value);
function wrapCmd(cmd,val,fixer){ensureFocus();try{document.execCommand('styleWithCSS',false,false);}catch(x){}document.execCommand(cmd,false,val);const made=fixer();
 if(made.length){const r=document.createRange();r.setStartBefore(made[0]);r.setEndAfter(made[made.length-1]);const s=getSelection();s.removeAllRanges();s.addRange(r);SAVED=r.cloneRange();}afterEdit();syncUI();}
$('#sFont').onchange=e=>{const f=FONTS.find(x=>x[0]===e.target.value);wrapCmd('fontName','__F__',()=>{const out=[];$$('font[face="__F__"]',ed).forEach(fn=>{const sp=document.createElement('span');sp.style.fontFamily=f[1];sp.append(...fn.childNodes);fn.replaceWith(sp);out.push(sp);});$$('span',ed).forEach(sp=>{if(sp.style.fontFamily.includes('__F__')){sp.style.fontFamily=f[1];out.push(sp);}});return out;});};
$('#sSize').onchange=e=>{const pt=e.target.value;wrapCmd('fontSize','7',()=>{const out=[];$$('font[size="7"]',ed).forEach(fn=>{const sp=document.createElement('span');sp.style.fontSize=pt+'pt';sp.append(...fn.childNodes);fn.replaceWith(sp);out.push(sp);});$$('span',ed).forEach(sp=>{if(sp.style.fontSize==='xxx-large'||sp.style.fontSize==='-webkit-xxx-large'){sp.style.fontSize=pt+'pt';out.push(sp);}});return out;});};
/* colours */
let CF='#c00000',CHL='#ffff00';
$('#bColor').onclick=()=>exec('foreColor',CF);$('#bHi').onclick=()=>exec('hiliteColor',CHL);
$('#bColorDd').onclick=()=>$('#cF').click();$('#bHiDd').onclick=()=>$('#cH').click();
$('#cF').addEventListener('change',e=>{CF=e.target.value;$('#cbarF').style.background=CF;exec('foreColor',CF);});
$('#cH').addEventListener('change',e=>{CHL=e.target.value;$('#cbarH').style.background=CHL;exec('hiliteColor',CHL);});
/* menus */
function openMenu(btn,m){const open=m.hidden;closeMenus();if(!open)return;m.hidden=false;const r=btn.getBoundingClientRect();const mr=m.getBoundingClientRect();m.style.left=Math.max(6,Math.min(window.innerWidth-mr.width-6,r.left))+'px';m.style.top=(r.bottom+4)+'px';}
function closeMenus(){$$('.menu').forEach(m=>m.hidden=true);}
document.addEventListener('mousedown',e=>{if(!e.target.closest('.menu,#bFile,#bLine,#bTable,#bSym'))closeMenus();if(!e.target.closest('#pop,[data-t="tmpl"]'))$('#pop').hidden=true;});
document.addEventListener('touchstart',e=>{if(!e.target.closest('.menu,#bFile,#bLine,#bTable,#bSym'))closeMenus();},{passive:true});
$('#bFile').onclick=()=>openMenu($('#bFile'),$('#mFile'));$('#bLine').onclick=()=>openMenu($('#bLine'),$('#mLine'));$('#bTable').onclick=()=>openMenu($('#bTable'),$('#mTable'));$('#bSym').onclick=()=>openMenu($('#bSym'),$('#mSym'));
$$('.menu').forEach(m=>m.addEventListener('mousedown',e=>{if(e.target.tagName!=='INPUT')e.preventDefault();}));
function selBlocks(){ensureFocus();const s=getSelection();if(!s.rangeCount)return[];const r=s.getRangeAt(0);const out=[];
 const top=n=>{let x=n.nodeType===1?n:n.parentElement;const li=x&&x.closest('li');if(li&&ed.contains(li))return li;while(x&&x.parentElement!==ed)x=x.parentElement;return x;};
 const a=top(r.startContainer),b=top(r.endContainer);if(!a)return[];if(a===b)return[a];let on=false;for(const el of $$('li,:scope>*',ed)){if(el===a)on=true;if(on&&!out.includes(el))out.push(el);if(el===b)break;}return out.length?out:[a];}
$('#mLine').addEventListener('click',e=>{const b=e.target.closest('[data-lh]');if(!b)return;closeMenus();for(const el of selBlocks()){if(el.tagName==='FIGURE')continue;el.style.lineHeight=b.dataset.lh;}afterEdit();});
/* table insert */
const tg=$('#tgrid');tg.innerHTML=Array.from({length:64},(_,i)=>`<span data-r="${Math.floor(i/8)+1}" data-c="${i%8+1}"></span>`).join('');
tg.addEventListener('mouseover',e=>{const c=e.target.closest('span');if(!c)return;const R=+c.dataset.r,C=+c.dataset.c;$$('span',tg).forEach(s=>s.classList.toggle('on',+s.dataset.r<=R&&+s.dataset.c<=C));$('#tglab').textContent=`${C} × ${R} table`;});
tg.addEventListener('click',e=>{const c=e.target.closest('span');if(!c)return;closeMenus();const R=+c.dataset.r,C=+c.dataset.c;
 const row='<tr>'+'<td><br></td>'.repeat(C)+'</tr>';insertBlock(`<table><tbody>${row.repeat(R)}</tbody></table>`,ns=>ns[0].querySelector('td'));});
function curCell(){const s=getSelection();let n=s.rangeCount?s.anchorNode:null;if(n&&n.nodeType!==1)n=n.parentElement;return n&&ed.contains(n)?n.closest('td,th'):null;}
function tableOp(op){ensureFocus();const td=curCell();if(!td)return;const tr=td.parentElement,tbl=td.closest('table');const ci=[...tr.children].indexOf(td);
 const blankRow=()=>{const r=document.createElement('tr');for(let i=0;i<tr.children.length;i++){const c=document.createElement('td');c.innerHTML='<br>';r.appendChild(c);}return r;};
 if(op==='rowA')tr.before(blankRow());else if(op==='rowB')tr.after(blankRow());
 else if(op==='colL'||op==='colR')for(const r of tbl.rows){const c=document.createElement('td');c.innerHTML='<br>';const ref=r.children[ci];if(!ref)r.appendChild(c);else if(op==='colL')ref.before(c);else ref.after(c);}
 else if(op==='delRow'){if(tbl.rows.length<=1)tbl.remove();else tr.remove();}
 else if(op==='delCol'){if(tr.children.length<=1)tbl.remove();else for(const r of tbl.rows)if(r.children[ci])r.children[ci].remove();}
 else if(op==='delTab')tbl.remove();
 ensureRoot();afterEdit();updateCtxGroups();}
/* symbols */
const SYMS='α β γ δ ε η θ κ λ μ ν π ρ σ τ φ χ ψ ω Δ Σ Ω ° ± × ÷ ≈ ≠ ≤ ≥ → ← ⇌ ↔ ⇒ ↑ ↓ ‡ · • ∙ ⁺ ⁻ ₁ ₂ ₃ ½ ‰ µ Å ℃ ∞ ∂ √ ∑'.split(' ');
$('#symg').innerHTML=SYMS.map(s=>`<button class="ib" data-sym="${s}">${s}</button>`).join('');
$('#symg').addEventListener('click',e=>{const b=e.target.closest('[data-sym]');if(!b)return;exec('insertText',b.dataset.sym);});
/* picture */
$('#bImg').onclick=()=>$('#imgIn').click();
$('#imgIn').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;const rd=new FileReader();rd.onload=()=>{const im=new Image();im.onload=()=>{const max=1400;let w=im.naturalWidth,h=im.naturalHeight;const k=Math.min(1,max/Math.max(w,h));const c=document.createElement('canvas');c.width=Math.round(w*k);c.height=Math.round(h*k);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(im,0,0,c.width,c.height);
  const url=c.toDataURL('image/jpeg',0.88);const dw=Math.min(CW,Math.round(c.width*0.5));exec('insertHTML',`<img src="${url}" style="width:${dw}px;height:auto" alt="">`);};im.onerror=()=>toast('That file is not an image I can read');im.src=rd.result;};rd.readAsDataURL(fl);};
/* page break */
$('#bPb').onclick=()=>insertBlock('<hr class="pb"><p><br></p>');
ed.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();insertBlock('<hr class="pb"><p><br></p>');}
 if((e.ctrlKey||e.metaKey)&&e.key==='='){e.preventDefault();exec(e.shiftKey?'superscript':'subscript');}
 if((e.ctrlKey||e.metaKey)&&e.key==='+'){e.preventDefault();exec('superscript');}
 if(e.key==='Tab'){const td=curCell();if(td){e.preventDefault();const cells=$$('td,th',td.closest('table'));const n=cells[cells.indexOf(td)+(e.shiftKey?-1:1)];if(n){const r=document.createRange();r.selectNodeContents(n);r.collapse(true);const s=getSelection();s.removeAllRanges();s.addRange(r);}}else{e.preventDefault();exec(e.shiftKey?'outdent':'indent');}}});
ed.addEventListener('input',()=>{fixNesting();ensureRoot();reflowSoon(60);save();updateStatus();});
ed.addEventListener('keyup',syncUI);

/* ================= pagination ================= */
function clearPB(){for(const el of ed.querySelectorAll('[data-pb]')){el.style.marginTop='';el.removeAttribute('data-pb');if(!el.getAttribute('style'))el.removeAttribute('style');}}
function units(){const out=[];let force=false;for(const el of ed.children){
  if(el.tagName==='HR'&&el.classList.contains('pb')){out.push({el});force=true;continue;}
  if(el.tagName==='UL'||el.tagName==='OL'){let first=true;for(const li of el.children){out.push({el:li,force:force&&first});first=false;}force=false;continue;}
  out.push({el,keep:/^H[123]$/.test(el.tagName),force});force=false;}
 return out;}
function reflow(){clearPB();const U=units();
 for(let it=0;it<200;it++){const top0=paper.getBoundingClientRect().top;const pos=U.map(u=>{const r=u.el.getBoundingClientRect();return{t:(r.top-top0)/ZOOM,b:(r.bottom-top0)/ZOOM};});let fixed=false;
  for(let i=0;i<U.length;i++){const{t,b}=pos[i];if(b-t<=0.5&&!U[i].force)continue;const pg=Math.floor(t/PP),cTop=pg*PP+MT,cBot=cTop+CH;let target=null,j=i;
   if(t>cBot-1)target=(pg+1)*PP+MT;
   else if(t<cTop-0.5)target=cTop;
   else if(U[i].force&&t>cTop+1)target=(pg+1)*PP+MT;
   else if(b>cBot+0.5&&t>cTop+1&&b-t<=CH){target=(pg+1)*PP+MT;while(j>0&&U[j-1].keep&&Math.floor(pos[j-1].t/PP)===pg&&pos[j-1].t>cTop+1)j--;}
   if(target==null)continue;const el=U[j].el,cur=parseFloat(getComputedStyle(el).marginTop)||0;el.style.marginTop=(cur+target-pos[j].t)+'px';el.setAttribute('data-pb','1');fixed=true;break;}
  if(!fixed)break;}
 const top0=paper.getBoundingClientRect().top;let lastB=MT;for(const u of U.slice(-3))lastB=Math.max(lastB,(u.el.getBoundingClientRect().bottom-top0)/ZOOM);
 drawPages(Math.max(1,Math.floor((lastB-1)/PP)+1));}
let rfT;function reflowSoon(ms=120){clearTimeout(rfT);rfT=setTimeout(reflow,ms);}
function drawPages(n){NPAGES=n;let h='';for(let i=0;i<n;i++)h+=`<div class="pg" style="top:${i*PP}px">${OPTS.pn?`<div class="pnum">${i+1}</div>`:''}</div>`;$('#pbg').innerHTML=h;
 const H=n*PP-GAP;paper.style.height=H+'px';ed.style.minHeight=H+'px';layoutStage();updateStatus();}
function layoutStage(){const w=PW*ZOOM,h=(NPAGES*PP-GAP)*ZOOM;const sw=Math.max(scroller.clientWidth,w+32);stage.style.width=sw+'px';stage.style.height=(h+48)+'px';paper.style.left=((sw-w)/2)+'px';paper.style.transform=`scale(${ZOOM})`;$('#zFit').textContent=Math.round(ZOOM*100)+'%';}
const ZS=[.4,.5,.6,.75,.9,1,1.1,1.25,1.5,1.75,2,2.5,3];
function setZoom(z,cx,cy){z=Math.max(.3,Math.min(3,z));const r0=paper.getBoundingClientRect(),sr=scroller.getBoundingClientRect();if(cx==null){cx=sr.left+sr.width/2;cy=sr.top+sr.height/3;}
 const px=(cx-r0.left)/ZOOM,py=(cy-r0.top)/ZOOM;ZOOM=z;layoutStage();const r1=paper.getBoundingClientRect();scroller.scrollLeft+=r1.left+px*z-cx;scroller.scrollTop+=r1.top+py*z-cy;}
const fitZoom=()=>Math.min(1,(scroller.clientWidth-24)/PW);
$('#zIn').onclick=()=>setZoom(ZS.find(z=>z>ZOOM+.01)||3);$('#zOut').onclick=()=>setZoom([...ZS].reverse().find(z=>z<ZOOM-.01)||.3);$('#zFit').onclick=()=>setZoom(fitZoom());
scroller.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();setZoom(ZOOM*Math.exp(-e.deltaY*0.01),e.clientX,e.clientY);}},{passive:false});
window.addEventListener('resize',layoutStage);
scroller.addEventListener('scroll',()=>updateStatus(true),{passive:true});
let wcT;function updateStatus(pageOnly){const pg=Math.min(NPAGES,Math.max(1,Math.floor((scroller.scrollTop/ZOOM-24+scroller.clientHeight/ZOOM/3)/PP)+1));$('#stPage').textContent=`Page ${pg} of ${NPAGES}`;
 if(pageOnly)return;clearTimeout(wcT);wcT=setTimeout(()=>{const t=(ed.innerText||'').trim();const n=t?t.split(/\s+/).length:0;$('#stWords').textContent=n+(n===1?' word':' words');},300);}
/* file menu */
$('#mFile').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;const f=b.dataset.f;
 if(f==='new'){if(!b.dataset.armed){b.dataset.armed=1;b.textContent='Click again to clear the document';setTimeout(()=>{b.textContent='New blank document';delete b.dataset.armed;},3500);return;}closeMenus();loadDoc(null);saveNow();toast('New blank document');return;}
 closeMenus();
 if(f==='open')$('#fileIn').click();
 else if(f==='save')saveFile(docName()+'.chemword.json',JSON.stringify(projectObj()));
 else if(f==='pdf')exportPDF();
 else if(f==='docx')exportDOCX();});
$('#optPn').addEventListener('change',e=>{OPTS.pn=e.target.checked;drawPages(NPAGES);save();});
const b64e=s=>{const u=new TextEncoder().encode(s);let o='';for(let i=0;i<u.length;i+=8192)o+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(o);};
const b64d=b=>{const bin=atob(b);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new TextDecoder().decode(u);};
function projectObj(){return{v:1,html:serialize(),draws:DRAW,opts:OPTS};}
async function sha(buf){const u=buf instanceof Uint8Array?buf:new Uint8Array(buf);let h1=0x811c9dc5,h2=0x01000193^u.length;for(let i=0;i<u.length;i++){h1=Math.imul(h1^u[i],16777619);h2=Math.imul(h2^u[i],2246822519)^(h2>>>13);}return(h1>>>0).toString(16).padStart(8,'0')+(h2>>>0).toString(16).padStart(8,'0')+u.length.toString(16);}
function openProject(o,msg){if(!o||o.v!==1||typeof o.html!=='string')throw new Error('not a ChemWord project');loadDoc(o);saveNow();toast(msg||'Opened',4000);}
async function importWord(buf){await loadScript('https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js');const r=await window.mammoth.convertToHtml({arrayBuffer:buf});
 openProject({v:1,html:sanitizeDoc(r.value)||'<p><br></p>',draws:{},opts:{pn:false}},'Opened the Word file. Drawings in it are now pictures; add a ChemDraw area to draw new ones.');}
function choose(title,text,opts){const d=document.createElement('div');d.className='sheet';d.innerHTML=`<div><b>${esc(title)}</b><p class="hint" style="white-space:normal;margin:0">${esc(text)}</p><div style="display:grid;gap:8px">${opts.map((o,i)=>`<button class="b${i?'':' pri'}" data-i="${i}" style="height:auto;padding:10px 12px;text-align:left;justify-content:flex-start;white-space:normal"><span><b>${esc(o[0])}</b><br><span style="font-weight:400">${esc(o[1])}</span></span></button>`).join('')}<button class="b" data-i="x">Cancel</button></div></div>`;
 d.addEventListener('click',e=>{const b=e.target.closest('[data-i]');if(!b&&e.target!==d)return;d.remove();if(b&&b.dataset.i!=='x')opts[+b.dataset.i][2]();});document.body.appendChild(d);}
async function openAny(fl){const buf=await fl.arrayBuffer();const sig=String.fromCharCode(...new Uint8Array(buf.slice(0,5)));
 if(sig.startsWith('PK')){await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');const zip=await window.JSZip.loadAsync(buf);const pj=zip.file('chemword/project.json');
  if(!pj){if(!zip.file('word/document.xml'))throw new Error('not a Word file');return importWord(buf);}
  const o=JSON.parse(await pj.async('string'));const st=zip.file('chemword/docxml.sha256.txt'),dx=zip.file('word/document.xml');let edited=false;
  if(st&&dx)edited=(await sha(await dx.async('arraybuffer')))!==(await st.async('string')).trim();
  if(!edited)return openProject(o,'Opened. Everything is editable, drawings included.');
  return choose('This Word file was changed outside ChemWord','Pick which version to open.',[['Open the ChemWord version','Drawings stay editable. Changes made in Word are not included.',()=>openProject(o,'Opened the ChemWord version.')],['Open the Word version','Keeps the changes made in Word. Drawings become pictures.',()=>importWord(buf).catch(e=>toast('Could not open: '+e.message,5000))]]);}
 if(sig.startsWith('%PDF')){const txt=new TextDecoder('iso-8859-1').decode(buf);const i=txt.lastIndexOf('%CHEMWORD-BEGIN '),j=i<0?-1:txt.indexOf('%CHEMWORD-END',i);
  if(i<0||j<0){toast('This PDF has no ChemWord data (made elsewhere or exported before this update), so it cannot be edited. Open the .docx or project file instead.',7000);return;}
  return openProject(JSON.parse(b64d(txt.slice(i+16,j).trim())),'Opened. Everything is editable, drawings included.');}
 return openProject(JSON.parse(new TextDecoder().decode(buf)),'Project opened');}
$('#fileIn').onchange=e=>{const fl=e.target.files[0];e.target.value='';if(!fl)return;openAny(fl).catch(x=>toast('Could not open that file: '+(x&&x.message||'unknown format'),5000));};

/* ================= PDF export ================= */
let busy=false;
function printClone(){clearPB();reflow();const c=paper.cloneNode(true);c.removeAttribute('id');$$('[id]',c).forEach(x=>x.removeAttribute('id'));c.classList.add('printing');Object.assign(c.style,{transform:'none',position:'absolute',left:'0',top:'0'});
 $$('.area',c).forEach(x=>x.remove());$$('[contenteditable]',c).forEach(x=>x.removeAttribute('contenteditable'));return c;}
async function exportPDF(){if(busy)return;busy=true;toast('Preparing the PDF…',30000);
 try{await Promise.all([loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')]);
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;const clone=printClone();const host=$('#exportHost');const pdf=new window.jspdf.jsPDF({unit:'mm',format:'a4',orientation:'portrait'});
  for(let i=0;i<NPAGES;i++){const w=document.createElement('div');Object.assign(w.style,{position:'relative',width:PW+'px',height:PH+'px',overflow:'hidden',background:'#fff'});clone.style.top=(-i*PP)+'px';w.appendChild(clone);host.appendChild(w);
   const cv=await window.html2canvas(w,{scale:2.2,backgroundColor:'#ffffff',logging:false,scrollX:0,scrollY:0,windowWidth:1400});if(i)pdf.addPage();pdf.addImage(cv.toDataURL('image/jpeg',0.92),'JPEG',0,0,210,297);host.removeChild(w);}
  const ab=new Uint8Array(pdf.output('arraybuffer'));const tail=new TextDecoder('iso-8859-1').decode(ab.slice(-200));const sx=(tail.match(/startxref\s+(\d+)\s+%%EOF\s*$/)||[])[1];
  const extra=new TextEncoder().encode('\n%CHEMWORD-BEGIN '+b64e(JSON.stringify(projectObj()))+'\n%CHEMWORD-END\n'+(sx?'startxref\n'+sx+'\n%%EOF\n':''));const out=new Uint8Array(ab.length+extra.length);out.set(ab);out.set(extra,ab.length);
  await saveFile(docName()+'.pdf',out.buffer);}
 catch(e){toast('PDF export failed: '+e.message,5000);}finally{busy=false;}}

/* ================= Word export ================= */
const XE=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const _cc=document.createElement('canvas').getContext('2d');
function hexOf(c){if(!c||c==='transparent'||/rgba\(.*,\s*0\)$/.test(c))return null;_cc.fillStyle='#000000';_cc.fillStyle=c;const v=_cc.fillStyle;if(v[0]==='#')return v.slice(1).toUpperCase();const m=v.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);if(!m||(m[4]!=null&&+m[4]===0))return null;return[m[1],m[2],m[3]].map(x=>(+x).toString(16).padStart(2,'0')).join('').toUpperCase();}
const BLOCK=/^(P|DIV|H[1-6]|UL|OL|LI|TABLE|BLOCKQUOTE|HR|FIGURE|PRE|TBODY|THEAD|TR)$/;
async function exportDOCX(){if(busy)return;busy=true;toast('Preparing the Word file…',30000);
 try{await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');clearPB();
  const media=[];let nImg=0,nDoc=0;const nums=[];
  async function imgRun(blobP,wpx,hpx){const blob=await blobP;nImg++;const id='rIdImg'+nImg;media.push({name:`image${nImg}.png`,blob,id});nDoc++;const cx=Math.round(wpx*9525),cy=Math.round(hpx*9525);
   return`<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${nDoc}" name="Picture ${nDoc}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="${nDoc}" name="image${nImg}.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${id}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;}
  function pngFromImg(el){return new Promise(res=>{const c=document.createElement('canvas');c.width=el.naturalWidth||el.width;c.height=el.naturalHeight||el.height;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(el,0,0);c.toBlob(b=>res(b),'image/png');});}
  function rpr(st){let s='';if(st.font)s+=`<w:rFonts w:ascii="${XE(st.font)}" w:hAnsi="${XE(st.font)}" w:cs="${XE(st.font)}"/>`;if(st.b)s+='<w:b/>';if(st.i)s+='<w:i/>';if(st.s)s+='<w:strike/>';if(st.color)s+=`<w:color w:val="${st.color}"/>`;if(st.sz)s+=`<w:sz w:val="${st.sz}"/><w:szCs w:val="${st.sz}"/>`;if(st.u)s+='<w:u w:val="single"/>';if(st.hl)s+=`<w:shd w:val="clear" w:color="auto" w:fill="${st.hl}"/>`;if(st.va)s+=`<w:vertAlign w:val="${st.va}"/>`;return s?`<w:rPr>${s}</w:rPr>`:'';}
  function inlineStyle(el,st){st={...st};const t=el.tagName,cs=el.style;
   if(t==='B'||t==='STRONG')st.b=1;if(t==='I'||t==='EM')st.i=1;if(t==='U')st.u=1;if(t==='S'||t==='STRIKE'||t==='DEL')st.s=1;if(t==='SUB')st.va='subscript';if(t==='SUP')st.va='superscript';
   if(t==='FONT'){if(el.getAttribute('face'))st.font=el.getAttribute('face').split(',')[0].replace(/["']/g,'').trim();if(el.getAttribute('color'))st.color=hexOf(el.getAttribute('color'));const z=+el.getAttribute('size');if(z)st.sz=[0,16,20,24,28,36,48,72][z];}
   if(cs){if(/bold|[6-9]00/.test(cs.fontWeight))st.b=1;else if(cs.fontWeight==='normal'||cs.fontWeight==='400')st.b=0;if(cs.fontStyle==='italic')st.i=1;const td=(cs.textDecoration||'')+' '+(cs.textDecorationLine||'');if(/underline/.test(td))st.u=1;if(/line-through/.test(td))st.s=1;
    if(cs.color)st.color=hexOf(cs.color)||st.color;if(cs.backgroundColor){const h=hexOf(cs.backgroundColor);if(h)st.hl=h;}if(cs.fontFamily)st.font=cs.fontFamily.split(',')[0].replace(/["']/g,'').trim();
    if(cs.fontSize){const m=cs.fontSize.match(/([\d.]+)(pt|px)/);if(m)st.sz=Math.round((m[2]==='pt'?+m[1]:+m[1]*0.75)*2);}if(cs.verticalAlign==='sub')st.va='subscript';if(cs.verticalAlign==='super')st.va='superscript';}
   if(st.font){const map={Carlito:'Calibri',Arimo:'Arial',Tinos:'Times New Roman',Caladea:'Cambria',Cousine:'Courier New'};st.font=map[st.font]||st.font;}
   return st;}
  async function runs(nodes,st){let out='';for(const n of nodes){
    if(n.nodeType===3){const t=n.nodeValue.replace(/[\r\n\t]+/g,' ');if(t)out+=`<w:r>${rpr(st)}<w:t xml:space="preserve">${XE(t)}</w:t></w:r>`;continue;}
    if(n.nodeType!==1)continue;const t=n.tagName;
    if(t==='BR'){if(n.nextSibling||n.parentElement.lastChild!==n)out+='<w:r><w:br/></w:r>';continue;}
    if(t==='IMG'){if(n.complete&&n.naturalWidth)out+=await imgRun(pngFromImg(n),n.offsetWidth||n.naturalWidth,n.offsetHeight||n.naturalHeight);continue;}
    if(t==='FIGURE'||t==='SVG'||n.classList.contains('cui'))continue;
    out+=await runs(n.childNodes,inlineStyle(n,st));}
   return out;}
  function ppr(o){let s='';if(o.style)s+=`<w:pStyle w:val="${o.style}"/>`;if(o.num)s+=`<w:numPr><w:ilvl w:val="${o.num.lvl}"/><w:numId w:val="${o.num.id}"/></w:numPr>`;if(o.bdr)s+='<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr>';
   if(o.line||o.after!=null)s+=`<w:spacing${o.after!=null?` w:after="${o.after}"`:''}${o.line?` w:line="${Math.round(240*o.line)}" w:lineRule="auto"`:''}/>`;if(o.ind)s+=`<w:ind w:left="${o.ind}"/>`;if(o.jc)s+=`<w:jc w:val="${o.jc}"/>`;return s?`<w:pPr>${s}</w:pPr>`:'';}
  function paraOpts(el,base){const o={...base};const cs=el.style;const ta=cs.textAlign||el.getAttribute('align');if(ta)o.jc={left:'left',center:'center',right:'right',justify:'both',start:'left',end:'right'}[ta]||o.jc;
   if(cs.lineHeight&&!/px|pt/.test(cs.lineHeight)&&+cs.lineHeight)o.line=+cs.lineHeight;const ml=parseFloat(cs.marginLeft)||0,pl=parseFloat(cs.paddingLeft)||0;if(el.tagName!=='FIGURE'&&(ml||pl))o.ind=(o.ind||0)+Math.round((ml+pl)*15);
   if(/^H[1-3]$/.test(el.tagName))o.style='Heading'+el.tagName[1];return o;}
  const P=(o,r)=>`<w:p>${ppr(o)}${r}</w:p>`;
  async function flow(nodes,base,st){let out='',pend=[];const flush=async()=>{if(pend.length){const r=await runs(pend,st);if(r||pend.some(n=>n.nodeType===1&&n.tagName==='BR'))out+=P(base,r);pend=[];}};
   for(const n of nodes){if(n.nodeType===1&&BLOCK.test(n.tagName)){await flush();out+=await block(n,base,st);}else if(n.nodeType===3&&!n.nodeValue.trim()&&!pend.length)continue;else pend.push(n);}
   await flush();return out;}
  async function block(el,base,st){const t=el.tagName;
   if(t==='HR')return el.classList.contains('pb')?'<w:p><w:r><w:br w:type="page"/></w:r></w:p>':P({...base,bdr:1},'');
   if(t==='FIGURE'&&el.classList.contains('chem')){const{w,h,ml}=figBox(el);const svg=figSVG(DRAW[el.dataset.id]||newDrawing(),w,h);const blob=svgToPNG(svg,w*3.125,h*3.125).then(o=>o.blob);return P({...base,ind:(base.ind||0)+Math.round(ml*15)},await imgRun(blob,w,h));}
   if(t==='UL'||t==='OL'){const lvl=base.num?base.num.lvl+1:0;let id;if(t==='UL')id=1;else{id=3+nums.length;nums.push(id);}
    if(base.num&&t==='OL'&&base.num.id!==1){id=base.num.id;}
    let out='';for(const li of el.children){if(li.tagName!=='LI'){out+=await block(li,base,st);continue;}const o={...paraOpts(li,{...base,ind:undefined}),num:{lvl:Math.min(8,lvl),id}};delete o.ind;
     const inl=[],sub=[];for(const n of li.childNodes){if(n.nodeType===1&&(n.tagName==='UL'||n.tagName==='OL'))sub.push(n);else inl.push(n);}
     const hasBlock=inl.some(n=>n.nodeType===1&&BLOCK.test(n.tagName));out+=hasBlock?await flow(inl,o,st):P(o,await runs(inl,st));for(const s of sub)out+=await block(s,{...base,num:{lvl,id}},st);}
    return out;}
   if(t==='TABLE'){const rows=[...el.rows];const cols=Math.max(1,...rows.map(r=>[...r.cells].reduce((a,c)=>a+(c.colSpan||1),0)));const gw=Math.floor(9026/cols);
    let x=`<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(s=>`<w:${s} w:val="single" w:sz="4" w:space="0" w:color="000000"/>`).join('')}</w:tblBorders><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid>${'<w:gridCol w:w="'+gw+'"/>'.repeat(cols)}</w:tblGrid>`;
    for(const r of rows){x+='<w:tr>';for(const c of r.cells){const sp=c.colSpan||1;let inner=await flow([...c.childNodes],{after:0},inlineStyle(c,st));if(!inner)inner='<w:p/>';x+=`<w:tc><w:tcPr><w:tcW w:w="${gw*sp}" w:type="dxa"/>${sp>1?`<w:gridSpan w:val="${sp}"/>`:''}</w:tcPr>${inner}</w:tc>`;}x+='</w:tr>';}
    return x+'</w:tbl>';}
   if(t==='TBODY'||t==='THEAD'||t==='TR')return flow([...el.childNodes],base,st);
   if(t==='BLOCKQUOTE'){const o={...base,ind:(base.ind||0)+Math.round(((parseFloat(el.style.marginLeft)||40))*15)};return flow([...el.childNodes],o,st);}
   const o=paraOpts(el,{...base,style:undefined,num:base.num});const st2=inlineStyle(el,st);
   const kids=[...el.childNodes];if(kids.some(n=>n.nodeType===1&&BLOCK.test(n.tagName)))return flow(kids,o,st2);
   return P(o,await runs(kids,st2));}
  const body=await flow([...ed.childNodes],{},{});
  const NS='xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';
  const H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  const doc=`${H}<w:document ${NS}><w:body>${body}<w:p/><w:sectPr>${OPTS.pn?'<w:footerReference w:type="default" r:id="rIdFtr"/>':''}<w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>`;
  const hd=(id,sz,col,bef)=>`<w:style w:type="paragraph" w:styleId="${id}"><w:name w:val="heading ${id.slice(-1)}"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:uiPriority w:val="9"/><w:qFormat/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="${bef}" w:after="80"/><w:outlineLvl w:val="${+id.slice(-1)-1}"/></w:pPr><w:rPr><w:color w:val="${col}"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/></w:rPr></w:style>`;
  const styles=`${H}<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-US"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>${hd('Heading1',32,'2F5496',240)}${hd('Heading2',26,'2F5496',200)}${hd('Heading3',24,'1F3763',160)}
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:basedOn w:val="TableNormal"/><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:left w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:right w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="auto"/><w:insideV w:val="single" w:sz="4" w:space="0" w:color="auto"/></w:tblBorders></w:tblPr></w:style></w:styles>`;
  const lvls=(fmt)=>Array.from({length:9},(_,l)=>{const bullet=['•','o','▪'][l%3];return`<w:lvl w:ilvl="${l}"><w:start w:val="1"/><w:numFmt w:val="${fmt==='bullet'?'bullet':['decimal','lowerLetter','lowerRoman'][l%3]}"/><w:lvlText w:val="${fmt==='bullet'?bullet:'%'+(l+1)+'.'}"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="${720*(l+1)}" w:hanging="360"/></w:pPr>${fmt==='bullet'&&l%3!==1?'<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/></w:rPr>':''}</w:lvl>`;}).join('');
  const numbering=`${H}<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="hybridMultilevel"/>${lvls('bullet')}</w:abstractNum><w:abstractNum w:abstractNumId="1"><w:multiLevelType w:val="hybridMultilevel"/>${lvls('decimal')}</w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>${nums.map(id=>`<w:num w:numId="${id}"><w:abstractNumId w:val="1"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>`).join('')}</w:numbering>`;
  const footer=`${H}<w:ftr ${NS}><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:t>1</w:t></w:r><w:r><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>`;
  const RT='http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const drels=`${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="${RT}/styles" Target="styles.xml"/><Relationship Id="rIdNum" Type="${RT}/numbering" Target="numbering.xml"/>${OPTS.pn?`<Relationship Id="rIdFtr" Type="${RT}/footer" Target="footer1.xml"/>`:''}${media.map(m=>`<Relationship Id="${m.id}" Type="${RT}/image" Target="media/${m.name}"/>`).join('')}</Relationships>`;
  const ct=`${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Default Extension="json" ContentType="application/json"/><Default Extension="txt" ContentType="text/plain"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>${OPTS.pn?'<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>':''}</Types>`;
  const zip=new window.JSZip();zip.file('[Content_Types].xml',ct);zip.file('_rels/.rels',`${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${RT}/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file('word/document.xml',doc);zip.file('chemword/project.json',JSON.stringify(projectObj()));zip.file('chemword/docxml.sha256.txt',await sha(new TextEncoder().encode(doc)));zip.file('word/styles.xml',styles);zip.file('word/numbering.xml',numbering);zip.file('word/_rels/document.xml.rels',drels);if(OPTS.pn)zip.file('word/footer1.xml',footer);
  for(const m of media)zip.file('word/media/'+m.name,m.blob);
  const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});window._lastDocx=blob;
  reflow();await saveFile(docName()+'.docx',blob);}
 catch(e){reflow();toast('Word export failed: '+e.message,5000);}finally{busy=false;}}
