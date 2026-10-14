'use strict';
/* ================= chemistry data ================= */
const AW={H:1.008,He:4.0026,Li:6.94,Be:9.0122,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.065,Cl:35.453,Ar:39.948,K:39.098,Ca:40.078,Ti:47.867,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Ge:72.63,As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Zr:91.224,Mo:95.95,Ru:101.07,Rh:102.91,Pd:106.42,Ag:107.87,Sn:118.71,Te:127.60,I:126.90,Xe:131.29,Cs:132.91,Ba:137.33,Ce:140.12,W:183.84,Os:190.23,Pt:195.08,Au:196.97,Hg:200.59,Pb:207.2,Bi:208.98};
const MONO={H:1.0078250,C:12,N:14.0030740,O:15.9949146,F:18.9984032,Na:22.9897693,Mg:23.9850417,Si:27.9769265,P:30.9737615,S:31.9720707,Cl:34.9688527,K:38.9637069,Br:78.9183371,I:126.904473,B:11.0093054,Li:7.0160040};
const VAL={C:4,Si:4,N:3,P:3,B:3,O:2,S:2,Se:2,F:1,Cl:1,Br:1,I:1,H:1};
const ABBR={Me:{f:'CH3'},Et:{f:'C2H5'},Pr:{f:'C3H7'},iPr:{f:'C3H7'},Bu:{f:'C4H9'},tBu:{f:'C4H9'},Ph:{f:'C6H5'},Bn:{f:'C7H7'},Ac:{f:'C2H3O'},Ts:{f:'C7H7O2S'},Boc:{f:'C5H9O2'},TMS:{f:'C3H9Si'},
 OMe:{f:'CH3O',rev:'MeO'},OEt:{f:'C2H5O',rev:'EtO'},OAc:{f:'C2H3O2',rev:'AcO'},OH:{f:'HO',rev:'HO'},SH:{f:'HS',rev:'HS'},NH2:{f:'H2N',rev:'H2N'},
 CO2Me:{f:'C2H3O2',rev:'MeO2C'},CO2Et:{f:'C3H5O2',rev:'EtO2C'},CO2H:{f:'CHO2',rev:'HO2C'},COOH:{f:'CHO2',rev:'HOOC'},CHO:{f:'CHO',rev:'OHC'},CN:{f:'CN',rev:'NC'},NO2:{f:'NO2',rev:'O2N'},CF3:{f:'CF3',rev:'F3C'},CCl3:{f:'CCl3',rev:'Cl3C'}};
const LIB=[
 ['Chloroform','CHCl3',1.489],['Sodium hydroxide','NaOH',null],['50% aq. NaOH','NaOH',1.52,50],['Cyclohexene','C6H10',0.811],
 ['Benzyltriethylammonium chloride','C13H22ClN',null],['Tetrabutylammonium bromide','C16H36BrN',null],['Dichloromethane','CH2Cl2',1.326],['Water','H2O',1.000],
 ['Diethyl ether','C4H10O',0.713],['Magnesium sulfate (anhydrous)','MgSO4',null],['Sodium sulfate (anhydrous)','Na2SO4',null],['Sodium chloride','NaCl',null],
 ['7,7-Dichlorobicyclo[4.1.0]heptane','C7H10Cl2',null],['Bromoform','CHBr3',2.89],['Styrene','C8H8',0.906],['1,1-Dichloro-2-phenylcyclopropane','C9H8Cl2',null],
 ['Potassium tert-butoxide','C4H9KO',null],['(E)-2-Butene','C4H8',null],['(Z)-2-Butene','C4H8',null],['Ethanol','C2H6O',0.789],['Hexane','C6H14',0.659],
 ['Acetone','C3H6O',0.784],['Ethyl acetate','C4H8O2',0.902],['Triethylamine','C6H15N',0.726],['Maleic anhydride','C4H2O3',null],['Anthracene','C14H10',null],
 ['Cyclopentadiene','C5H6',0.802],['Furan','C4H4O',0.936],['Xylenes','C8H10',0.86]];

function addC(t,c,m=1){for(const k in c)t[k]=(t[k]||0)+c[k]*m;return t;}
function parseGroup(s){let i=0;const st=[{}];
 while(i<s.length){const ch=s[i];
  if(ch==='('||ch==='['){st.push({});i++;}
  else if(ch===')'||ch===']'){if(st.length<2)return null;const g=st.pop();i++;let n='';while(i<s.length&&/\d/.test(s[i]))n+=s[i++];addC(st[st.length-1],g,n?+n:1);}
  else if(/[A-Z]/.test(ch)){let sym=ch;i++;while(i<s.length&&/[a-z]/.test(s[i]))sym+=s[i++];let n='';while(i<s.length&&/\d/.test(s[i]))n+=s[i++];
   let c;if(AW[sym])c={[sym]:1};else if(ABBR[sym])c=parseGroup(ABBR[sym].f);else if(AW[sym[0]]&&sym.length===2&&AW[sym.slice(0,1)]){return null;}else return null;
   if(!c)return null;addC(st[st.length-1],c,n?+n:1);}
  else return null;}
 return st.length===1?st[0]:null;}
function parseFormula(s){s=String(s||'').replace(/\s+/g,'');if(!s)return null;const tot={};
 for(let part of s.split(/[·.*•]/)){if(!part)continue;let m=1;const mm=part.match(/^(\d+)(.*)$/);if(mm){m=+mm[1];part=mm[2];}const c=parseGroup(part);if(!c)return null;addC(tot,c,m);}
 return Object.keys(tot).length?tot:null;}
function massOf(c){let m=0;for(const k in c){if(!AW[k])return null;m+=AW[k]*c[k];}return m;}
function exactOf(c){let m=0;for(const k in c){if(MONO[k]==null)return null;m+=MONO[k]*c[k];}return m;}
function hillKeys(c){const ks=Object.keys(c).filter(k=>c[k]>0);if(c.C)return ['C',...(c.H?['H']:[]),...ks.filter(k=>k!=='C'&&k!=='H').sort()];return ks.sort();}
function formulaHTML(c){return hillKeys(c).map(k=>k+(c[k]>1?'<sub>'+c[k]+'</sub>':'')).join('');}
function formulaText(c){return hillKeys(c).map(k=>k+(c[k]>1?c[k]:'')).join('');}

