
/* ================= ChemDraw window ================= */
const IC={
 select:'<path d="M5 3l10 6-4.5 1.2L13 15l-2 1-2.4-4.6L5 14Z" fill="currentColor"/>',
 pan:'<path d="M7 9V4.5a1.2 1.2 0 0 1 2.4 0V9m0-1V3.5a1.2 1.2 0 0 1 2.4 0V9m0-.5V5a1.2 1.2 0 0 1 2.4 0v6c0 3-2 5.5-5 5.5S5 15 4 12.5L2.8 9.6a1.1 1.1 0 0 1 2-.9L7 11" fill="none" stroke="currentColor" stroke-width="1.2"/>',
 erase:'<path d="M3 13.5 10.5 6l5 5L9 17.5H5.5ZM8 8.5l5 5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
 b1:'<path d="M3 15 17 5" stroke="currentColor" stroke-width="1.6"/>',
 b2:'<path d="M3 13.5 15.5 4.5M4.5 15.5 17 6.5" stroke="currentColor" stroke-width="1.5"/>',
 b3:'<path d="M2.5 12.6 14.6 3.8M3.8 14.6 15.9 5.8M5.1 16.4 17.2 7.6" stroke="currentColor" stroke-width="1.3"/>',
 chain:'<path d="M2 13 6 7l4 6 4-6 4 6" stroke="currentColor" stroke-width="1.5" fill="none"/>',
 bw:'<path d="M3 16 16.2 4.2 17.8 6.2Z" fill="currentColor"/>',
 bh:'<path d="M4.2 15.4l.6.8M6.8 13.3l1 1.3M9.3 11.2l1.5 1.8M11.8 9.1l1.9 2.3M14.3 7l2.3 2.8" stroke="currentColor" stroke-width="1.4"/>',
 bv:'<path d="M3 15c1-3 3 0 4-3s3 0 4-3 3 0 4-3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
 bb:'<path d="M3 15 17 5" stroke="currentColor" stroke-width="4"/>',
 bd:'<path d="M3 15 17 5" stroke="currentColor" stroke-width="1.6" stroke-dasharray="2.5 2"/>',
 lbl:'<text x="10" y="15" font-size="14" text-anchor="middle" font-family="Arial" font-weight="700" fill="currentColor">A</text>',
 qp:'<circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M10 6.8v6.4M6.8 10h6.4" stroke="currentColor" stroke-width="1.4"/>',
 qm:'<circle cx="10" cy="10" r="6.5" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M6.8 10h6.4" stroke="currentColor" stroke-width="1.4"/>',
 lp:'<text x="8" y="16" font-size="12" font-family="Arial" font-weight="700" fill="currentColor" text-anchor="middle" dx="2">O</text><circle cx="7.6" cy="4" r="1.4" fill="currentColor"/><circle cx="12.2" cy="4" r="1.4" fill="currentColor"/>',
 rd:'<text x="10" y="16" font-size="12" font-family="Arial" font-weight="700" fill="currentColor" text-anchor="middle">C</text><circle cx="10" cy="4" r="1.6" fill="currentColor"/>',
 ar:'<path d="M2 10h13" stroke="currentColor" stroke-width="1.5"/><path d="M18 10l-5 2.6.9-2.6-.9-2.6Z" fill="currentColor"/>',
 ae:'<path d="M2 8h12M18 12H6" stroke="currentColor" stroke-width="1.4"/><path d="M18 8l-5-2.6.9 2.6ZM2 12l5 2.6-.9-2.6Z" fill="currentColor"/>',
 as:'<path d="M5 10h10" stroke="currentColor" stroke-width="1.5"/><path d="M18.5 10l-4.5 2.4V7.6ZM1.5 10l4.5 2.4V7.6Z" fill="currentColor"/>',
 at:'<path d="M2 8h12M2 12h12M12 5l5 5-5 5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
 ac:'<path d="M3 15C3 6 13 4 15 11" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M15.9 15.2 12.6 10.4 15 11.3 16.7 9.4Z" fill="currentColor"/>',
 af:'<path d="M3 15C3 6 13 4 15 11" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M15.9 15.2 17.2 9.6 15 11.3Z" fill="currentColor"/>',
 brk:'<path d="M6 3H3v14h3M14 3h3v14h-3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
 par:'<path d="M6 3Q1 10 6 17M14 3q5 7 0 14" stroke="currentColor" stroke-width="1.5" fill="none"/>',
 text:'<path d="M4 4h12M10 4v13" stroke="currentColor" stroke-width="1.8"/>',
 tmpl:'<path d="M10 2.8 16.2 6.4v7.2L10 17.2 3.8 13.6V6.4Z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M7.2 8.5v3M12.8 8.5v3" stroke="currentColor" stroke-width="1.2"/>'};
function ringIcon(n,arom){const pts=[];for(let k=0;k<n;k++){const a=-Math.PI/2+k*2*Math.PI/n+(n%2===0&&n!==6?Math.PI/n:0);pts.push((10+7*Math.cos(a)).toFixed(1)+','+(10+7*Math.sin(a)).toFixed(1));}return`<polygon points="${pts.join(' ')}" fill="none" stroke="currentColor" stroke-width="1.4"/>${arom?'<circle cx="10" cy="10" r="3.6" fill="none" stroke="currentColor" stroke-width="1.1"/>':''}`;}
['r3','r4','r5','r6','r7','r8'].forEach(k=>IC[k]=ringIcon(+k[1]));IC.rb=ringIcon(6,1);
const BTOOL={b1:[1,'plain'],b2:[2,'plain'],b3:[3,'plain'],bw:[1,'wedge'],bh:[1,'hash'],bv:[1,'wavy'],bb:[1,'bold'],bd:[1,'dash']};
const AKIND={ar:'rxn',ae:'eq',as:'res',at:'retro',ac:'curve2',af:'curve1',brk:'brk',par:'par'};
const TOOLS=[['select','Select and move (S)'],['pan','Pan (hold Space)'],['erase','Eraser (E)'],['lbl','Atom label (A)'],0,['el:C','Carbon (C)'],['el:H','Hydrogen (H)'],['el:N','Nitrogen (N)'],['el:O','Oxygen (O)'],['el:S','Sulfur (S)'],['el:P','Phosphorus (P)'],['el:F','Fluorine (F)'],['el:Cl','Chlorine (Cl)'],['el:Br','Bromine (Br)'],['el:I','Iodine (I)'],['el:B','Boron (B)'],['el:Si','Silicon (Si)'],0,['b1','Single bond (1)'],['b2','Double bond (2)'],['b3','Triple bond (3)'],['chain','Chain (Z)'],['bw','Wedge bond (W)'],['bh','Hashed wedge bond (H)'],['bv','Wavy bond'],['bb','Bold bond'],['bd','Dashed / partial bond'],['text','Text (T)'],0,
 ['r3','Cyclopropane'],['r4','Cyclobutane'],['r5','Cyclopentane'],['r6','Cyclohexane'],['rb','Benzene (B)'],['r7','Cycloheptane'],['r8','Cyclooctane'],['tmpl','Templates'],0,
 ['qp','Positive charge (+)'],['qm','Negative charge (−)'],['lp','Lone pair'],['rd','Radical electron'],0,
 ['ar','Reaction arrow'],['ae','Equilibrium arrows'],['as','Resonance arrow'],['at','Retrosynthesis arrow'],['ac','Curved arrow, 2 electrons'],['af','Fishhook arrow, 1 electron'],['brk','Brackets [ ]'],['par','Parentheses ( )']];
const TIPS={select:'Click to select, drag to move, drag on empty space to box-select. Double-click an atom to relabel it; double-click a bond to select the molecule.',pan:'Drag to move around. Pinch or Ctrl + scroll to zoom.',erase:'Click an atom, bond, arrow or text to delete it.',
 chain:'Drag to draw a zigzag chain. Start on an atom to grow from it.',lbl:'Click an atom, then type a label (N, OH, OMe, CO2Et…). Click empty space for a new label.',
 qp:'Click an atom to add +. Click again for 2+.',qm:'Click an atom to add −.',lp:'Click an atom to add a lone pair. A fourth click clears them.',rd:'Click an atom to add a radical electron.',
 ac:'Drag from the electron source to where the electrons go. Ends snap to atoms and bond centres; select the arrow to reshape it.',af:'Drag from the electron source to where the electron goes.',
 brk:'Drag a box around a structure to bracket it. Use Text for ‡ or n.',par:'Drag a box around a structure.',text:'Click to type text. Click existing text to edit it.',tmpl:'Pick a template to drop into the drawing.'};
