// ── state.js — Constantes, estado global, utilitários ────────────
const BACKEND = 'https://altimetro-backend.onrender.com';
const WS_URL  = 'wss://altimetro-backend.onrender.com/ws/frontend';

const PWM_MIN=160, PWM_NOM=200, PWM_MAX=255;
function pctToPWM(p){ return p<=50?Math.round(PWM_MIN+(p/50)*(PWM_NOM-PWM_MIN)):Math.round(PWM_NOM+((p-50)/50)*(PWM_MAX-PWM_NOM)); }
function potLabel(p){ if(p===0)return'MÍNIMO'; if(p===50)return'NOMINAL'; if(p===100)return'MÁXIMO'; return p<50?'ABAIXO NOM.':'ACIMA NOM.'; }

const S = {
  apAlvo:700, tSubida:20, potPct:50, pwm:200,
  fase:'idle', alt:0, pres:0, t:0,
  altMax:0, altPrev:0, tPrev:0,
  hT:[], hA:[], hV:[], hP:[],
  pref:null, presMin:9999, presMax:0,
  lastResult:null, ws:null,
  nomeEnsaio:'', altimetro:'', obs:'',
};

const CW=700, CH=80, PL=0, PR=0, PT=4, PB=4;

setInterval(()=>{
  document.getElementById('clock').textContent =
    new Date().toLocaleTimeString('pt-BR',{hour12:false});
},1000);

function toast(msg, tipo='ok'){
  const el=document.getElementById('toast');
  el.textContent=msg; el.className=`show ${tipo}`;
  clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('show'),3500);
}

function addLog(msg, cls='data'){
  const el=document.getElementById('log-body');
  const ts=S.t>0?`[${S.t.toFixed(1).padStart(6)}s]`:'[  ---  ]';
  const map={ok:'ok',warn:'warn',err:'err',info:'info',data:'data',error:'err',warning:'warn'};
  const d=document.createElement('div');
  d.className='ll '+(map[cls]||'data');
  d.textContent=ts+'  '+msg;
  el.appendChild(d);
  el.parentElement.scrollTop=el.parentElement.scrollHeight;
}

function setTab(nome){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p=>p.classList.remove('active'));
  document.getElementById('tab-'+nome).classList.add('active');
  document.getElementById('pane-'+nome).classList.add('active');
  if(nome==='historico') histCarregar();
}