/* ================= text with chemical formatting ================= */
const _ctx=document.createElement('canvas').getContext('2d');
const DFONT='Arial, Helvetica, sans-serif';
function tw(t,size,it,b){_ctx.font=(it?'italic ':'')+(b?'bold ':'')+size+'px '+DFONT;return _ctx.measureText(t).width;}
function esc(s){return String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
const f2=n=>Math.round(n*100)/100;
function isFormulaWord(w){
 if(!/^[A-Z(\[]/.test(w)||!/\d/.test(w))return false;
 const toks=w.match(/[A-Z][a-z]*|[a-z]+|\d+|[()\[\]]/g)||[];if(toks.join('')!==w)return false;
 let sym=0,first=null;for(const t of toks){if(/^[a-z]/.test(t))return false;if(/^[A-Z]/.test(t)){if(!(AW[t]||ABBR[t]))return false;sym++;if(!first)first=t;}}
 if(sym===1&&first==='C')return false; /* C1, C2 … are atom numbers */
 return sym>=1&&/[A-Za-z)\]]\d/.test(w);}
function autoFormula(s,it,b){const out=[];const push=(t,k)=>{if(!t)return;const l=out[out.length-1];if(l&&l.k==='n'&&k==='n')l.t+=t;else out.push({t,k,i:it,b});};
 const re=/[A-Za-z0-9()\[\]]+|[^A-Za-z0-9()\[\]]+/g;let m;
 while((m=re.exec(s))){const w=m[0];
  if(/^sp[23]$/.test(w)){push('sp','n');push(w[2],'sup');continue;}
  if(/^SN[12]$/.test(w)){push('S','n');push('N','sub');push(w[2],'n');continue;}
  if(isFormulaWord(w)){let prev='';for(const p of w.match(/\d+|\D+/g)){if(/^\d+$/.test(p)&&/[A-Za-z)\]]$/.test(prev))push(p,'sub');else push(p,'n');prev=p;}}
  else push(w,'n');}
 return out;}
function chemRuns(str){str=String(str??'').replace(/<=>/g,'⇌').replace(/->/g,'→');
 const lines=[[]];let i=0,it=false,bd=false,buf='';
 const flush=()=>{if(buf){for(const r of autoFormula(buf,it,bd))lines[lines.length-1].push(r);buf='';}};
 while(i<str.length){const c=str[i];
  if(c==='\n'){flush();lines.push([]);i++;continue;}
  if(c==='*'&&str[i+1]==='*'){flush();bd=!bd;i+=2;continue;}
  if(c==='*'){flush();it=!it;i++;continue;}
  if((c==='_'||c==='^')&&i+1<str.length&&str[i+1]!==' '){let t;
   if(str[i+1]==='{'){const j=str.indexOf('}',i+2);if(j<0){buf+=c;i++;continue;}t=str.slice(i+2,j);i=j+1;}
   else{const m=str.slice(i+1).match(/^(\d+[+\-−]?|[+\-−]|\S)/);t=m[0];i+=1+t.length;}
   flush();lines[lines.length-1].push({t:t.replace(/-/g,'−'),k:c==='_'?'sub':'sup',i:it,b:bd});continue;}
  buf+=c;i++;}
 flush();return lines;}
function inlineHTML(s){return chemRuns(s).map(runs=>runs.map(r=>{let h=esc(r.t);if(r.k==='sub')h='<sub>'+h+'</sub>';if(r.k==='sup')h='<sup>'+h+'</sup>';if(r.i)h='<i>'+h+'</i>';if(r.b)h='<b>'+h+'</b>';return h;}).join('')).join('<br>');}
function richBlocks(str){const out=[];for(const para of String(str||'').split(/\n\s*\n/)){if(!para.trim())continue;
  const lines=para.split('\n');let html='',list=[],txt=[];
  const fl=()=>{if(txt.length){html+='<p style="margin:0 0 4px">'+inlineHTML(txt.join('\n'))+'</p>';txt=[];}if(list.length){html+='<ul>'+list.map(l=>'<li>'+inlineHTML(l)+'</li>').join('')+'</ul>';list=[];}};
  for(const l of lines){const m=l.match(/^\s*[-•]\s+(.*)$/);if(m){if(txt.length){const t=txt;txt=[];html+='<p style="margin:0 0 4px">'+inlineHTML(t.join('\n'))+'</p>';}list.push(m[1]);}else{if(list.length){html+='<ul>'+list.map(x=>'<li>'+inlineHTML(x)+'</li>').join('')+'</ul>';list=[];}txt.push(l);}}
  fl();out.push(html);}
 return out;}

/* ================= drawing model & renderer (ACS Document 1996 proportions) ================= */
const BL=30, LW=1.25, BOLDW=4.2, DSP=5.4, HSP=5.2, FS=20.8, SUBF=0.72, WEDGEW=3.1;
function newDrawing(){return{atoms:[],bonds:[],arrows:[],texts:[],n:1};}
function normalize(d){for(const k of['atoms','bonds','arrows','texts'])if(!Array.isArray(d[k]))d[k]=[];let mx=0;for(const k of['atoms','bonds','arrows','texts'])for(const o of d[k]){const n=parseInt(String(o.id).replace(/\D/g,''))||0;if(n>mx)mx=n;}d.n=Math.max(d.n||1,mx+1);return d;}
function nid(d){return 'k'+(d.n++);}
function analyze(d){const amap=new Map(d.atoms.map(a=>[a.id,a]));const adj=new Map(d.atoms.map(a=>[a.id,[]]));
 for(const b of d.bonds){if(!amap.has(b.a)||!amap.has(b.b))continue;adj.get(b.a).push({b,o:b.b});adj.get(b.b).push({b,o:b.a});}return{amap,adj};}
function hCount(a,adjA){const t=a.t||'C';if(VAL[t]==null)return 0;let v=VAL[t];const q=a.charge||0;
 if(t==='C'||t==='Si')v-=q?Math.abs(q):2*(a.lp||0);else if(t==='B')v-=q;else if(t==='H')v-=Math.abs(q);else v+=q;
 v-=(a.rad||0);let bo=0;for(const e of adjA)bo+=e.b.style==='dash'?1:(e.b.order||1);return Math.max(0,v-bo+(a.hOff||0));}