for(const k in BTOOL)TIPS[k]='Click empty space or an atom to add a bond; drag to aim it. Click a bond to change it'+(k==='bw'||k==='bh'?' (click again to flip the wedge).':'.')+' Hover an atom and press N, O, L (Cl), B (Br)… to relabel.';
['r3','r4','r5','r6','rb','r7','r8'].forEach(k=>TIPS[k]='Click empty space, an atom (spiro) or a bond (fused) to add the ring.');
['ar','ae','as','at'].forEach(k=>TIPS[k]='Drag to draw the arrow. A click gives a standard length.');
for(const t of TOOLS)if(t&&t[0].startsWith('el:')){const el=t[0].slice(3);IC[t[0]]=`<text x="10" y="15" font-size="${el.length>1?12:14}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" fill="currentColor">${el}</text>`;TIPS[t[0]]=`Click an atom to make it ${el}, click empty space to place ${el}, or drag from an atom to bond a new ${el} to it. Hydrogens are added automatically.`;}
$('#palette').innerHTML=TOOLS.map(t=>t?`<button class="tl" data-t="${t[0]}" title="${esc(t[1])}" aria-label="${esc(t[1])}" aria-pressed="false"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">${IC[t[0]]}</svg></button>`:'<span class="ps"></span>').join('');
const cdSvg=$('#cdSvg'),cdC=$('#cdC'),cdOv=$('#cdOv');
const ED={open:false,fig:null,id:null,d:null,tool:'b1',sel:new Set(),hover:null,drag:null,R:null,clip:null,ptrs:new Map(),pinch:null,lastTap:null,touch:false,te:null,hist:new Map(),vx:0,vy:0,z:1.4,guide:null,space:false};
function setTool(t){if(t==='tmpl'){openTemplates();return;}ED.tool=t;$$('#palette .tl').forEach(b=>b.setAttribute('aria-pressed',b.dataset.t===t));$('#cdTip').textContent=TIPS[t]||'';cdSvg.style.cursor=t==='pan'?'grab':t==='select'?'default':'crosshair';renderOverlay();}
$('#palette').addEventListener('click',e=>{const b=e.target.closest('[data-t]');if(b)setTool(b.dataset.t);});
$('#palette').addEventListener('pointerdown',e=>e.preventDefault());
function hist(){let h=ED.hist.get(ED.id);if(!h){h={u:[],r:[]};ED.hist.set(ED.id,h);}return h;}
function cr(){return cdSvg.getBoundingClientRect();}
function vbx(){const r=cr();return{s:ED.z,l:r.left-ED.vx*ED.z,t:r.top-ED.vy*ED.z};}
function pxu(){return ED.z;}
function toModel(e){const v=vbx();return{x:(e.clientX-v.l)/v.s,y:(e.clientY-v.t)/v.s};}
function toClient(x,y){const v=vbx();return{x:v.l+x*v.s,y:v.t+y*v.s};}
function openCD(fig){closeMenus();ED.fig=fig;ED.id=fig.dataset.id;if(!DRAW[ED.id])DRAW[ED.id]=newDrawing();ED.d=normalize(DRAW[ED.id]);ED.sel.clear();ED.hover=null;ED.open=true;
 const{w,h}=figBox(fig);ED.guide={w:w/PS,h:h/PS};$('#cd').hidden=false;document.body.style.overflow='hidden';
 const R=renderDrawing(ED.d);const b=R.bbox;ED.guide.cx=b?(b.x1+b.x2)/2:0;ED.guide.cy=b?(b.y1+b.y2)/2:0;setTool(ED.tool);requestAnimationFrame(()=>{fitView();renderCD();});}
function closeCD(){if(!ED.open)return;commitFloat();ED.open=false;$('#cd').hidden=true;document.body.style.overflow='';$('#pop').hidden=true;if(ED.fig&&ED.fig.isConnected)buildFig(ED.fig);ED.fig=null;saveNow();reflowSoon(20);}
$('#cdDone').onclick=closeCD;
function fitView(){const r=cr();const R=renderDrawing(ED.d);const g=ED.guide;let b=R.bbox;const gb={x1:g.cx-g.w/2,y1:g.cy-g.h/2,x2:g.cx+g.w/2,y2:g.cy+g.h/2};
 if(!b)b=gb;else b={x1:Math.min(b.x1,gb.x1),y1:Math.min(b.y1,gb.y1),x2:Math.max(b.x2,gb.x2),y2:Math.max(b.y2,gb.y2)};
 const bw=b.x2-b.x1+2*BL,bh=b.y2-b.y1+2*BL;ED.z=Math.max(0.3,Math.min(r.width/bw,r.height/bh,2.2));ED.vx=(b.x1+b.x2)/2-r.width/ED.z/2;ED.vy=(b.y1+b.y2)/2-r.height/ED.z/2;}
function zoomBy(f,cx,cy){const r=cr();if(cx==null){cx=r.left+r.width/2;cy=r.top+r.height/2;}const mx=ED.vx+(cx-r.left)/ED.z,my=ED.vy+(cy-r.top)/ED.z;ED.z=Math.max(0.25,Math.min(6,ED.z*f));ED.vx=mx-(cx-r.left)/ED.z;ED.vy=my-(cy-r.top)/ED.z;renderCD();}
$('#cdZi').onclick=()=>zoomBy(1.25);$('#cdZo').onclick=()=>zoomBy(0.8);$('#cdFit').onclick=()=>{fitView();renderCD();};
$('#cdPng').onclick=()=>exportDrawing(ED.d,'png');$('#cdSvgB').onclick=()=>exportDrawing(ED.d,'svg');
async function exportDrawing(d,kind){if(isEmpty(d)){toast('This drawing is empty');return;}const scale=PS*(kind==='png'?300/96:1);const o=drawingSVG(d,scale,8);
 if(kind==='svg')return saveFile('drawing.svg',o.svg,svgURL(o.svg));try{const p=await svgToPNG(o.svg,o.w*scale,o.h*scale);await saveFile('drawing.png',p.blob,p.url);}catch(e){toast('Could not render the PNG');}}
function renderCD(quiet){if(!ED.open)return;const r=cr();const w=r.width/ED.z,h=r.height/ED.z;cdSvg.setAttribute('viewBox',`${ED.vx} ${ED.vy} ${w} ${h}`);
 const bg=$('#cdBg');bg.setAttribute('x',ED.vx);bg.setAttribute('y',ED.vy);bg.setAttribute('width',w);bg.setAttribute('height',h);
 ED.R=renderDrawing(ED.d);cdC.innerHTML=ED.R.svg;
 const g=ED.guide,gr=$('#cdGuide'),gt=$('#cdGuideT');gr.setAttribute('x',g.cx-g.w/2);gr.setAttribute('y',g.cy-g.h/2);gr.setAttribute('width',g.w);gr.setAttribute('height',g.h);gr.setAttribute('stroke-width',1.2/ED.z);
 gt.setAttribute('x',g.cx-g.w/2+4/ED.z);gt.setAttribute('y',g.cy-g.h/2-5/ED.z);gt.setAttribute('font-size',11/ED.z);
 const b=ED.R.bbox;let note='';if(b){const s=Math.min(1,g.w/(b.x2-b.x1+12),g.h/(b.y2-b.y1+12));note=s>=0.999?'Fits the page area at full size':`Shrinks to ${Math.round(s*100)}% on the page. Enlarge the area on the page for full size.`;}
 $('#cdNote').textContent=note;renderOverlay();if(!quiet)renderStatus();$('#cdUndo').disabled=!hist().u.length;$('#cdRedo').disabled=!hist().r.length;}
