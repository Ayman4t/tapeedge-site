(()=>{
const $=id=>document.getElementById(id);
const cv=$('cv'),ctx=cv.getContext('2d');
let W=0,H=0,dpr=1,cx=0,cy=0,R=0,anchorY=0,target=0;
const TH=14; // tension threshold
const S={phase:'idle',rot:0,vel:0,seamA:0,curl:0,len:0,tension:0,tip:{x:0,y:0},down:false,t0:0,final:0,lastAng:0,prevD:null,flick:null,last:null,v:0,fx:null,silent:0,muted:false,me:0,bot:0,round:false};
const wrap=a=>((a+540)%360)-180;
function resize(){const r=cv.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
  R=Math.min(W*0.3,125);cx=W/2;cy=H-R-52;anchorY=cy-R;target=Math.max(120,anchorY-70);S.tip={x:cx,y:anchorY};}
addEventListener('resize',resize);

/* ---------- audio ---------- */
let AC=null,NB=null;
function audio(){if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();NB=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=NB.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(AC.state==='suspended')AC.resume();return AC}
const ok=()=>!S.muted&&performance.now()>S.silent;
function noise(type,f,q,g,dur){if(!ok())return;const a=audio(),n=a.createBufferSource();n.buffer=NB;n.loopStart=0;const fl=a.createBiquadFilter();fl.type=type;fl.frequency.value=f;fl.Q.value=q;const gn=a.createGain();gn.gain.setValueAtTime(g,a.currentTime);gn.gain.exponentialRampToValueAtTime(0.0005,a.currentTime+dur);n.connect(fl);fl.connect(gn);gn.connect(a.destination);n.start(0,Math.random()*0.8,dur+0.01);}
function tone(type,f0,f1,g,dur){if(!ok())return;const a=audio(),o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f0,a.currentTime);o.frequency.exponentialRampToValueAtTime(f1,a.currentTime+dur);gn.gain.setValueAtTime(g,a.currentTime);gn.gain.exponentialRampToValueAtTime(0.0005,a.currentTime+dur);o.connect(gn);gn.connect(a.destination);o.start();o.stop(a.currentTime+dur+0.02);}
const sScratch=()=>noise('bandpass',3200,8,0.22,0.025);
const sBump=()=>{tone('sine',120,60,0.7,0.09);noise('lowpass',300,1,0.3,0.05)};
function sPeel(v){const g=Math.min(0.28,0.05+v*0.06);noise('highpass',2500+Math.random()*3500,2,g,0.035);if(Math.random()<.5)tone('triangle',1800+Math.random()*2500,900,g*.5,0.03)}
function sSnap(){noise('bandpass',4000,2,0.9,0.05);tone('sawtooth',3200,100,0.35,0.08);S.silent=performance.now()+700}
function sCut(){noise('highpass',5000,3,0.5,0.04);setTimeout(()=>{noise('bandpass',2600,6,0.5,0.06);tone('square',3400,2400,0.12,0.05)},90)}
const vib=p=>{try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}};

/* ---------- opponent (simulated ghost) ---------- */
const OS=['بيخربش…','لقى الطرف 🎯','بيسحب…','اتقطع! ✂️💥'];
let bt=[],bp=0;
function oSet(i,p){$('oState').textContent=OS[i];$('oFill').style.width=p+'%';$('oFill').classList.toggle('snap',i===3)}
const later=(f,ms)=>bt.push(setTimeout(f,ms));
function botStart(){botStop();oSet(0,8);later(()=>{oSet(1,35);later(()=>{oSet(2,40);botPeel(0)},1200+Math.random()*1000)},2500+Math.random()*3500)}
function botPeel(p){if(S.phase==='won'||S.phase==='lost')return;p+=6+Math.random()*7;const snapChance=p>25&&Math.random()<0.1;
  if(snapChance){oSet(3,Math.min(p,95));toast('الخصم قطّع الشريط! ✂️💥 معاك الأفضلية');flash();later(botStart,2200);return}
  if(p>=100){oSet(2,100);botWin();return}oSet(2,40+p*0.6);later(()=>botPeel(p),350+Math.random()*350)}
function botStop(){bt.forEach(clearTimeout);bt=[]}
function botWin(){if(S.phase==='won')return;S.phase='lost';S.bot++;score();finish(false)}