function tokLabel(s){const ps=[];const re=/[A-Z][a-z]*|[a-z]+|\d+|[^A-Za-z\d]+/g;let m,prev='';while((m=re.exec(s))){const t=m[0];ps.push({t,sub:/^\d+$/.test(t)&&/[A-Za-z)\]]$/.test(prev)});prev=t;}return ps;}
function atomLabel(a,adjA,amap){const t=a.t||'C';const deg=adjA.length;
 if(t==='C'&&!a.showC&&deg>0)return null;
 let mdx=0;for(const e of adjA){const o=amap.get(e.o);const L=Math.hypot(o.x-a.x,o.y-a.y)||1;mdx+=(o.x-a.x)/L;}if(deg)mdx/=deg;
 const right=mdx>0.25;
 if(AW[t]){const h=hCount(a,adjA);if(!h)return{pieces:[{t}],anchor:0,hSide:null};
  let left=a.hLeft!=null?a.hLeft:(deg?right:((t==='O'||t==='S')));
  const hp=[{t:'H'}];if(h>1)hp.push({t:String(h),sub:true});
  return left?{pieces:[...hp,{t}],anchor:hp.length,hSide:'left'}:{pieces:[{t},...hp],anchor:0,hSide:'right'};}
 if(ABBR[t]){const rev=right&&ABBR[t].rev;const txt=rev?ABBR[t].rev:t;const ps=tokLabel(txt);let anc=0;if(rev){for(let i=ps.length-1;i>=0;i--)if(/^[A-Z]/.test(ps[i].t)){anc=i;break;}}
  return{pieces:ps,anchor:anc,hSide:ps.length>1?(rev?'left':'right'):null};}
 const ps=tokLabel(t);let anc=0;for(let i=0;i<ps.length;i++)if(/^[A-Z]/.test(ps[i].t)){anc=i;break;}
 return{pieces:ps,anchor:anc,hSide:ps.length>1?'right':null};}
function layoutLabel(a,L){const ws=L.pieces.map(p=>tw(p.t,p.sub?FS*SUBF:FS));let before=0;for(let i=0;i<L.anchor;i++)before+=ws[i];
 const x0=a.x-before-ws[L.anchor]/2;let x=x0;const base=a.y+FS*0.36;let s='',sub=false;
 L.pieces.forEach((p,i)=>{s+=`<text x="${f2(x)}" y="${f2(base+(p.sub?FS*0.22:0))}" font-size="${f2(p.sub?FS*SUBF:FS)}">${esc(p.t)}</text>`;if(p.sub)sub=true;x+=ws[i];});
 const m=2.4;return{svg:s,hSide:L.hSide,box:{x1:x0-m,y1:a.y-FS*0.39-m,x2:x+m,y2:a.y+FS*(sub?0.52:0.39)+m}};}
function inBox(p,b,m=0){return b&&p.x>=b.x1-m&&p.x<=b.x2+m&&p.y>=b.y1-m&&p.y<=b.y2+m;}
function exitT(p,dx,dy,b){let t=Infinity;if(dx>0)t=Math.min(t,(b.x2-p.x)/dx);else if(dx<0)t=Math.min(t,(b.x1-p.x)/dx);if(dy>0)t=Math.min(t,(b.y2-p.y)/dy);else if(dy<0)t=Math.min(t,(b.y1-p.y)/dy);return t;}
function clipSeg(p,q,bp,bq){let P={...p},Q={...q};const dx=Q.x-P.x,dy=Q.y-P.y;let t0=0,t1=1;
 if(bp&&inBox(p,bp))t0=exitT(p,dx,dy,bp);if(bq&&inBox(q,bq))t1=1-exitT(q,-dx,-dy,bq);if(t1-t0<0.02)return null;
 return[{x:p.x+dx*t0,y:p.y+dy*t0},{x:p.x+dx*t1,y:p.y+dy*t1}];}
function ringPath(b,adj){const start=b.a,goal=b.b;const prev=new Map([[start,null]]);let fr=[start];
 for(let dep=0;dep<7&&fr.length;dep++){const nf=[];for(const u of fr)for(const e of adj.get(u)||[]){if(e.b===b||prev.has(e.o))continue;prev.set(e.o,u);if(e.o===goal){const path=[];let x=goal;while(x!=null){path.push(x);x=prev.get(x);}return path;}nf.push(e.o);}fr=nf;}return null;}
function dblSide(b,A,B,adj,amap,lab){const na=adj.get(A.id).filter(e=>e.o!==B.id),nb=adj.get(B.id).filter(e=>e.o!==A.id);
 if((lab.get(A.id)&&!na.length)||(lab.get(B.id)&&!nb.length))return 0;if(!na.length&&!nb.length)return 0;
 const dx=B.x-A.x,dy=B.y-A.y;const cr=(px,py)=>Math.sign(dx*(py-A.y)-dy*(px-A.x));
 const rp=ringPath(b,adj);if(rp){let cx=0,cy=0;for(const id of rp){const o=amap.get(id);cx+=o.x;cy+=o.y;}const s=cr(cx/rp.length,cy/rp.length);if(s)return s;}
 let s=0;for(const e of[...na,...nb]){const o=amap.get(e.o);s+=cr(o.x,o.y);}
 if(s)return s>0?1:-1;const f=(na[0]||nb[0]);const o=amap.get(f.o);return cr(o.x,o.y)||1;}