function changed(){renderCD();DRAW[ED.id]=ED.d;save();}
window.addEventListener('resize',()=>{if(ED.open)renderCD(true);});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1;let t=((p.x-a.x)*dx+(p.y-a.y)*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
const A_=id=>ED.d.atoms.find(a=>a.id===id);
function handles(r){const h=[{k:'p1',x:r.x1,y:r.y1},{k:'p2',x:r.x2,y:r.y2}];if(r.cx!=null)h.push({k:'c',x:r.cx,y:r.cy});return h;}
function polyHit(p,polys,tol){for(const pl of polys)for(let i=1;i<pl.length;i++)if(segDist(p,pl[i-1],pl[i])<tol)return true;return false;}
function hitTest(p){const d=ED.d,u=pxu(),tp=(ED.touch?16:9)/u;
 if(ED.tool==='select')for(const k of ED.sel){if(k[0]!=='r')continue;const r=d.arrows.find(x=>x.id===k.slice(2));if(!r)continue;for(const h of handles(r))if(dist(p,h)<tp*1.4)return{type:'h',id:r.id,h:h.k};}
 let best=null,bd=Math.max(tp,0.3*BL);for(const a of d.atoms){const dd=dist(p,a);if(dd<bd){bd=dd;best=a;}}if(best)return{type:'a',id:best.id};
 for(const t of d.texts){const b=ED.R&&ED.R.tboxes[t.id];if(b&&inBox(p,b,3/u))return{type:'t',id:t.id};}
 let bb=null,bdd=Math.max(tp*0.8,0.22*BL);for(const b of d.bonds){const A=A_(b.a),B=A_(b.b);if(!A||!B)continue;const dd=segDist(p,A,B);if(dd<bdd){bdd=dd;bb=b;}}if(bb)return{type:'b',id:bb.id};
 for(const r of d.arrows)if(polyHit(p,arrowPolys(r),Math.max(tp*0.8,0.25*BL)))return{type:'r',id:r.id};
 return null;}
function snap(){const h=hist();h.u.push(JSON.stringify(ED.d));if(h.u.length>150)h.u.shift();h.r=[];}
function restoreD(json){const o=JSON.parse(json);for(const k of['atoms','bonds','arrows','texts','n'])ED.d[k]=o[k];ED.sel.clear();changed();}
function cdUndo(){const h=hist();if(!h.u.length)return;h.r.push(JSON.stringify(ED.d));restoreD(h.u.pop());}
function cdRedo(){const h=hist();if(!h.r.length)return;h.u.push(JSON.stringify(ED.d));restoreD(h.r.pop());}
$('#cdUndo').onclick=cdUndo;$('#cdRedo').onclick=cdRedo;
function addAtom(x,y,t='C',o={}){const a={id:nid(ED.d),x,y,t,charge:0,lp:0,rad:0,...o};ED.d.atoms.push(a);return a;}
function bondBetween(a,b){return ED.d.bonds.find(x=>(x.a===a&&x.b===b)||(x.a===b&&x.b===a));}
function addBond(a,b,order=1,style='plain'){if(a===b)return null;const ex=bondBetween(a,b);if(ex)return ex;const bd={id:nid(ED.d),a,b,order,style};ED.d.bonds.push(bd);return bd;}
function nearAtom(p,r=0.3*BL,ex){let best=null,bd=r;for(const a of ED.d.atoms){if(a.id===ex)continue;const d=dist(p,a);if(d<bd){bd=d;best=a;}}return best;}
function nbrs(id){const out=[];for(const b of ED.d.bonds){if(b.a===id)out.push(A_(b.b));else if(b.b===id)out.push(A_(b.a));}return out.filter(Boolean);}
function newDir(A){const nb=nbrs(A.id);if(!nb.length)return-Math.PI/6;
 if(nb.length===1){const th=Math.atan2(nb[0].y-A.y,nb[0].x-A.x);const cands=[th+2*Math.PI/3,th-2*Math.PI/3];let best=cands[0],bs=-1;
  for(const c of cands){const q={x:A.x+BL*Math.cos(c),y:A.y+BL*Math.sin(c)};let m=1e9;for(const a of ED.d.atoms){if(a.id===A.id)continue;m=Math.min(m,dist(q,a));}if(m>bs+0.5){bs=m;best=c;}}return best;}
 const an=nb.map(o=>Math.atan2(o.y-A.y,o.x-A.x)).sort((a,b)=>a-b);let best=0,gap=-1;for(let i=0;i<an.length;i++){const a1=an[i],a2=i+1<an.length?an[i+1]:an[0]+2*Math.PI;if(a2-a1>gap){gap=a2-a1;best=a1+gap/2;}}return best;}
function applyBondTool(b,t){const[o,st]=BTOOL[t];if(t==='b1'){if(b.style!=='plain'){b.style='plain';b.order=1;}else b.order=b.order%3+1;}
 else if(st==='plain'){b.order=o;b.style='plain';}else if(b.style===st&&(st==='wedge'||st==='hash')){const x=b.a;b.a=b.b;b.b=x;}else{b.style=st;b.order=1;}}
function bondFromAtom(A,ang,t){const q={x:A.x+BL*Math.cos(ang),y:A.y+BL*Math.sin(ang)};const ex=nearAtom(q,0.3*BL,A.id);const B=ex||addAtom(q.x,q.y);const[o,st]=BTOOL[t];const bd=bondBetween(A.id,B.id);if(bd)applyBondTool(bd,t);else addBond(A.id,B.id,o,st);}
const snapAng=(a,step=Math.PI/6)=>Math.round(a/step)*step;
function placeRing(t,hit,p){const arom=t==='rb';const n=arom?6:+t[1];const R=BL/(2*Math.sin(Math.PI/n)),ap=BL/(2*Math.tan(Math.PI/n));let verts=[];
 if(hit&&hit.type==='b'){const b=ED.d.bonds.find(x=>x.id===hit.id);const A=A_(b.a),B=A_(b.b);const mx=(A.x+B.x)/2,my=(A.y+B.y)/2;const dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy);let nx=-dy/L,ny=dx/L;
  let s=0;for(const o of[...nbrs(A.id),...nbrs(B.id)]){if(o.id===A.id||o.id===B.id)continue;s+=Math.sign((o.x-mx)*nx+(o.y-my)*ny);}
  if(s>0||(s===0&&((p.x-mx)*nx+(p.y-my)*ny)<0)){nx=-nx;ny=-ny;}const cx=mx+nx*ap,cy=my+ny*ap;const a0=Math.atan2(A.y-cy,A.x-cx);const step=2*Math.PI/n;
  const sg=dist({x:cx+R*Math.cos(a0+step),y:cy+R*Math.sin(a0+step)},B)<1?1:-1;for(let k=0;k<n;k++)verts.push({x:cx+R*Math.cos(a0+sg*step*k),y:cy+R*Math.sin(a0+sg*step*k)});}
 else if(hit&&hit.type==='a'){const A=A_(hit.id);const nb=nbrs(A.id);let ux=0,uy=-1;if(nb.length){let sx=0,sy=0;for(const o of nb){const l=dist(o,A)||1;sx+=(o.x-A.x)/l;sy+=(o.y-A.y)/l;}const l=Math.hypot(sx,sy);if(l>0.01){ux=-sx/l;uy=-sy/l;}else{ux=-(nb[0].y-A.y)/BL;uy=(nb[0].x-A.x)/BL;}}
  const cx=A.x+ux*R,cy=A.y+uy*R;const a0=Math.atan2(A.y-cy,A.x-cx);for(let k=0;k<n;k++)verts.push({x:cx+R*Math.cos(a0+2*Math.PI*k/n),y:cy+R*Math.sin(a0+2*Math.PI*k/n)});}
 else{for(let k=0;k<n;k++){const a=-Math.PI/2+2*Math.PI*k/n+(n%2===0&&n!==6?Math.PI/n:0);verts.push({x:p.x+R*Math.cos(a),y:p.y+R*Math.sin(a)});}}
 snap();const ids=verts.map(v=>{const ex=nearAtom(v,0.25*BL);return(ex||addAtom(v.x,v.y)).id;});
 const hasDbl=id=>ED.d.bonds.some(b=>(b.a===id||b.b===id)&&b.order>=2);
 for(let k=0;k<n;k++){const a=ids[k],b=ids[(k+1)%n];if(bondBetween(a,b))continue;const bd=addBond(a,b);if(arom&&!hasDbl(a)&&!hasDbl(b))bd.order=2;}
 if(arom)for(let k=0;k<n;k++){const bd=bondBetween(ids[k],ids[(k+1)%n]);if(bd&&bd.order===1&&!hasDbl(ids[k])&&!hasDbl(ids[(k+1)%n]))bd.order=2;}
 changed();}