/* ---------- game flow ---------- */
function score(){$('score').textContent=`أنت ${S.me} : ${S.bot} الخصم`}
function hint(t,c){const h=$('hint');h.textContent=t;h.style.color=c||'var(--dim)'}
function toast(t){const e=$('toast');e.textContent=t;e.style.opacity=1;clearTimeout(toast.t);toast.t=setTimeout(()=>e.style.opacity=0,2200)}
function flash(){const f=$('flash');f.style.transition='none';f.style.opacity=.35;requestAnimationFrame(()=>{f.style.transition='opacity .5s';f.style.opacity=0})}
function newRound(){S.phase='search';S.rot=0;S.vel=0;S.curl=0;S.len=0;S.tension=0;S.prevD=null;S.flick=null;S.fx=null;S.t0=0;S.seamA=-90-wrap(30+Math.random()*300);
  S.tip={x:cx,y:anchorY};$('ov').classList.remove('on');hint('لف البكرة بصباعك ودوّر على الطرف المخفي 🔍');botStart()}
function respawn(){ // after tear: same round, new seam
  S.phase='search';S.curl=0;S.len=0;S.tension=0;S.prevD=null;S.flick=null;S.seamA=-90-wrap(30+Math.random()*300)-S.rot;S.tip={x:cx,y:anchorY};hint('اتقطع! دوّر على طرف جديد 🔍','var(--bad)')}
function finish(win){const t=(S.final/1000).toFixed(2);botStop();
  $('oT').textContent=win?'قصّة نضيفة يا معلم! ✂️🎉':'الخصم خلّص قبلك ⏱️';
  $('oP').textContent=win?`سحبت 10 سم مستقيمة في ${t} ثانية.`:'سبقك بشريط نضيف. الجولة الجاية: اسحب بهدوء وعلى الخط المستقيم.';
  $('go').textContent='جولة جديدة';$('ov').classList.add('on')}

/* ---------- input ---------- */
const pos=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
const ang=p=>Math.atan2(p.y-cy,p.x-cx)*180/Math.PI;
const nearAnchor=(p,r)=>Math.hypot(p.x-cx,p.y-anchorY)<r;
cv.addEventListener('pointerdown',e=>{if(S.phase==='won'||S.phase==='lost'||S.phase==='idle')return;audio();cv.setPointerCapture(e.pointerId);const p=pos(e);S.down=true;if(!S.t0)S.t0=performance.now();S.last={x:p.x,y:p.y,t:performance.now()};
  if(S.phase==='search')S.lastAng=ang(p);
  else if(S.phase==='found'&&nearAnchor(p,90))S.flick={y:p.y,t:performance.now()};
  else if(S.phase==='lifted'&&nearAnchor(p,80)){S.phase='peel';S.tension=0;S.v=0;hint('اسحب مستقيم لفوق! 🎯','var(--ok)')}});
cv.addEventListener('pointermove',e=>{if(!S.down)return;const p=pos(e),now=performance.now();
  if(S.phase==='search'){const a=ang(p),da=wrap(a-S.lastAng);S.lastAng=a;S.rot+=da;S.vel=da;
    if(Math.abs(da)>0.3){const k=Math.floor(S.rot/9);if(k!==S.k){S.k=k;sScratch();vib(5)}}}
  else if(S.phase==='found'&&S.flick){if(S.flick.y-p.y>34&&now-S.flick.t<420){S.phase='lifted';vib([25,15,35]);sBump();hint('الطرف اتفك! اضغط عليه واسحب لفوق 👆','var(--amber)');S.flick=null}
    else if(now-S.flick.t>420)S.flick={y:p.y,t:now}}
  else if(S.phase==='peel'){peelMove(p,now)}
  S.last={x:p.x,y:p.y,t:now}});
const up=()=>{S.down=false;if(S.phase==='peel'){S.phase='lifted';S.len=0;S.tip={x:cx,y:anchorY};S.tension=0;hint('سيبته! ارجع اضغط على الطرف واسحب من جديد','var(--amber)')}S.flick=null};
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);

function peelMove(p,now){const dx=p.x-cx,dy=p.y-anchorY;if(dy>=-2){S.len=0;S.tip={x:cx,y:anchorY};return}
  const len=Math.hypot(dx,dy),dev=Math.abs(Math.atan2(dx,-dy)*180/Math.PI);
  const dt=Math.max(1,now-S.last.t),v=Math.hypot(p.x-S.last.x,p.y-S.last.y)/dt;S.v=S.v*0.6+v*0.4;
  const raw=len>22?S.v*10*0.6+Math.max(0,dev-12)*1.4:0; // Tension = speed*0.6 + angleDelta*1.4
  S.tension=S.tension*0.75+raw*0.25;S.tip={x:p.x,y:p.y};
  if(len>S.len){S.len=len;sPeel(S.v);vib(4)}
  if(S.tension>TH){rip(dev);return}
  if(S.len>=target){S.len=target;S.final=now-S.t0;S.phase='won';S.me++;score();botStop();sCut();vib([40,40,100]);finish(true)}}