const ln=(p,q,w=LW,extra='')=>`<line x1="${f2(p.x)}" y1="${f2(p.y)}" x2="${f2(q.x)}" y2="${f2(q.y)}" stroke="#000" stroke-width="${w}"${extra.includes('linecap')?'':' stroke-linecap="round"'}${extra}/>`;
function bondSVG(b,A,B,lab,adj,amap){const la=lab.get(A.id),lb=lab.get(B.id);const ba=la&&la.box,bb=lb&&lb.box;
 const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
 const seg=(o)=>clipSeg({x:A.x+nx*o,y:A.y+ny*o},{x:B.x+nx*o,y:B.y+ny*o},ba,bb);
 const st=b.style||'plain';const s0=seg(0);if(!s0)return'';const[p,q]=s0;const L=Math.hypot(q.x-p.x,q.y-p.y);
 if(st==='wedge')return`<polygon points="${f2(p.x)},${f2(p.y)} ${f2(q.x+nx*WEDGEW)},${f2(q.y+ny*WEDGEW)} ${f2(q.x-nx*WEDGEW)},${f2(q.y-ny*WEDGEW)}" fill="#000" stroke="#000" stroke-width="0.4" stroke-linejoin="round"/>`;
 if(st==='hash'){const n=Math.max(3,Math.round(L/HSP));let s='';for(let k=0;k<=n;k++){const t=k/n;const cx=p.x+(q.x-p.x)*t,cy=p.y+(q.y-p.y)*t;const w=0.5+(WEDGEW-0.5)*t;s+=ln({x:cx+nx*w,y:cy+ny*w},{x:cx-nx*w,y:cy-ny*w},LW,' stroke-linecap="butt"');}return s;}
 if(st==='wavy'){const n=Math.max(2,Math.round(L/(BL*0.17)));const step=L/n;let d=`M${f2(p.x)} ${f2(p.y)}`;for(let k=1;k<=n;k++)d+=` A${f2(step/2)} ${f2(step/2)} 0 0 ${k%2} ${f2(p.x+ux*step*k)} ${f2(p.y+uy*step*k)}`;return`<path d="${d}" fill="none" stroke="#000" stroke-width="${LW}"/>`;}
 if(st==='bold')return ln(p,q,BOLDW,' stroke-linecap="butt"');
 if(st==='dash')return ln(p,q,LW,' stroke-dasharray="3 2.6" stroke-linecap="butt"');
 const ord=b.order||1;
 if(ord===1)return ln(p,q);
 if(ord===3){let s=ln(p,q);for(const o of[DSP,-DSP]){const sg=seg(o);if(sg)s+=ln(sg[0],sg[1]);}return s;}
 const side=dblSide(b,A,B,adj,amap,lab);
 if(!side){let s='';for(const o of[DSP/2,-DSP/2]){const sg=seg(o);if(sg)s+=ln(sg[0],sg[1]);}return s;}
 let s=ln(p,q);const sg=seg(side*DSP);if(sg){let[P,Q]=sg;const tr=BL*0.16;
  if(!la&&adj.get(A.id).length>1){P={x:P.x+ux*tr,y:P.y+uy*tr};}if(!lb&&adj.get(B.id).length>1){Q={x:Q.x-ux*tr,y:Q.y-uy*tr};}
  s+=ln(P,Q);}return s;}
function angDiff(a,b){let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d;}
function decoSVG(a,adjA,lay,amap){if(!a.charge&&!a.lp&&!a.rad)return{s:'',pts:[]};
 const occ=adjA.map(e=>{const o=amap.get(e.o);return Math.atan2(o.y-a.y,o.x-a.x);});
 if(lay&&lay.hSide)occ.push(lay.hSide==='left'?Math.PI:0);
 const pick=pref=>{let pm=Math.PI;for(const o of occ)pm=Math.min(pm,Math.abs(angDiff(pref,o)));if(pm>=Math.PI/3-1e-6){occ.push(pref);return pref;}let best=pref,bs=-9;for(let k=0;k<24;k++){const an=-Math.PI+k*Math.PI/12;let m=Math.PI;for(const o of occ)m=Math.min(m,Math.abs(angDiff(an,o)));const sc=m-0.18*Math.abs(angDiff(an,pref));if(sc>bs){bs=sc;best=an;}}occ.push(best);return best;};
 const rAt=(an,extra)=>{if(!lay)return BL*0.3+extra*0.4;const dx=Math.cos(an),dy=Math.sin(an);return exitT(a,dx,dy,lay.box)+extra;};
 let s='';const pts=[];
 if(a.charge){const q=a.charge;const txt=(Math.abs(q)>1?Math.abs(q):'')+(q>0?'+':'−');const an=pick(-Math.PI/4);const r=lay?rAt(an,FS*0.22):BL*0.42;
  const cx=a.x+Math.cos(an)*r,cy=a.y+Math.sin(an)*r;const fs=FS*0.82;s+=`<text x="${f2(cx)}" y="${f2(cy+fs*0.36)}" font-size="${f2(fs)}" text-anchor="middle">${txt}</text>`;pts.push([cx,cy,fs*0.5]);}
 for(let k=0;k<(a.lp||0);k++){const an=pick(-Math.PI/2);const r=rAt(an,4.2);const cx=a.x+Math.cos(an)*r,cy=a.y+Math.sin(an)*r;const px=-Math.sin(an)*3.1,py=Math.cos(an)*3.1;
  s+=`<circle cx="${f2(cx+px)}" cy="${f2(cy+py)}" r="1.65"/><circle cx="${f2(cx-px)}" cy="${f2(cy-py)}" r="1.65"/>`;pts.push([cx,cy,5]);}
 for(let k=0;k<(a.rad||0);k++){const an=pick(-Math.PI/2);const r=rAt(an,4.2);const cx=a.x+Math.cos(an)*r,cy=a.y+Math.sin(an)*r;s+=`<circle cx="${f2(cx)}" cy="${f2(cy)}" r="1.9"/>`;pts.push([cx,cy,3]);}
 return{s,pts};}
function head(tx,ty,ux,uy,half=0,L=9.5,W=3.6){const bx=tx-ux*L,by=ty-uy*L,nx=-uy,ny=ux,mx=tx-ux*L*0.75,my=ty-uy*L*0.75;
 if(!half)return`<polygon points="${f2(tx)},${f2(ty)} ${f2(bx+nx*W)},${f2(by+ny*W)} ${f2(mx)},${f2(my)} ${f2(bx-nx*W)},${f2(by-ny*W)}"/>`;
 return`<polygon points="${f2(tx)},${f2(ty)} ${f2(bx+nx*W*half*1.15)},${f2(by+ny*W*half*1.15)} ${f2(mx)},${f2(my)}"/>`;}
function qpt(r,t){const u=1-t;return{x:u*u*r.x1+2*u*t*r.cx+t*t*r.x2,y:u*u*r.y1+2*u*t*r.cy+t*t*r.y2};}
function brkGeo(r){const l=Math.min(r.x1,r.x2),rt=Math.max(r.x1,r.x2),t=Math.min(r.y1,r.y2),b=Math.max(r.y1,r.y2);return{l,r:rt,t,b,tk:Math.min(8,(b-t)*0.15)};}
function arrowPolys(r){if(r.kind==='curve2'||r.kind==='curve1'){const a=[];for(let i=0;i<=20;i++)a.push(qpt(r,i/20));return[a];}
 if(r.kind==='brk'||r.kind==='par'){const g=brkGeo(r);return[[{x:g.l+g.tk,y:g.t},{x:g.l,y:g.t},{x:g.l,y:g.b},{x:g.l+g.tk,y:g.b}],[{x:g.r-g.tk,y:g.t},{x:g.r,y:g.t},{x:g.r,y:g.b},{x:g.r-g.tk,y:g.b}]];}
 return[[{x:r.x1,y:r.y1},{x:r.x2,y:r.y2}]];}