function chainPts(s,p){const dx=p.x-s.x,dy=p.y-s.y,L=Math.hypot(dx,dy);const step=BL*Math.cos(Math.PI/6);const n=Math.max(1,Math.round(L/step));const an=snapAng(Math.atan2(dy,dx));const ux=Math.cos(an),uy=Math.sin(an),nx=-uy,ny=ux;
 const pts=[{x:s.x,y:s.y}];for(let k=1;k<=n;k++){const side=(k%2?-1:0)*BL/2;pts.push({x:s.x+ux*step*k+nx*side,y:s.y+uy*step*k+ny*side});}return pts;}
function removeAtom(id){ED.d.atoms=ED.d.atoms.filter(a=>a.id!==id);const gone=ED.d.bonds.filter(b=>b.a===id||b.b===id);ED.d.bonds=ED.d.bonds.filter(b=>b.a!==id&&b.b!==id);for(const b of gone)cleanup(b.a===id?b.b:b.a);}
function cleanup(id){const a=A_(id);if(!a)return;if((a.t||'C')==='C'&&!a.showC&&!a.charge&&!a.lp&&!a.rad&&!nbrs(id).length)ED.d.atoms=ED.d.atoms.filter(x=>x.id!==id);}
function eraseHit(h){snap();if(h.type==='a')removeAtom(h.id);else if(h.type==='b'){const b=ED.d.bonds.find(x=>x.id===h.id);ED.d.bonds=ED.d.bonds.filter(x=>x.id!==h.id);cleanup(b.a);cleanup(b.b);}
 else if(h.type==='r')ED.d.arrows=ED.d.arrows.filter(x=>x.id!==h.id);else if(h.type==='t')ED.d.texts=ED.d.texts.filter(x=>x.id!==h.id);ED.sel.delete(h.type+':'+h.id);ED.hover=null;changed();}
function snapCurve(p){let best=null,bd=0.4*BL;for(const a of ED.d.atoms){const d=dist(p,a);if(d<bd){bd=d;best={x:a.x,y:a.y,atom:true};}}
 for(const b of ED.d.bonds){const A=A_(b.a),B=A_(b.b);if(!A||!B)continue;const m={x:(A.x+B.x)/2,y:(A.y+B.y)/2};const d=dist(p,m);if(d<bd){bd=d;best={...m,atom:false};}}return best||{x:p.x,y:p.y};}
function makeArrow(t,p1,p2,moved){const kind=AKIND[t];
 if(kind==='curve2'||kind==='curve1'){let a=snapCurve(p1),b=moved?snapCurve(p2):{x:a.x+1.3*BL,y:a.y};let L=dist(a,b);if(L<8){b={x:a.x+1.3*BL,y:a.y};L=1.3*BL;}const ux=(b.x-a.x)/L,uy=(b.y-a.y)/L;
  const c={x:(a.x+b.x)/2+uy*0.45*L,y:(a.y+b.y)/2-ux*0.45*L};const pull=(q,s)=>{const dx=c.x-q.x,dy=c.y-q.y,l=Math.hypot(dx,dy)||1;return{x:q.x+dx/l*s,y:q.y+dy/l*s};};
  if(a.atom)a=pull(a,0.36*BL);if(b.atom)b=pull(b,0.4*BL);snap();ED.d.arrows.push({id:nid(ED.d),kind,x1:a.x,y1:a.y,x2:b.x,y2:b.y,cx:c.x,cy:c.y});}
 else if(kind==='brk'||kind==='par'){let b=p2;if(!moved||Math.abs(p2.x-p1.x)<BL*0.5||Math.abs(p2.y-p1.y)<BL*0.5)b={x:p1.x+3*BL,y:p1.y+2.5*BL};snap();ED.d.arrows.push({id:nid(ED.d),kind,x1:p1.x,y1:p1.y,x2:b.x,y2:b.y});}
 else{let b=p2;if(!moved||dist(p1,p2)<0.6*BL)b={x:p1.x+2.5*BL,y:p1.y};else{const an=snapAng(Math.atan2(p2.y-p1.y,p2.x-p1.x),Math.PI/12);const L=dist(p1,p2);b={x:p1.x+L*Math.cos(an),y:p1.y+L*Math.sin(an)};}
  snap();ED.d.arrows.push({id:nid(ED.d),kind,x1:p1.x,y1:p1.y,x2:b.x,y2:b.y});}
 changed();}
function applyLabel(a,v){v=v.trim();if(!v)return false;delete a.hLeft;delete a.hOff;
 let m=v.match(/^([A-Z][a-z]?)(?:H(\d*))?$/),rev=false;if(!m){m=v.match(/^H(\d*)([A-Z][a-z]?)$/);if(m){m=[m[0],m[2],m[1]];rev=true;}}
 if(m&&VAL[m[1]]!=null&&AW[m[1]]&&!(m[1]==='H'&&m[2]!=null)){const el=m[1];a.t=el;a.showC=el==='C'&&(v!=='C'||true);
  const hasH=/H/.test(v.replace(el,''))||(rev);if(hasH){const typed=m[2]?+m[2]:1;const adjA=ED.d.bonds.filter(b=>b.a===a.id||b.b===a.id).map(b=>({b}));const auto=hCount(a,adjA);if(typed!==auto)a.hOff=typed-auto;}
  if(hasH&&!ED.d.bonds.some(b=>b.a===a.id||b.b===a.id))a.hLeft=rev;return true;}
 a.t=v;a.showC=false;return true;}
function setLabel(a,v){if(!v||!v.trim())return;snap();applyLabel(a,v);changed();}
function elecTool(t,hit){if(!hit||hit.type!=='a')return;const a=A_(hit.id);snap();delete a.hOff;if(t==='qp')a.charge=Math.min(3,(a.charge||0)+1);else if(t==='qm')a.charge=Math.max(-3,(a.charge||0)-1);else if(t==='lp')a.lp=((a.lp||0)+1)%4;else a.rad=((a.rad||0)+1)%3;changed();}
const flt=$('#flt');
function openFloat(mode,x,y,val,ref){commitFloat();ED.te={mode,x,y,ref};const c=toClient(x,y);const fs=Math.max(14,FS*pxu());flt.style.fontSize=fs+'px';flt.value=val||'';flt.hidden=false;
 flt.style.left=Math.max(6,Math.min(window.innerWidth-160,c.x-40))+'px';flt.style.top=Math.max(6,c.y-fs*0.75)+'px';flt.placeholder=mode==='label'?'N, OH, OMe…':'Text';flt.focus();flt.select();}
function commitFloat(){if(!ED.te||flt.hidden)return;const te=ED.te,v=flt.value;ED.te=null;flt.hidden=true;if(!ED.open)return;
 if(te.mode==='label'){if(te.ref){const a=A_(te.ref);if(a&&v.trim()&&v.trim()!==a.t)setLabel(a,v);}else if(v.trim()){snap();const a=addAtom(te.x,te.y,'C');applyLabel(a,v);changed();}return;}
 if(te.ref){const t=ED.d.texts.find(x=>x.id===te.ref);if(!t||v===t.text)return;snap();if(!v.trim())ED.d.texts=ED.d.texts.filter(x=>x.id!==te.ref);else t.text=v;}
 else{if(!v.trim())return;snap();ED.d.texts.push({id:nid(ED.d),x:te.x,y:te.y,text:v,size:1,align:'center'});}changed();}
flt.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commitFloat();}else if(e.key==='Escape'){ED.te=null;flt.hidden=true;}e.stopPropagation();});
flt.addEventListener('blur',()=>setTimeout(commitFloat,0));
function selParts(){const atoms=new Set(),arrows=[],texts=[];for(const k of ED.sel){const t=k[0],id=k.slice(2);if(t==='a')atoms.add(id);else if(t==='b'){const b=ED.d.bonds.find(x=>x.id===id);if(b){atoms.add(b.a);atoms.add(b.b);}}else if(t==='r'){const r=ED.d.arrows.find(x=>x.id===id);if(r)arrows.push(r);}else if(t==='t'){const x=ED.d.texts.find(y=>y.id===id);if(x)texts.push(x);}}
 return{atoms:[...atoms].map(A_).filter(Boolean),arrows,texts};}