function rip(dev){sSnap();vib([80,40,120]);flash();S.fx={t:performance.now(),a:Math.atan2(S.tip.x-cx,-(S.tip.y-anchorY)),len:S.len,tip:{...S.tip}};S.phase='ripped';S.down=false;
  toast('اتشرمطت منك بميل! ✂️🤦‍♂️');setTimeout(()=>{if(S.phase==='ripped')respawn()},1100)}

/* ---------- render ---------- */
function draw(now){
  ctx.clearRect(0,0,W,H);
  let g=ctx.createRadialGradient(cx,cy-40,10,cx,cy-40,Math.max(W,H)*0.8);g.addColorStop(0,'#2a2a30');g.addColorStop(.5,'#141417');g.addColorStop(1,'#09090b');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // inertia
  if(!S.down&&S.phase==='search'){S.rot+=S.vel;S.vel*=0.95;if(Math.abs(S.vel)<0.02)S.vel=0}
  if(S.phase==='found'||S.phase==='lifted'){const d=wrap(S.seamA+S.rot+90);S.rot-=d*0.2}
  // seam crossing detection
  if(S.phase==='search'&&S.down){const d=wrap(S.seamA+S.rot+90);if(S.prevD!==null&&Math.abs(d)+Math.abs(S.prevD)<26&&(d===0||Math.sign(d)!==Math.sign(S.prevD)||Math.abs(d)<3)){S.phase='found';S.flick=null;vib([25,15,35]);sBump();hint('لقيته! اعمل فلكة ظفر لفوق من الطرف 🎯','var(--ok)')}S.prevD=d}
  // shadow
  ctx.save();ctx.shadowColor='rgba(0,0,0,.85)';ctx.shadowBlur=40;ctx.shadowOffsetY=22;ctx.fillStyle='#3a2c10';ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();ctx.restore();
  // tape body
  g=ctx.createRadialGradient(cx,cy,R*0.45,cx,cy,R);g.addColorStop(0,'rgba(210,170,70,.55)');g.addColorStop(.8,'rgba(240,205,110,.38)');g.addColorStop(1,'rgba(255,240,170,.55)');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.05)';ctx.lineWidth=1;for(let r=R*0.5;r<R;r+=3.5){ctx.beginPath();ctx.arc(cx,cy,r,0,7);ctx.stroke()}
  // rotating gloss
  if(ctx.createConicGradient){const a0=S.rot*Math.PI/180;const cg=ctx.createConicGradient(a0,cx,cy);cg.addColorStop(0,'rgba(255,255,255,0)');cg.addColorStop(.03,'rgba(255,255,255,.35)');cg.addColorStop(.07,'rgba(255,255,255,0)');cg.addColorStop(.5,'rgba(255,255,255,0)');cg.addColorStop(.54,'rgba(255,255,255,.2)');cg.addColorStop(.6,'rgba(255,255,255,0)');cg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.arc(cx,cy,R*0.46,0,7,true);ctx.fill('evenodd')}
  ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,R,0,7);ctx.stroke();
  // core
  g=ctx.createRadialGradient(cx-8,cy-8,4,cx,cy,R*0.46);g.addColorStop(0,'#d4a373');g.addColorStop(1,'#a47148');ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,R*0.46,0,7);ctx.fill();
  ctx.fillStyle='#09090b';ctx.beginPath();ctx.arc(cx,cy,R*0.3,0,7);ctx.fill();
  // seam
  const sa=(S.seamA+S.rot)*Math.PI/180,d=Math.abs(wrap(S.seamA+S.rot+90));let glow=Math.max(0,1-d/16);if(S.phase==='found'||S.phase==='lifted')glow=1;
  if(S.phase!=='peel'&&S.phase!=='ripped'){ctx.strokeStyle=`rgba(255,255,255,${0.14+0.8*glow})`;ctx.lineWidth=glow>0.5?2.2:0.8;if(glow>.5){ctx.shadowColor='#fde047';ctx.shadowBlur=14}
    ctx.beginPath();ctx.moveTo(cx+Math.cos(sa)*R*0.9,cy+Math.sin(sa)*R*0.9);ctx.lineTo(cx+Math.cos(sa)*R,cy+Math.sin(sa)*R);ctx.stroke();ctx.shadowBlur=0}
  // nail zone marker
  if(S.phase==='search'||S.phase==='found'){ctx.strokeStyle='rgba(251,191,36,.45)';ctx.setLineDash([3,4]);ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(cx,anchorY-2,16,0,7);ctx.stroke();ctx.setLineDash([])}
  // lifted tab
  if(S.phase==='found'||S.phase==='lifted'||S.phase==='peel'||S.phase==='ripped'){const cr=S.phase==='lifted'?1:0;S.curl+=(cr-S.curl)*0.2}
  const ww=R*0.62;
  if(S.phase==='lifted'){const c=S.curl*34;ctx.fillStyle='rgba(255,240,170,.4)';ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(cx-ww/2,anchorY);ctx.quadraticCurveTo(cx-ww/2,anchorY-c,cx-ww/2+10,anchorY-c*1.15);ctx.lineTo(cx+ww/2-10,anchorY-c*1.15);ctx.quadraticCurveTo(cx+ww/2,anchorY-c,cx+ww/2,anchorY);ctx.closePath();ctx.fill();ctx.stroke()}
  // ruler + cut line
  if(S.phase==='peel'||S.phase==='lifted'){ctx.strokeStyle='rgba(255,255,255,.18)';ctx.fillStyle='rgba(255,255,255,.4)';ctx.font='10px Cairo, sans-serif';ctx.lineWidth=1;
    for(let i=1;i<=10;i++){const y=anchorY-target*i/10;ctx.beginPath();ctx.moveTo(cx-ww/2-14,y);ctx.lineTo(cx-ww/2-4,y);ctx.stroke();if(i%5===0)ctx.fillText(i,cx-ww/2-30,y+3)}
    const cyl=anchorY-target;ctx.strokeStyle='#ef4444';ctx.setLineDash([6,5]);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-ww/2-18,cyl);ctx.lineTo(cx+ww/2+18,cyl);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#f87171';ctx.textAlign='center';ctx.fillText('✂ خط القص · 10 سم',cx,cyl-7);ctx.textAlign='start'}
  // strip
  if(S.phase==='peel'&&S.len>1)strip(cx,anchorY,S.tip.x,S.tip.y,ww,1);
  if(S.fx){const t=(now-S.fx.t)/1000;if(t<1.1){const f=S.fx,tx=f.tip.x+Math.sin(f.a)*t*30,ty=f.tip.y+t*t*140;ctx.globalAlpha=Math.max(0,1-t);
      // sliver: razor thin diagonal triangle
      ctx.fillStyle='rgba(255,240,170,.45)';ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx-ww/2,anchorY);ctx.lineTo(tx,ty);ctx.lineTo(tx+ww*0.18,ty);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.font='28px serif';ctx.fillText('💥',cx-14,anchorY-30);ctx.globalAlpha=1}}
  // gauge
  const tn=Math.min(1,S.tension/TH);const gf=$('gFill');gf.style.width=(tn*100)+'%';gf.style.background=tn>.7?'var(--bad)':tn>.4?'var(--amber)':'var(--ok)';
  if(S.phase==='peel'||S.phase==='search'||S.phase==='found'||S.phase==='lifted')S.tension*=0.97;
  // clock
  if(S.t0&&S.phase!=='won'&&S.phase!=='lost')$('time').textContent=((now-S.t0)/1000).toFixed(2)+'s';
  else if(S.phase==='won'||S.phase==='lost')$('time').textContent=(S.final/1000).toFixed(2)+'s';
  if(S.phase==='lost'&&!S.final)S.final=S.t0?now-S.t0:0;
  requestAnimationFrame(draw);
}
function strip(x0,y0,x1,y1,w,a){const dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,nx=-dy/l*w/2,ny=dx/l*w/2;
  const g=ctx.createLinearGradient(x0-nx,y0-ny,x0+nx,y0+ny);g.addColorStop(0,'rgba(255,240,170,.5)');g.addColorStop(.5,'rgba(255,255,255,.2)');g.addColorStop(1,'rgba(255,230,140,.5)');
  ctx.fillStyle=g;ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x0-nx,y0-ny);ctx.lineTo(x1-nx,y1-ny);ctx.lineTo(x1+nx,y1+ny);ctx.lineTo(x0+nx,y0+ny);ctx.closePath();ctx.fill();ctx.stroke()}

/* ---------- ui ---------- */
$('mute').onclick=()=>{S.muted=!S.muted;$('mute').textContent=S.muted?'🔇':'🔊'};
$('go').onclick=()=>{audio();S.final=0;S.phase='idle';newRound()};
function intro(){$('oT').textContent='TapeEdge ✂️';$('oP').innerHTML='لف البكرة بصباعك لحد ما تحس بالنتوء المخفي، افلته بفلكة ظفر لفوق، وبعدين اسحب 10 سم مستقيمة من غير ما تشرمط الشريط.<br>الخصم بيلعب معاك في نفس الوقت. شغّل الصوت واللمس للتجربة الكاملة.';$('go').textContent='يلا نبدأ';$('ov').classList.add('on')}
resize();score();intro();requestAnimationFrame(draw);
})();