function arrowPts(r){return arrowPolys(r).flat();}
function arrowSVG(r){const p1={x:r.x1,y:r.y1},p2={x:r.x2,y:r.y2};const dx=p2.x-p1.x,dy=p2.y-p1.y,L=Math.hypot(dx,dy)||1,ux=dx/L,uy=dy/L,nx=-uy,ny=ux;
 const lnb=(a,b)=>ln(a,b,LW,' stroke-linecap="butt"');
 switch(r.kind){
  case'rxn':return lnb(p1,{x:p2.x-ux*7,y:p2.y-uy*7})+head(p2.x,p2.y,ux,uy);
  case'res':return lnb({x:p1.x+ux*7,y:p1.y+uy*7},{x:p2.x-ux*7,y:p2.y-uy*7})+head(p2.x,p2.y,ux,uy)+head(p1.x,p1.y,-ux,-uy);
  case'eq':{const o=2.6;const a1={x:p1.x-nx*o,y:p1.y-ny*o},a2={x:p2.x-nx*o,y:p2.y-ny*o},b1={x:p2.x+nx*o,y:p2.y+ny*o},b2={x:p1.x+nx*o,y:p1.y+ny*o};
   return lnb(a1,{x:a2.x-ux*6,y:a2.y-uy*6})+head(a2.x,a2.y,ux,uy,-1)+lnb(b1,{x:b2.x+ux*6,y:b2.y+uy*6})+head(b2.x,b2.y,-ux,-uy,-1);}
  case'retro':{const o=2.6,e=8;let s='';for(const k of[-1,1])s+=lnb({x:p1.x+nx*o*k,y:p1.y+ny*o*k},{x:p2.x-ux*e+nx*o*k*0.2,y:p2.y-uy*e+ny*o*k*0.2});
   return s+`<polyline points="${f2(p2.x-ux*9+nx*7)},${f2(p2.y-uy*9+ny*7)} ${f2(p2.x)},${f2(p2.y)} ${f2(p2.x-ux*9-nx*7)},${f2(p2.y-uy*9-ny*7)}" fill="none" stroke="#000" stroke-width="${LW}"/>`;}
  case'brk':{const g=brkGeo(r);const pl=pts=>`<polyline points="${pts.map(p=>f2(p.x)+','+f2(p.y)).join(' ')}" fill="none" stroke="#000" stroke-width="${LW}"/>`;
   return pl([{x:g.l+g.tk,y:g.t},{x:g.l,y:g.t},{x:g.l,y:g.b},{x:g.l+g.tk,y:g.b}])+pl([{x:g.r-g.tk,y:g.t},{x:g.r,y:g.t},{x:g.r,y:g.b},{x:g.r-g.tk,y:g.b}]);}
  case'par':{const g=brkGeo(r);const k=Math.min(9,(g.b-g.t)*0.14),my=(g.t+g.b)/2;
   return`<path d="M${f2(g.l+k)} ${f2(g.t)}Q${f2(g.l-k*0.7)} ${f2(my)} ${f2(g.l+k)} ${f2(g.b)}M${f2(g.r-k)} ${f2(g.t)}Q${f2(g.r+k*0.7)} ${f2(my)} ${f2(g.r-k)} ${f2(g.b)}" fill="none" stroke="#000" stroke-width="${LW}"/>`;}
  default:{const cx=r.cx??(p1.x+p2.x)/2,cy=r.cy??(p1.y+p2.y)/2;const tx=p2.x-cx,ty=p2.y-cy,tl=Math.hypot(tx,ty)||1,tux=tx/tl,tuy=ty/tl;
   const e={x:p2.x-tux*5,y:p2.y-tuy*5};const c2={x:cx+(e.x-p2.x)*0.15,y:cy+(e.y-p2.y)*0.15};
   let half=0;if(r.kind==='curve1'){const tnx=-tuy,tny=tux;half=((cx-p2.x)*tnx+(cy-p2.y)*tny)>0?-1:1;}
   return`<path d="M${f2(p1.x)} ${f2(p1.y)} Q${f2(c2.x)} ${f2(c2.y)} ${f2(e.x)} ${f2(e.y)}" fill="none" stroke="#000" stroke-width="${LW}"/>`+head(p2.x,p2.y,tux,tuy,half,8.5,3.3);}
 }}
function chemSVG(str,x,y,size=1,align='center'){const fs=size*FS,lh=fs*1.22;const lines=chemRuns(str).map(runs=>{let w=0;const items=runs.map(r=>{const sz=r.k==='n'?fs:fs*0.7;const ww=tw(r.t,sz,r.i,r.b);const o={...r,x:w,sz,w:ww};w+=ww;return o;});return{items,w};});
 const maxW=Math.max(0,...lines.map(l=>l.w));let s='';
 lines.forEach((l,li)=>{const bx=align==='center'?x-l.w/2:align==='right'?x-l.w:x;const base=y+fs*0.36+li*lh;
  for(const it of l.items){const dy=it.k==='sub'?fs*0.22:it.k==='sup'?-fs*0.36:0;s+=`<text x="${f2(bx+it.x)}" y="${f2(base+dy)}" font-size="${f2(it.sz)}"${it.i?' font-style="italic"':''}${it.b?' font-weight="bold"':''}>${esc(it.t.replace(/ /g,'\u00a0'))}</text>`;}});
 const bx0=align==='center'?x-maxW/2:align==='right'?x-maxW:x;return{s,box:{x1:bx0,y1:y-fs*0.56,x2:bx0+maxW,y2:y+fs*0.56+(lines.length-1)*lh}};}
function BBox(){let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;return{add(x,y,r=0){x1=Math.min(x1,x-r);y1=Math.min(y1,y-r);x2=Math.max(x2,x+r);y2=Math.max(y2,y+r);},addBox(b){this.add(b.x1,b.y1);this.add(b.x2,b.y2);},get(){return x2<x1?null:{x1,y1,x2,y2};}};}
function renderDrawing(d){const{amap,adj}=analyze(d);const bb=BBox();const lab=new Map();const out=[];
 for(const a of d.atoms){const L=atomLabel(a,adj.get(a.id),amap);if(L){const lay=layoutLabel(a,L);lab.set(a.id,lay);bb.addBox(lay.box);}else bb.add(a.x,a.y,LW);}
 for(const b of d.bonds){const A=amap.get(b.a),B=amap.get(b.b);if(A&&B)out.push(bondSVG(b,A,B,lab,adj,amap));}
 for(const[,lay]of lab)out.push(lay.svg);
 for(const a of d.atoms){const r=decoSVG(a,adj.get(a.id),lab.get(a.id),amap);out.push(r.s);for(const p of r.pts)bb.add(p[0],p[1],p[2]);}
 for(const r of d.arrows){out.push(arrowSVG(r));for(const p of arrowPts(r))bb.add(p.x,p.y,5);}
 const tboxes={};for(const t of d.texts){const o=chemSVG(t.text,t.x,t.y,t.size||1,t.align||'center');out.push(o.s);tboxes[t.id]=o.box;bb.addBox(o.box);}
 return{svg:out.join(''),bbox:bb.get(),lab,tboxes,amap,adj};}