function selCenter(P){const b=BBox();P.atoms.forEach(a=>b.add(a.x,a.y));P.arrows.forEach(r=>{b.add(r.x1,r.y1);b.add(r.x2,r.y2);});P.texts.forEach(t=>b.add(t.x,t.y));const g=b.get();return g?{x:(g.x1+g.x2)/2,y:(g.y1+g.y2)/2}:null;}
function transformSel(fn){const P=selParts();const c=selCenter(P);if(!c)return;snap();const T=(x,y)=>fn(x-c.x,y-c.y,c);
 P.atoms.forEach(a=>{const q=T(a.x,a.y);a.x=q.x;a.y=q.y;});P.arrows.forEach(r=>{let q=T(r.x1,r.y1);r.x1=q.x;r.y1=q.y;q=T(r.x2,r.y2);r.x2=q.x;r.y2=q.y;if(r.cx!=null){q=T(r.cx,r.cy);r.cx=q.x;r.cy=q.y;}});P.texts.forEach(t=>{const q=T(t.x,t.y);t.x=q.x;t.y=q.y;});changed();}
const rot=deg=>transformSel((dx,dy,c)=>{const a=deg*Math.PI/180;return{x:c.x+dx*Math.cos(a)-dy*Math.sin(a),y:c.y+dx*Math.sin(a)+dy*Math.cos(a)};});
function deleteSel(){if(!ED.sel.size)return;snap();const P=selParts();const ids=new Set();for(const k of ED.sel)if(k[0]==='a')ids.add(k.slice(2));
 const bids=new Set([...ED.sel].filter(k=>k[0]==='b').map(k=>k.slice(2)));const ends=[];ED.d.bonds=ED.d.bonds.filter(b=>{if(bids.has(b.id)||ids.has(b.a)||ids.has(b.b)){ends.push(b.a,b.b);return false;}return true;});
 ED.d.atoms=ED.d.atoms.filter(a=>!ids.has(a.id));ends.forEach(cleanup);const rids=new Set(P.arrows.map(r=>r.id)),tids=new Set(P.texts.map(t=>t.id));
 ED.d.arrows=ED.d.arrows.filter(r=>!rids.has(r.id));ED.d.texts=ED.d.texts.filter(t=>!tids.has(t.id));ED.sel.clear();changed();}
function copySel(){const P=selParts();if(!P.atoms.length&&!P.arrows.length&&!P.texts.length)return false;const ids=new Set(P.atoms.map(a=>a.id));
 ED.clip={src:ED.id,fr:JSON.parse(JSON.stringify({atoms:P.atoms,bonds:ED.d.bonds.filter(b=>ids.has(b.a)&&ids.has(b.b)),arrows:P.arrows,texts:P.texts}))};return true;}
function pasteFrag(fr,dx,dy){snap();const m=new Map();ED.sel.clear();
 for(const a of fr.atoms){const n={...a,id:nid(ED.d),x:a.x+dx,y:a.y+dy};m.set(a.id,n.id);ED.d.atoms.push(n);ED.sel.add('a:'+n.id);}
 for(const b of fr.bonds){if(!m.has(b.a)||!m.has(b.b))continue;const n={...b,id:nid(ED.d),a:m.get(b.a),b:m.get(b.b)};ED.d.bonds.push(n);ED.sel.add('b:'+n.id);}
 for(const r of fr.arrows){const n={...r,id:nid(ED.d),x1:r.x1+dx,y1:r.y1+dy,x2:r.x2+dx,y2:r.y2+dy};if(r.cx!=null){n.cx=r.cx+dx;n.cy=r.cy+dy;}ED.d.arrows.push(n);ED.sel.add('r:'+n.id);}
 for(const t of fr.texts){const n={...t,id:nid(ED.d),x:t.x+dx,y:t.y+dy};ED.d.texts.push(n);ED.sel.add('t:'+n.id);}
 changed();}
function fragCenter(fr){const b=BBox();fr.atoms.forEach(a=>b.add(a.x,a.y));fr.arrows.forEach(r=>{b.add(r.x1,r.y1);b.add(r.x2,r.y2);});fr.texts.forEach(t=>b.add(t.x,t.y));const g=b.get();return g?{x:(g.x1+g.x2)/2,y:(g.y1+g.y2)/2}:{x:0,y:0};}
function freeSpot(){const r=cr();let tx=ED.vx+r.width/ED.z/2,ty=ED.vy+r.height/ED.z/2;for(let k=0;k<10&&ED.d.atoms.some(a=>Math.abs(a.x-tx)<BL*1.6&&Math.abs(a.y-ty)<BL*1.6);k++){tx+=BL*1.6;ty+=BL*0.5;}return{x:tx,y:ty};}
function paste(){if(!ED.clip)return toast('Nothing copied yet');if(ED.clip.src===ED.id)pasteFrag(ED.clip.fr,BL,BL);else{const c=fragCenter(ED.clip.fr),s=freeSpot();pasteFrag(ED.clip.fr,s.x-c.x,s.y-c.y);}}
function selectAll(){ED.sel.clear();ED.d.atoms.forEach(a=>ED.sel.add('a:'+a.id));ED.d.bonds.forEach(b=>ED.sel.add('b:'+b.id));ED.d.arrows.forEach(r=>ED.sel.add('r:'+r.id));ED.d.texts.forEach(t=>ED.sel.add('t:'+t.id));renderOverlay();renderStatus();}
function selectFragment(aid){const st=[aid],seen=new Set([aid]);while(st.length){const u=st.pop();ED.sel.add('a:'+u);for(const b of ED.d.bonds){let o=null;if(b.a===u)o=b.b;else if(b.b===u)o=b.a;if(o==null)continue;ED.sel.add('b:'+b.id);if(!seen.has(o)){seen.add(o);st.push(o);}}}}
function flipCurves(){snap();for(const k of ED.sel){if(k[0]!=='r')continue;const r=ED.d.arrows.find(x=>x.id===k.slice(2));if(!r||r.cx==null)continue;const dx=r.x2-r.x1,dy=r.y2-r.y1,L2=dx*dx+dy*dy||1;const t=((r.cx-r.x1)*dx+(r.cy-r.y1)*dy)/L2;const px=r.x1+t*dx,py=r.y1+t*dy;r.cx=2*px-r.cx;r.cy=2*py-r.cy;}changed();}
function textSize(f){snap();for(const k of ED.sel)if(k[0]==='t'){const t=ED.d.texts.find(x=>x.id===k.slice(2));if(t)t.size=Math.max(0.5,Math.min(2.5,+(((t.size||1)*f).toFixed(2))));}changed();}
function selAction(s){({dup:()=>{if(copySel())pasteFrag(ED.clip.fr,BL,BL);},copy:()=>{copySel();toast('Copied. Paste into any ChemDraw area.');renderStatus();},
 fh:()=>transformSel((dx,dy,c)=>({x:c.x-dx,y:c.y+dy})),fv:()=>transformSel((dx,dy,c)=>({x:c.x+dx,y:c.y-dy})),rl:()=>rot(-15),rr:()=>rot(15),fc:flipCurves,ts:()=>textSize(1/1.15),tl:()=>textSize(1.15),
 del:deleteSel,all:selectAll,paste})[s]();}
function renderStatus(){const R=ED.R;if(!R)return;const frs=fragments(R,ED.d);let use=frs;if(ED.sel.size){const ids=new Set(selParts().atoms.map(a=>a.id));use=frs.filter(c=>c.some(id=>ids.has(id)));}
 const cap=window.innerWidth<760?2:4;let h=use.slice(0,cap).map(c=>{const F=fragFormula(c,R,ED.d);const mw=massOf(F.c);const q=F.charge?(Math.abs(F.charge)>1?Math.abs(F.charge):'')+(F.charge>0?'+':'−'):'';const ex=exactOf(F.c);
  return`<button class="chip" data-copy="${esc(formulaText(F.c)+(mw?' '+mw.toFixed(2):''))}" title="${mw?'MW '+mw.toFixed(2)+(ex!=null?' · exact mass '+ex.toFixed(4):'')+' · click to copy':''}">${formulaHTML(F.c)}${q?'<sup>'+q+'</sup>':''}${F.unknown?'?':''} · ${mw!=null?mw.toFixed(2):'—'}</button>`;}).join('');
 if(use.length>cap)h+=`<span class="hint">+${use.length-cap}</span>`;if(!use.length)h='<span class="hint">Formula and molecular weight show here.</span>';h+='<span style="flex:1"></span>';
 const n=ED.sel.size;const hasC=[...ED.sel].some(k=>k[0]==='r'&&(ED.d.arrows.find(x=>x.id===k.slice(2))||{}).cx!=null),hasT=[...ED.sel].some(k=>k[0]==='t');
 h+=n?`<button class="b" data-s="dup">Duplicate</button><button class="b" data-s="copy">Copy</button><button class="b" data-s="fh" title="Mirror left–right (gives the enantiomer)">Flip ↔</button><button class="b" data-s="fv" title="Mirror top–bottom">Flip ↕</button><button class="b" data-s="rl" title="Rotate 15° left" aria-label="Rotate left">⟲</button><button class="b" data-s="rr" title="Rotate 15° right" aria-label="Rotate right">⟳</button>${hasC?'<button class="b" data-s="fc">Bend other way</button>':''}${hasT?'<button class="b" data-s="ts" aria-label="Smaller text">A−</button><button class="b" data-s="tl" aria-label="Larger text">A+</button>':''}<button class="b dng" data-s="del">Delete</button>`
  :`<button class="b" data-s="all">Select all</button>${ED.clip?'<button class="b" data-s="paste">Paste</button>':''}`;
 $('#cdStatus').innerHTML=h;}
$('#cdStatus').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.s){selAction(b.dataset.s);return;}if(b.dataset.copy){const v=b.dataset.copy;try{navigator.clipboard.writeText(v).then(()=>toast('Copied '+v),()=>toast(v));}catch(x){toast(v);}}});
const TEMPL=[['cyclohexene','Cyclohexene'],['benzene','Benzene'],['carbonyl','Ketone'],['aldehyde','Aldehyde'],['acid','Carboxylic acid'],['ester','Ester'],['amide','Amide'],['amine','Amine'],['alcohol','Alcohol'],['ether','Ether'],['cyp','Cyclopropane'],['plus','+ sign']];
function tmplDrawing(k){const g=DB();({cyclohexene:()=>hexagon(g,0,0,[1]),benzene:()=>hexagon(g,0,0,[0,2,4]),cyp:()=>{const a=g.A(-.5,.29),b=g.A(.5,.29),c=g.A(0,-.577);g.Bd(a,b);g.Bd(b,c);g.Bd(c,a);},plus:()=>g.T(0,0,'+'),
  carbonyl:()=>{const c=g.A(0,0);g.Bd(c,g.A(0,-1,'O'),2);g.Bd(c,g.A(-.866,.5));g.Bd(c,g.A(.866,.5));},
  aldehyde:()=>{const c=g.A(0,0);g.Bd(c,g.A(0,-1,'O'),2);g.Bd(c,g.A(-.866,.5));g.Bd(c,g.A(.866,.5,'H'));},
  acid:()=>{const c=g.A(0,0);g.Bd(c,g.A(0,-1,'O'),2);g.Bd(c,g.A(-.866,.5));g.Bd(c,g.A(.866,.5,'OH'));},
  ester:()=>{const c=g.A(0,0);g.Bd(c,g.A(0,-1,'O'),2);g.Bd(c,g.A(-.866,.5));const o=g.A(.866,.5,'O');g.Bd(c,o);g.Bd(o,g.A(1.732,0));},
  amide:()=>{const c=g.A(0,0);g.Bd(c,g.A(0,-1,'O'),2);g.Bd(c,g.A(-.866,.5));g.Bd(c,g.A(.866,.5,'NH2'));},
  amine:()=>{const n=g.A(0,0,'N');g.Bd(n,g.A(-.866,.5));g.Bd(n,g.A(.866,.5));},
  alcohol:()=>{const c=g.A(0,0);g.Bd(c,g.A(-.866,.5));g.Bd(c,g.A(.866,.5,'OH'));},
  ether:()=>{const o=g.A(0,0,'O');g.Bd(o,g.A(-.866,.5));g.Bd(o,g.A(.866,.5));}})[k]();return g.d;}
function openTemplates(){const pop=$('#pop');if(!pop.hidden){pop.hidden=true;return;}
 pop.innerHTML=TEMPL.map(([k,l])=>{const o=drawingSVG(tmplDrawing(k),1,6);return`<button data-tp="${k}" title="${esc(l)}">${o.svg.replace('<svg ','<svg preserveAspectRatio="xMidYMid meet" ')}<span>${esc(l)}</span></button>`;}).join('');
 const b=$('[data-t="tmpl"]').getBoundingClientRect();pop.hidden=false;const pr=pop.getBoundingClientRect();
 let x=b.right+8,y=b.top-pr.height/2;if(x+pr.width>window.innerWidth-8){x=Math.max(8,window.innerWidth-pr.width-8);y=b.top-pr.height-8;}pop.style.left=x+'px';pop.style.top=Math.max(8,Math.min(window.innerHeight-pr.height-8,y))+'px';}