function isEmpty(d){return!d||(!d.atoms.length&&!d.arrows.length&&!d.texts.length);}
function drawingSVG(d,scale=1,pad=8){const R=renderDrawing(d);const b=R.bbox||{x1:0,y1:0,x2:60,y2:30};const x=b.x1-pad,y=b.y1-pad,w=b.x2-b.x1+2*pad,h=b.y2-b.y1+2*pad;
 return{svg:`<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="${f2(x)} ${f2(y)} ${f2(w)} ${f2(h)}" width="${f2(w*scale)}" height="${f2(h*scale)}"><rect x="${f2(x)}" y="${f2(y)}" width="${f2(w)}" height="${f2(h)}" fill="#fff"/><g font-family="Arial, Helvetica, sans-serif" fill="#000" style="white-space:pre">${R.svg}</g></svg>`,w,h};}
const svgURL=s=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(s);
function svgToPNG(svg,w,h){return new Promise((res,rej)=>{const img=new Image();img.onload=()=>{const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);g.drawImage(img,0,0,c.width,c.height);c.toBlob(b=>b?res({blob:b,url:c.toDataURL('image/png')}):rej(new Error('PNG failed')),'image/png');};img.onerror=()=>rej(new Error('Image failed'));img.src=svgURL(svg);});}
function fragFormula(ids,R,d){const c={};let charge=0,unknown=false;for(const id of ids){const a=R.amap.get(id);if(!a)continue;const t=a.t||'C';
  if(AW[t]){addC(c,{[t]:1});const h=hCount(a,R.adj.get(id));if(h)addC(c,{H:h});}else if(ABBR[t])addC(c,parseFormula(ABBR[t].f));else{const p=parseFormula(t);if(p)addC(c,p);else unknown=true;}charge+=a.charge||0;}
 return{c,charge,unknown};}
function fragments(R,d){const seen=new Set(),out=[];for(const a of d.atoms){if(seen.has(a.id))continue;const comp=[];const st=[a.id];seen.add(a.id);while(st.length){const u=st.pop();comp.push(u);for(const e of R.adj.get(u)||[])if(!seen.has(e.o)){seen.add(e.o);st.push(e.o);}}out.push(comp);}return out;}

/* ================= example content ================= */
function DB(){const d=newDrawing();const g={d,
 A(x,y,t='C',o={}){const a={id:nid(d),x:x*BL,y:y*BL,t,charge:0,lp:0,rad:0,...o};d.atoms.push(a);return a.id;},
 Bd(a,b,order=1,style='plain'){d.bonds.push({id:nid(d),a,b,order,style});},
 Ar(kind,x1,y1,x2,y2,cx,cy){const r={id:nid(d),kind,x1:x1*BL,y1:y1*BL,x2:x2*BL,y2:y2*BL};if(cx!=null){r.cx=cx*BL;r.cy=cy*BL;}d.arrows.push(r);},
 T(x,y,text,o={}){d.texts.push({id:nid(d),x:x*BL,y:y*BL,text,size:o.size||1,align:o.align||'center'});}};return g;}
function hexagon(g,cx,cy,dbl=[]){const ids=[];for(let k=0;k<6;k++){const an=(-90+60*k)*Math.PI/180;ids.push(g.A(cx+Math.cos(an),cy+Math.sin(an)));}for(let k=0;k<6;k++)g.Bd(ids[k],ids[(k+1)%6],dbl.includes(k)?2:1);return ids;}
function fE(g,ox,oy){const a=g.A(ox,oy+.25),b=g.A(ox+.866,oy-.25),c=g.A(ox+1.732,oy+.25),e=g.A(ox+2.598,oy-.25);g.Bd(a,b);g.Bd(b,c,2);g.Bd(c,e);}
function fZ(g,ox,oy){const b=g.A(ox+.5,oy-.4),c=g.A(ox+1.5,oy-.4),a=g.A(ox,oy+.466),e=g.A(ox+2,oy+.466);g.Bd(a,b);g.Bd(b,c,2);g.Bd(c,e);}
function fCCl2(g,x,y){const c=g.A(x,y,'C',{showC:true,lp:1});g.Bd(c,g.A(x-.866,y+.5,'Cl'));g.Bd(c,g.A(x+.866,y+.5,'Cl'));return c;}
function fCyp(g,cx,cy,cl,left,right){const l=g.A(cx-.5,cy+.3),r=g.A(cx+.5,cy+.3),t=g.A(cx,cy-.566);g.Bd(l,r);g.Bd(r,t);g.Bd(t,l);
 if(cl){g.Bd(t,g.A(cx-.866,cy-1.066,'Cl'));g.Bd(t,g.A(cx+.866,cy-1.066,'Cl'));}g.Bd(l,g.A(cx-1.366,cy+.8),1,left);g.Bd(r,g.A(cx+1.366,cy+.8),1,right);}
function fNorcarane(g,cx,cy){const h=hexagon(g,cx,cy);const ap=g.A(cx+1.732,cy);g.Bd(h[1],ap);g.Bd(h[2],ap);g.Bd(ap,g.A(cx+2.232,cy-.866,'Cl'));g.Bd(ap,g.A(cx+2.232,cy+.866,'Cl'));}
function exScheme(){const g=DB();hexagon(g,.9,0,[1]);g.Ar('rxn',2.4,0,7.9,0);g.T(5.15,-.62,'CHCl3, 50% aq. NaOH',{size:.8});g.T(5.15,.62,'BnEt3N^+Cl^− (cat.)',{size:.8});g.T(5.15,1.32,'rt, 1 h',{size:.8});
 fNorcarane(g,9.5,0);g.T(.9,1.75,'cyclohexene',{size:.75});g.T(10.3,1.75,'7,7-dichlorobicyclo[4.1.0]heptane',{size:.75});return g.d;}