$('#pop').addEventListener('click',e=>{const b=e.target.closest('[data-tp]');if(!b)return;$('#pop').hidden=true;const fr=tmplDrawing(b.dataset.tp);const c=fragCenter(fr),s=freeSpot();pasteFrag(fr,s.x-c.x,s.y-c.y);setTool('select');toast('Inserted. Drag it into place.');});
const ACC='#1f4fd6';
function renderOverlay(){if(!ED.open||!ED.R)return;let s='';const sw=1/pxu(),R=ED.R;
 const hv=ED.hover;if(hv&&!ED.drag){if(hv.type==='a'){const a=A_(hv.id);if(a)s+=`<circle cx="${a.x}" cy="${a.y}" r="${0.3*BL}" fill="${ACC}" fill-opacity=".14" stroke="${ACC}" stroke-width="${sw}"/>`;}
  else if(hv.type==='b'){const b=ED.d.bonds.find(x=>x.id===hv.id);const A=b&&A_(b.a),B=b&&A_(b.b);if(A&&B)s+=`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${ACC}" stroke-opacity=".25" stroke-width="${0.32*BL}" stroke-linecap="round"/>`;}
  else if(hv.type==='t'){const b=R.tboxes[hv.id];if(b)s+=`<rect x="${b.x1-3}" y="${b.y1-3}" width="${b.x2-b.x1+6}" height="${b.y2-b.y1+6}" fill="none" stroke="${ACC}" stroke-width="${sw}" stroke-dasharray="${3*sw}"/>`;}
  else if(hv.type==='r'){const r=ED.d.arrows.find(x=>x.id===hv.id);if(r)for(const pl of arrowPolys(r))s+=`<polyline points="${pl.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="${ACC}" stroke-opacity=".25" stroke-width="${0.3*BL}" stroke-linecap="round"/>`;}}
 for(const k of ED.sel){const t=k[0],id=k.slice(2);
  if(t==='a'){const a=A_(id);if(a)s+=`<circle cx="${a.x}" cy="${a.y}" r="${0.26*BL}" fill="${ACC}" fill-opacity=".22" stroke="${ACC}" stroke-width="${1.2*sw}"/>`;}
  else if(t==='b'){const b=ED.d.bonds.find(x=>x.id===id);const A=b&&A_(b.a),B=b&&A_(b.b);if(A&&B)s+=`<line x1="${A.x}" y1="${A.y}" x2="${B.x}" y2="${B.y}" stroke="${ACC}" stroke-opacity=".3" stroke-width="${0.28*BL}" stroke-linecap="round"/>`;}
  else if(t==='t'){const b=R.tboxes[id];if(b)s+=`<rect x="${b.x1-3}" y="${b.y1-3}" width="${b.x2-b.x1+6}" height="${b.y2-b.y1+6}" fill="${ACC}" fill-opacity=".08" stroke="${ACC}" stroke-width="${sw}"/>`;}
  else if(t==='r'){const r=ED.d.arrows.find(x=>x.id===id);if(!r)continue;for(const pl of arrowPolys(r))s+=`<polyline points="${pl.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="${ACC}" stroke-opacity=".28" stroke-width="${0.26*BL}" stroke-linecap="round"/>`;
   if(r.cx!=null)s+=`<path d="M${r.x1} ${r.y1}L${r.cx} ${r.cy}L${r.x2} ${r.y2}" fill="none" stroke="${ACC}" stroke-width="${sw}" stroke-dasharray="${4*sw}"/>`;
   if(ED.tool==='select')for(const h of handles(r))s+=`<circle cx="${h.x}" cy="${h.y}" r="${(ED.touch?9:5.5)*sw}" fill="#fff" stroke="${ACC}" stroke-width="${1.6*sw}"/>`;}}
 const dg=ED.drag;
 if(dg&&dg.moved){
  if(dg.kind==='band'||(dg.kind==='arrow'&&(dg.tool==='brk'||dg.tool==='par'))){const x=Math.min(dg.start.x,dg.p.x),y=Math.min(dg.start.y,dg.p.y);s+=`<rect x="${x}" y="${y}" width="${Math.abs(dg.p.x-dg.start.x)}" height="${Math.abs(dg.p.y-dg.start.y)}" fill="${ACC}" fill-opacity=".06" stroke="${ACC}" stroke-width="${sw}" stroke-dasharray="${4*sw}"/>`;}
  else if(dg.kind==='bond'&&dg.prev){const[a,b]=dg.prev;s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${ACC}" stroke-width="${2*sw}"/><circle cx="${b.x}" cy="${b.y}" r="${4*sw}" fill="${ACC}"/>`;}
  else if(dg.kind==='chain'&&dg.pts){s+=`<polyline points="${dg.pts.map(p=>p.x+','+p.y).join(' ')}" fill="none" stroke="${ACC}" stroke-width="${2*sw}"/><text x="${dg.p.x+8*sw}" y="${dg.p.y-8*sw}" font-size="${12*sw}" fill="${ACC}" font-family="Arial">${dg.pts.length-1}</text>`;}
  else if(dg.kind==='arrow')s+=`<line x1="${dg.start.x}" y1="${dg.start.y}" x2="${dg.p.x}" y2="${dg.p.y}" stroke="${ACC}" stroke-width="${2*sw}" stroke-dasharray="${5*sw}"/>`;}
 cdOv.innerHTML=s;}
cdSvg.addEventListener('pointerdown',e=>{if(e.button===2)return;e.preventDefault();cdSvg.setPointerCapture(e.pointerId);ED.touch=e.pointerType!=='mouse';ED.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ED.ptrs.size===2){const[a,b]=[...ED.ptrs.values()];ED.drag=null;ED.pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};renderOverlay();return;}if(ED.ptrs.size>2)return;
 commitFloat();const p=toModel(e);const tool=ED.tool;const dg={tool,start:p,p,sc:{x:e.clientX,y:e.clientY},moved:false,add:e.shiftKey||e.metaKey||e.ctrlKey};ED.drag=dg;
 if(e.button===1||tool==='pan'||ED.space){dg.kind='pan';dg.v0={x:ED.vx,y:ED.vy};cdSvg.style.cursor='grabbing';return;}
 const hit=hitTest(p);dg.hit=hit;
 if(tool==='select'){if(hit&&hit.type==='h')dg.kind='handle';else if(hit){const key=hit.type+':'+hit.id;if(!ED.sel.has(key)){if(!dg.add)ED.sel.clear();ED.sel.add(key);}dg.kind='move';}else{dg.kind='band';if(!dg.add)ED.sel.clear();}renderOverlay();renderStatus();return;}
 if(tool.startsWith('el:'))dg.kind='elem';else if(BTOOL[tool])dg.kind='bond';else if(tool==='chain')dg.kind='chain';else if(AKIND[tool])dg.kind='arrow';else dg.kind='click';});
cdSvg.addEventListener('pointermove',e=>{if(ED.ptrs.has(e.pointerId))ED.ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(ED.pinch&&ED.ptrs.size===2){const[a,b]=[...ED.ptrs.values()];const d=Math.hypot(a.x-b.x,a.y-b.y)||1,m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};const P=ED.pinch;ED.vx-=(m.x-P.m.x)/ED.z;ED.vy-=(m.y-P.m.y)/ED.z;zoomBy(d/P.d,m.x,m.y);ED.pinch={d,m};return;}
 const dg=ED.drag;
 if(!dg){if(e.pointerType==='mouse'){const p=toModel(e);const h=hitTest(p);const k=h?h.type+h.id:'',pk=ED.hover?ED.hover.type+ED.hover.id:'';ED.hover=h;if(k!==pk)renderOverlay();if(ED.tool!=='pan'&&!ED.space)cdSvg.style.cursor=h?'pointer':ED.tool==='select'?'default':'crosshair';}return;}
 const p=toModel(e);dg.p=p;if(!dg.moved&&Math.hypot(e.clientX-dg.sc.x,e.clientY-dg.sc.y)>4)dg.moved=true;if(!dg.moved)return;
 if(dg.kind==='pan'){ED.vx=dg.v0.x-(e.clientX-dg.sc.x)/ED.z;ED.vy=dg.v0.y-(e.clientY-dg.sc.y)/ED.z;renderCD(true);return;}
 if(dg.kind==='move'){if(!dg.orig){snap();const P=selParts();dg.orig={atoms:P.atoms.map(a=>[a,a.x,a.y]),arrows:P.arrows.map(r=>[r,r.x1,r.y1,r.x2,r.y2,r.cx,r.cy]),texts:P.texts.map(t=>[t,t.x,t.y])};dg.single=ED.sel.size===1&&dg.hit.type==='a'?dg.hit.id:null;}
  const dx=p.x-dg.start.x,dy=p.y-dg.start.y;for(const[a,x,y]of dg.orig.atoms){a.x=x+dx;a.y=y+dy;}for(const[r,x1,y1,x2,y2,cx,cy]of dg.orig.arrows){r.x1=x1+dx;r.y1=y1+dy;r.x2=x2+dx;r.y2=y2+dy;if(cx!=null){r.cx=cx+dx;r.cy=cy+dy;}}for(const[t,x,y]of dg.orig.texts){t.x=x+dx;t.y=y+dy;}renderCD(true);return;}
 if(dg.kind==='handle'){const r=ED.d.arrows.find(x=>x.id===dg.hit.id);if(!r)return;if(!dg.snapd){snap();dg.snapd=true;}if(dg.hit.h==='p1'){r.x1=p.x;r.y1=p.y;}else if(dg.hit.h==='p2'){r.x2=p.x;r.y2=p.y;}else{r.cx=p.x;r.cy=p.y;}renderCD(true);return;}
 if(dg.kind==='bond'||(dg.kind==='elem'&&dg.hit&&dg.hit.type==='a')){const h=dg.hit;const A=h&&h.type==='a'?A_(h.id):null;const s=A?{x:A.x,y:A.y}:dg.start;const ex=nearAtom(p,0.4*BL,A&&A.id);let end;
  if(ex)end={x:ex.x,y:ex.y};else{const an=snapAng(Math.atan2(p.y-s.y,p.x-s.x));end={x:s.x+BL*Math.cos(an),y:s.y+BL*Math.sin(an)};}dg.prev=[s,end];dg.endAtom=ex;}
 if(dg.kind==='chain'){const h=dg.hit;const A=h&&h.type==='a'?A_(h.id):null;dg.pts=chainPts(A?{x:A.x,y:A.y}:dg.start,p);}
 renderOverlay();});