function exMech(){const g=DB();
 const o=g.A(-1.0,0,'O',{charge:-1,hLeft:true});g.T(.2,0,'+');const h=g.A(1.2,0,'H');const c=g.A(2.2,0,'C',{showC:true});g.Bd(h,c);
 g.Bd(c,g.A(2.7,-.866,'Cl'));g.Bd(c,g.A(2.7,.866,'Cl'));g.Bd(c,g.A(3.2,0,'Cl'));
 g.Ar('curve2',-1.05,-.52,1.12,-.42,.05,-1.65);g.Ar('curve2',1.7,.14,2.18,.42,1.85,.85);
 g.Ar('rxn',4.0,0,5.8,0);g.T(4.9,-.5,'Q^+ (PTC)',{size:.7});
 const c2=g.A(7.3,0,'C',{showC:true,charge:-1,lp:1});g.Bd(c2,g.A(6.8,-.866,'Cl'));g.Bd(c2,g.A(6.8,.866,'Cl'));g.Bd(c2,g.A(8.3,0,'Cl'));
 g.T(9.05,0,'+');g.A(10.55,0,'O',{hLeft:true});
 const c3=g.A(.8,3.4,'C',{showC:true,charge:-1,lp:1});g.Bd(c3,g.A(.3,2.534,'Cl'));g.Bd(c3,g.A(.3,4.266,'Cl'));g.Bd(c3,g.A(1.8,3.4,'Cl'));
 g.Ar('curve2',1.28,3.3,1.72,3.0,1.45,2.7);g.Ar('rxn',2.8,3.4,4.6,3.4);fCCl2(g,6.0,3.25);g.T(7.5,3.4,'+');g.A(8.2,3.4,'Cl',{charge:-1});
 hexagon(g,.6,7.4,[1]);{const cc=g.A(3.2,7.4,'C',{showC:true,lp:1});g.Bd(cc,g.A(3.7,6.534,'Cl'));g.Bd(cc,g.A(3.7,8.266,'Cl'));}
 g.Ar('curve2',1.58,7.15,2.98,7.12,2.2,6.4);g.Ar('curve2',2.7,7.58,1.6,7.85,2.25,8.35);
 g.Ar('rxn',4.6,7.4,6.5,7.4);g.T(5.55,6.88,'concerted, *syn*',{size:.65});fNorcarane(g,8.0,7.4);
 g.T(-1.9,-1.5,'1  deprotonation',{size:.7,align:'left'});g.T(-1.9,1.75,'2  α-elimination',{size:.7,align:'left'});g.T(-1.9,5.6,'3  cyclopropanation',{size:.7,align:'left'});
 return g.d;}
function q1a(){const g=DB();fE(g,0,0);g.T(3.25,.05,'+');fCCl2(g,4.8,-.15);g.Ar('rxn',6.4,0,8.7,0);g.T(7.55,-.45,'singlet',{size:.65});g.T(7.55,.45,'concerted',{size:.65});
 fCyp(g,10.6,0,true,'wedge','hash');g.T(12.75,.25,'+');fCyp(g,14.9,0,true,'hash','wedge');
 g.T(10.6,1.65,'(2*R*,3*R*)',{size:.8});g.T(14.9,1.65,'(2*S*,3*S*)',{size:.8});g.T(12.75,2.45,'*trans*, racemic (1 : 1)',{size:.8});return g.d;}
function q1b(){const g=DB();fZ(g,0,0);g.T(2.75,.05,'+');fCCl2(g,4.3,-.15);g.Ar('rxn',5.9,0,8.2,0);g.T(7.05,-.45,'singlet',{size:.65});g.T(7.05,.45,'concerted',{size:.65});
 fCyp(g,10.1,0,true,'wedge','wedge');g.T(10.1,1.65,'*cis*, meso (2*R*,3*S*)',{size:.8});g.T(10.1,2.45,'achiral: internal mirror plane',{size:.8});return g.d;}
function q2(z){const g=DB();if(z)fZ(g,0,0);else fE(g,0,0);const px=z?2.75:3.25;g.T(px,.05,'+');g.A(px+1.05,0,'C',{showC:true,rad:2});
 g.Ar('rxn',px+2.5,0,px+4.6,0);g.T(px+3.55,-.45,'triplet',{size:.65});g.T(px+3.55,.45,'stepwise',{size:.65});const o=px+6.5-9.3;
 fCyp(g,9.3+o,0,false,'wedge','wedge');g.T(11.25+o,.25,'+');fCyp(g,13.2+o,0,false,'hash','wedge');g.T(15.25+o,.25,'+');fCyp(g,17.2+o,0,false,'wedge','hash');
 g.T(9.3+o,1.45,'*cis* (meso)',{size:.8});g.T(13.2+o,1.45,'(1*R*,2*R*)',{size:.8});g.T(17.2+o,1.45,'(1*S*,2*S*)',{size:.8});g.T(15.2+o,2.25,'*trans*, racemic',{size:.8});return g.d;}
function todayISO(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function uid(){return Math.random().toString(36).slice(2,9);}
function mkRow(o){const r={id:uid(),name:'',role:'reagent',limiting:false,formula:'',mw:'',d:'',wt:'',basis:'mass',inp:{},stoich:1,...o};const c=parseFormula(r.formula);if(c&&r.mw===''){r.mw=f2(massOf(c));}return r;}
function exampleState(){return{v:1,
 meta:{title:'Carbene Experiment',name:'',sid:'',course:'',date:todayISO(),instructor:'',partner:''},
 inc:{scheme:true,table:true,mech:true,questions:true,spectra:false,prelab:true,refs:true},
 scheme:{drawing:exScheme(),caption:'Dichlorocarbene addition to cyclohexene under phase-transfer conditions.'},
 table:{rows:[mkRow({name:'Cyclohexene',role:'reactant',limiting:true,formula:'C6H10',d:0.811,basis:'vol',inp:{vol:'1.00'}}),
  mkRow({name:'Chloroform',formula:'CHCl3',d:1.489,basis:'vol',inp:{vol:'3.0'}}),
  mkRow({name:'50% aq. NaOH',formula:'NaOH',d:1.52,wt:50,basis:'vol',inp:{vol:'4.0'}}),
  mkRow({name:'BnEt3N^+Cl^−',role:'catalyst',formula:'C13H22ClN',basis:'mass',inp:{mass:'0.100'}}),
  mkRow({name:'7,7-Dichlorobicyclo[4.1.0]heptane',role:'product',formula:'C7H10Cl2',inp:{}})]},
 mech:{drawing:exMech(),notes:'**Step 1, deprotonation.** The phase-transfer catalyst (Q^+ = BnEt3N^+) carries HO^− into the organic layer, where it removes the acidic proton of CHCl3 to give the trichloromethyl anion Cl3C^−.\n\n**Step 2, α-elimination.** Cl3C^− loses chloride to give dichlorocarbene, :CCl2, which is a singlet.\n\n**Step 3, cyclopropanation.** :CCl2 adds to the C=C bond of cyclohexene in one concerted *syn* step: the π electrons attack the empty p orbital of the carbene while its lone pair forms the second C–C bond. The *cis* ring fusion of the product comes directly from the *cis* alkene.'},
 questions:[{id:uid(),title:'Question 1',figPos:'before',
  q:'Predict the stereochemical outcome for the addition of singlet and triplet carbenes to alkenes.\n1. Singlet dichlorocarbene (:CCl2) adding to (a) (*E*)-2-butene and (b) (*Z*)-2-butene.\n2. Triplet carbene (·CH2·) adding to (a) (*E*)-2-butene and (b) (*Z*)-2-butene.\n(a) Draw all possible stereoisomeric products using wedge–dash notation. (b) Classify each reaction as stereospecific, stereoselective or non-stereoselective. (c) State whether each product or product mixture is optically active or inactive. (d) Briefly explain the stereochemical difference between :CCl2 and CH2 additions.',
  a:'**(a) Products** (drawn above in wedge–dash notation)\n- 1(a) Singlet :CCl2 + (*E*)-2-butene gives only *trans*-1,1-dichloro-2,3-dimethylcyclopropane, as a 1 : 1 pair of enantiomers, (2*R*,3*R*) and (2*S*,3*S*).\n- 1(b) Singlet :CCl2 + (*Z*)-2-butene gives only *cis*-1,1-dichloro-2,3-dimethylcyclopropane, the meso compound (2*R*,3*S*).\n- 2(a) and 2(b) Triplet ·CH2· + either alkene gives a mixture of *cis*-1,2-dimethylcyclopropane (meso) and *trans*-1,2-dimethylcyclopropane (racemic, (1*R*,2*R*) + (1*S*,2*S*)). Both alkenes give the same mixture.\n\n**(b) Classification**\n- Singlet additions are **stereospecific**: the two stereoisomeric alkenes give stereoisomerically different products and the alkene geometry is retained (*syn* addition). A stereospecific reaction is also stereoselective.\n- Triplet additions are **non-stereoselective (non-stereospecific)**: (*E*)- and (*Z*)-2-butene give the same *cis*/*trans* mixture, so the starting geometry is lost.\n\n**(c) Optical activity.** Every product or mixture is optically inactive.\n- 1(a): each enantiomer is chiral, but they form in equal amounts (racemate), so their rotations cancel.\n- 1(b): the meso product has an internal mirror plane and is achiral.\n- 2(a), 2(b): the *cis* isomer is meso (achiral) and the *trans* isomer forms as a racemate.\nAchiral starting materials with no chiral reagent, catalyst or solvent cannot give an excess of one enantiomer.\n\n**(d) Why the two carbenes differ**\nSinglet :CCl2 has both nonbonding electrons paired in one sp2 orbital and an empty p orbital; π-donation from the chlorine lone pairs into that p orbital makes the singlet its ground state. It accepts the alkene π electrons and donates its lone pair at the same time, so both C–C bonds form in one concerted step. There is no intermediate and no time for bond rotation, so the alkene geometry is carried into the cyclopropane.\nTriplet CH2 has two unpaired electrons with parallel spins. It forms one C–C bond first, giving a triplet 1,3-diradical. The ring cannot close until one electron inverts its spin (intersystem crossing), which is slow compared with rotation about the former C=C bond, now a single bond. Rotation scrambles the geometry, so both *cis* and *trans* cyclopropanes form. This difference is the basis of the Skell–Woodworth rule [1, 2].',
  figs:[{drawing:q1a(),caption:'1(a) Singlet :CCl2 + (*E*)-2-butene'},{drawing:q1b(),caption:'1(b) Singlet :CCl2 + (*Z*)-2-butene'},{drawing:q2(false),caption:'2(a) Triplet ·CH2· + (*E*)-2-butene'},{drawing:q2(true),caption:'2(b) Triplet ·CH2· + (*Z*)-2-butene'}]},
  {id:uid(),title:'Added question (course page)',figPos:'after',q:'',a:'',figs:[]}],
 spectra:{rows:[{id:uid(),tech:'IR',val:'',assign:'',note:''}],figs:[]},
 prelab:{steps:['In a round-bottom flask with a stir bar, combine cyclohexene, chloroform and the phase-transfer catalyst (BnEt3N^+Cl^−).','Add 50% aqueous NaOH and stir vigorously so the two layers mix well.','Stir at room temperature for the stated time; the mixture warms as the carbene forms.','Dilute with water, transfer to a separatory funnel and separate the organic layer.','Extract the aqueous layer with CH2Cl2; combine the organic layers and wash with water.','Dry over anhydrous MgSO4, filter and remove the solvent on the rotary evaporator.','Weigh the product, calculate the % yield and record the IR spectrum.'],figs:[]},
 refs:['Skell, P. S.; Woodworth, R. C. Structure of Carbene, CH2. *J. Am. Chem. Soc.* **1956**, *78*, 4496–4497.','Doering, W. von E.; Hoffmann, A. K. The Addition of Dichlorocarbene to Olefins. *J. Am. Chem. Soc.* **1954**, *76*, 6162–6165.','Makosza, M.; Wawrzyniewicz, M. Reactions of Organic Anions. XXIV. Catalytic Method for Preparation of Dichlorocyclopropane Derivatives in Aqueous Medium. *Tetrahedron Lett.* **1969**, *10*, 4659–4662.','Clayden, J.; Greeves, N.; Warren, S. *Organic Chemistry*, 2nd ed.; Oxford University Press: Oxford, 2012.'],
 example:true};}
function blankState(){return{v:1,meta:{title:'',name:'',sid:'',course:'',date:todayISO(),instructor:'',partner:''},inc:{scheme:true,table:true,mech:true,questions:true,spectra:false,prelab:true,refs:true},
 scheme:{drawing:newDrawing(),caption:''},table:{rows:[mkRow({role:'reactant',limiting:true}),mkRow({})]},mech:{drawing:newDrawing(),notes:''},
 questions:[{id:uid(),title:'Question 1',figPos:'after',q:'',a:'',figs:[]}],spectra:{rows:[{id:uid(),tech:'IR',val:'',assign:'',note:''}],figs:[]},prelab:{steps:[''],figs:[]},refs:[''],example:false};}