function endPtr(e){ED.ptrs.delete(e.pointerId);if(ED.pinch){if(ED.ptrs.size<2)ED.pinch=null;ED.drag=null;return;}const dg=ED.drag;if(!dg)return;ED.drag=null;const p=dg.p,h=dg.hit,t=dg.tool;
 if(e.type==='pointercancel'){renderCD();return;}
 switch(dg.kind){
  case'pan':setTool(ED.tool);renderCD();break;
  case'move':if(dg.moved&&dg.single){const a=A_(dg.single);const tgt=nearAtom(a,0.28*BL,a.id);if(tgt){for(const b of ED.d.bonds){if(b.a===a.id)b.a=tgt.id;if(b.b===a.id)b.b=tgt.id;}const seen=new Set();ED.d.bonds=ED.d.bonds.filter(b=>{if(b.a===b.b)return false;const k=[b.a,b.b].sort().join('|');if(seen.has(k))return false;seen.add(k);return true;});ED.d.atoms=ED.d.atoms.filter(x=>x.id!==a.id);ED.sel.clear();}}
   if(!dg.moved&&h&&h.type!=='h'){const key=h.type+':'+h.id,now=Date.now();
    if(ED.lastTap&&ED.lastTap.k===key&&now-ED.lastTap.t<400){ED.lastTap=null;if(h.type==='a'){const a=A_(h.id);openFloat('label',a.x,a.y,(a.t||'C'),a.id);}else if(h.type==='t'){const tx=ED.d.texts.find(x=>x.id===h.id);openFloat('text',tx.x,tx.y,tx.text,tx.id);}else if(h.type==='b'){selectFragment(ED.d.bonds.find(x=>x.id===h.id).a);}}
    else ED.lastTap={k:key,t:now};}
   changed();break;
  case'handle':changed();break;
  case'band':if(dg.moved){const x1=Math.min(dg.start.x,p.x),x2=Math.max(dg.start.x,p.x),y1=Math.min(dg.start.y,p.y),y2=Math.max(dg.start.y,p.y);const inR=q=>q.x>=x1&&q.x<=x2&&q.y>=y1&&q.y<=y2;
    const ins=new Set();for(const a of ED.d.atoms)if(inR(a)){ED.sel.add('a:'+a.id);ins.add(a.id);}for(const b of ED.d.bonds)if(ins.has(b.a)&&ins.has(b.b))ED.sel.add('b:'+b.id);
    for(const r of ED.d.arrows)if(inR({x:r.x1,y:r.y1})&&inR({x:r.x2,y:r.y2}))ED.sel.add('r:'+r.id);for(const tx of ED.d.texts)if(inR(tx))ED.sel.add('t:'+tx.id);}
   renderOverlay();renderStatus();break;
  case'elem':{const el=t.slice(3);
   if(dg.moved&&h&&h.type==='a'&&dg.prev){snap();const A=A_(h.id);const end=dg.prev[1];let B=dg.endAtom;if(!B){B=addAtom(end.x,end.y);applyLabel(B,el);}addBond(A.id,B.id);changed();}
   else if(!dg.moved&&h&&h.type==='a'){const a=A_(h.id);snap();if(el==='C'&&(a.t||'C')==='C'){a.showC=!a.showC;delete a.hOff;}else applyLabel(a,el);changed();}
   else if(!h||h.type!=='a'){if(!dg.moved||!h){snap();const a=addAtom(dg.start.x,dg.start.y);applyLabel(a,el);changed();}}
   else renderOverlay();break;}
  case'bond':{const[o,st]=BTOOL[t];
   if(!dg.moved){if(h&&h.type==='b'){snap();applyBondTool(ED.d.bonds.find(x=>x.id===h.id),t);changed();}else if(h&&h.type==='a'){snap();const A=A_(h.id);bondFromAtom(A,newDir(A),t);changed();}
    else{snap();const A=addAtom(dg.start.x,dg.start.y);const B=addAtom(A.x+BL*Math.cos(-Math.PI/6),A.y+BL*Math.sin(-Math.PI/6));addBond(A.id,B.id,o,st);changed();}}
   else if(dg.prev){snap();let A=h&&h.type==='a'?A_(h.id):null;if(!A)A=nearAtom(dg.start,0.3*BL)||addAtom(dg.start.x,dg.start.y);const end=dg.prev[1];const B=dg.endAtom||nearAtom(end,0.3*BL,A.id)||addAtom(end.x,end.y);
    const ex=bondBetween(A.id,B.id);if(ex)applyBondTool(ex,t);else addBond(A.id,B.id,o,st);changed();}else renderOverlay();break;}
  case'chain':{const A0=h&&h.type==='a'?A_(h.id):null;const s0=A0?{x:A0.x,y:A0.y}:dg.start;const pts=dg.moved&&dg.pts?dg.pts:chainPts(s0,{x:s0.x+BL*0.87*4,y:s0.y});snap();
   let prev=A0||nearAtom(pts[0],0.3*BL)||addAtom(pts[0].x,pts[0].y);for(let k=1;k<pts.length;k++){const nx=nearAtom(pts[k],0.3*BL,prev.id)||addAtom(pts[k].x,pts[k].y);addBond(prev.id,nx.id);prev=nx;}changed();break;}
  case'arrow':makeArrow(t,dg.start,p,dg.moved);break;
  case'click':if(dg.moved){renderOverlay();break;}
   if(t[0]==='r'&&t.length===2)placeRing(t,h&&(h.type==='a'||h.type==='b')?h:null,dg.start);
   else if(t==='lbl'){if(h&&h.type==='a'){const a=A_(h.id);openFloat('label',a.x,a.y,a.t||'C',a.id);}else if(!h)openFloat('label',dg.start.x,dg.start.y,'',null);}
   else if(['qp','qm','lp','rd'].includes(t))elecTool(t,h);
   else if(t==='erase'){if(h&&h.type!=='h')eraseHit(h);}
   else if(t==='text'){if(h&&h.type==='t'){const tx=ED.d.texts.find(x=>x.id===h.id);openFloat('text',tx.x,tx.y,tx.text,tx.id);}else openFloat('text',dg.start.x,dg.start.y,'',null);}
   break;}}
cdSvg.addEventListener('pointerup',endPtr);cdSvg.addEventListener('pointercancel',endPtr);
cdSvg.addEventListener('pointerleave',()=>{if(!ED.drag&&ED.hover){ED.hover=null;renderOverlay();}});
cdSvg.addEventListener('contextmenu',e=>e.preventDefault());
cdSvg.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey)zoomBy(Math.exp(-e.deltaY*0.01),e.clientX,e.clientY);else{ED.vx+=e.deltaX/ED.z;ED.vy+=e.deltaY/ED.z;renderCD(true);}},{passive:false});
const HK={c:'C',n:'N',o:'O',s:'S',p:'P',f:'F',h:'H',i:'I',l:'Cl',b:'Br'};
const TK={s:'select',e:'erase','1':'b1','2':'b2','3':'b3',z:'chain',w:'bw',h:'bh',a:'lbl',b:'rb',t:'text'};
document.addEventListener('keydown',e=>{if(!ED.open)return;const tg=e.target;if(tg===flt)return;const k=e.key.toLowerCase(),mod=e.ctrlKey||e.metaKey;
 if(k===' '&&!ED.space){ED.space=true;cdSvg.style.cursor='grab';e.preventDefault();return;}
 if(mod&&k==='z'){e.preventDefault();e.shiftKey?cdRedo():cdUndo();return;}if(mod&&k==='y'){e.preventDefault();cdRedo();return;}
 if(mod&&k==='c'){if(copySel())toast('Copied');e.preventDefault();return;}if(mod&&k==='v'){e.preventDefault();paste();return;}if(mod&&k==='a'){e.preventDefault();selectAll();return;}if(mod&&k==='d'){e.preventDefault();selAction('dup');return;}
 if(k==='escape'){if(ED.sel.size){ED.sel.clear();renderOverlay();renderStatus();}else closeCD();return;}
 if(k==='delete'||k==='backspace'){e.preventDefault();if(ED.sel.size)deleteSel();else if(ED.hover)eraseHit(ED.hover);return;}
 if(mod||e.altKey)return;const hv=ED.hover;
 if(hv&&hv.type==='a'){const a=A_(hv.id);if(HK[k]){e.preventDefault();setLabel(a,HK[k]);return;}if(k==='+'||k==='='){elecTool('qp',hv);return;}if(k==='-'){elecTool('qm',hv);return;}}
 if(hv&&hv.type==='b'&&'123'.includes(k)&&k){snap();const b=ED.d.bonds.find(x=>x.id===hv.id);b.order=+k;b.style='plain';changed();return;}
 if(TK[k]){e.preventDefault();setTool(TK[k]);}});
document.addEventListener('keyup',e=>{if(e.key===' '&&ED.space){ED.space=false;setTool(ED.tool);}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!area.hidden){setAreaMode(false);AR=null;arect.hidden=true;}});

/* ================= boot ================= */
try{document.execCommand('defaultParagraphSeparator',false,'p');}catch(e){}
let stored=null;try{stored=JSON.parse(localStorage.getItem(LS)||'null');}catch(e){}
ZOOM=fitZoom();loadDoc(stored);
requestAnimationFrame(()=>{ZOOM=fitZoom();layoutStage();reflow();});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>reflow());
