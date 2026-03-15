// ── ws.js — WebSocket, protocolo, parâmetros, fase, telemetria ──

const BACKEND = 'https://altimetro-backend.onrender.com';
const WS_URL  = 'wss://altimetro-backend.onrender.com/ws/frontend';

// ── WEBSOCKET ─────────────────────────────────────────────────────
function connectWS(){
  try{
    S.ws = new WebSocket(WS_URL);
    S.ws.onopen  = () => { setConn(true);  addLog('Backend conectado.','ok'); };
    S.ws.onclose = () => { setConn(false); addLog('Desconectado — reconectando em 3s...','warn'); setTimeout(connectWS,3000); };
    S.ws.onerror = () => addLog('Erro WebSocket: '+WS_URL,'err');
    S.ws.onmessage = e => { try{ handle(JSON.parse(e.data)); }catch{} };
  } catch { setTimeout(connectWS,3000); }
}

function wsSend(o){ if(S.ws && S.ws.readyState===1) S.ws.send(JSON.stringify(o)); }

// ── ESTADO DE CONEXÃO E CONTROLE DO BOTÃO ────────────────────────
function setConn(on){
  S.conectado = on;
  const b = document.getElementById('cbadge');
  const t = document.getElementById('ctxt');
  if(b) b.className = 'conn-badge' + (on ? ' on' : '');
  if(t) t.textContent = on ? 'ONLINE' : 'OFFLINE';
  _atualizarBtnGo();
}

// Decide o estado do btn-go baseado na conexão + fase atual
function _atualizarBtnGo(){
  const btn = document.getElementById('btn-go');
  if(!btn) return;

  const faseOk = ['idle','concluido','erro'].includes(S.fase);

  if(!faseOk){
    // Ensaio em andamento — sempre bloqueado
    btn.disabled = true;
    btn.querySelector('span').textContent = 'ENSAIO ATIVO';
    btn.title = '';
    return;
  }
  if(!S.conectado){
    btn.disabled = true;
    btn.querySelector('span').textContent = 'SEM CONEXÃO';
    btn.title = 'Aguardando conexão com o backend...';
    btn.style.borderColor = 'var(--red)';
    btn.style.color       = 'var(--red)';
    return;
  }
  if(!S.agenteOk){
    btn.disabled = true;
    btn.querySelector('span').textContent = 'AGENTE OFFLINE';
    btn.title = 'O agente serial não está conectado ao backend.';
    btn.style.borderColor = 'var(--amber)';
    btn.style.color       = 'var(--amber)';
    return;
  }
  // Tudo OK — habilita
  btn.disabled = false;
  btn.querySelector('span').textContent = 'INICIAR ENSAIO';
  btn.title = '';
  btn.style.borderColor = '';
  btn.style.color       = '';
}

// ── HANDLER DE MENSAGENS ──────────────────────────────────────────
function handle(m){
  if(m.tipo==='log'){
    addLog(m.msg, m.nivel||'data');
  }
  else if(m.tipo==='status'){
    const map = {
      agente_online:'idle', agente_offline:'idle',
      subida:'subida', descida:'descida',
      aguardando:'idle', concluido:'concluido', erro:'erro'
    };
    setFase(map[m.fase] || m.fase || 'idle');
    if(m.agente_ok !== undefined){
      S.agenteOk = m.agente_ok;
      setHW(m.agente_ok ? 'REAL' : 'SEM AGENTE');
    }
    if(m.fase==='agente_offline' || m.agente_ok===false){ S.agenteOk=false; _atualizarBtnGo(); }
    if(m.fase==='agente_online'  || m.agente_ok===true) { S.agenteOk=true;  _atualizarBtnGo(); }
    if(m.msg) addLog(m.msg,'info');
  }
  else if(m.tipo==='hw')  { setHW(m.modo); }
  else if(m.tipo==='pref'){ setPref(m.pref); }
  else if(m.tipo==='telemetria'){
    if(m.t_voo !== undefined && m.t === undefined) m.t = m.t_voo;
    onTelem(m);
  }
  else if(m.tipo==='resultado'){
    if(!m.t_subida)  m.t_subida  = S.tSubida;
    if(!m.t_descida) m.t_descida = 0;
    if(!m.t_total)   m.t_total   = (m.t_subida||0) + (m.t_descida||0);
    if(!m.alt_alvo)  m.alt_alvo  = S.apAlvo;
    m.potencia_pct = S.potPct; m.pwm = S.pwm; m.pref = S.pref;
    if(m.ensaio_id) S.ensaioId = m.ensaio_id;  // salva para confirmar/descartar
    onResult(m);
  }
  else if(m.tipo==='erro'){ addLog(m.msg||'Erro no servidor','err'); }
}

function setHW(modo){
  S.agenteOk = (modo === 'REAL');
  const el = document.getElementById('h-hw');
  if(el){ el.textContent = modo; el.className = 'v ' + (modo==='REAL' ? 'v-green' : 'v-amber'); }
  _atualizarBtnGo();
}

function setPref(p){
  S.pref = p;
  const el = document.getElementById('h-pref');
  if(el){ el.textContent = p.toFixed(2)+' hPa'; el.className = 'v v-teal'; }
}

// ── PARÂMETROS ────────────────────────────────────────────────────
function setApogeu(v){
  S.apAlvo = v;
  document.getElementById('r-ap').textContent = v;
  document.getElementById('bar-alvo').textContent = v+' m';
  const tRef = Math.round(18*v/700);
  document.getElementById('i-ref').textContent = v+' m / '+tRef+' s';
  document.getElementById('sl-ap').style.setProperty('--f', ((v-100)/(2000-100)*100).toFixed(1)+'%');
  updVel(); drawRef();
}

function setTSubida(v){
  S.tSubida = v;
  document.getElementById('r-ts').textContent = v;
  document.getElementById('sl-ts').style.setProperty('--f', ((v-5)/(60-5)*100).toFixed(1)+'%');
  updVel(); drawRef();
}

function updVel(){
  document.getElementById('i-vel').textContent = (S.apAlvo/S.tSubida).toFixed(1)+' m/s';
}

function setPotencia(pct){
  S.potPct = pct; S.pwm = pctToPWM(pct);
  document.getElementById('r-pot').textContent = pct;
  document.getElementById('r-pwm').textContent = S.pwm+' · '+potLabel(pct);
  document.getElementById('sl-pot').style.setProperty('--f', pct+'%');
  document.getElementById('g-pot').textContent = pct+'%';
  document.getElementById('gf-pot').style.width = pct+'%';
}

// ── MÁQUINA DE ESTADOS ────────────────────────────────────────────
const FCFG = {
  idle:     { c:'f-idle', t:'AGUARDANDO'  },
  calibra:  { c:'f-cal',  t:'CALIBRANDO'  },
  subida:   { c:'f-sub',  t:'SUBIDA ATIVA'},
  descida:  { c:'f-desc', t:'DESCIDA'     },
  concluido:{ c:'f-ok',   t:'CONCLUÍDO'   },
  erro:     { c:'f-err',  t:'ERRO'        },
};

function setFase(f){
  S.fase = f;
  const cfg = FCFG[f] || FCFG.idle;
  document.getElementById('fbadge').className = 'fbadge '+cfg.c;
  document.getElementById('ftxt').textContent  = cfg.t;
  _atualizarBtnGo();  // centraliza lógica do botão
  atualizarDiagrama(f);
}

// ── TELEMETRIA ────────────────────────────────────────────────────
function onTelem(m){
  const { t, alt, pres } = m;
  const dt  = t - S.tPrev;
  const vel = dt > 0.05 ? (alt - S.altPrev) / dt : 0;
  S.altPrev = alt; S.tPrev = t;
  S.alt = alt; S.pres = pres; S.t = t;
  if(alt  > S.altMax)  S.altMax  = alt;
  if(pres < S.presMin) S.presMin = pres;
  if(pres > S.presMax) S.presMax = pres;
  S.hT.push(t); S.hA.push(alt); S.hV.push(vel); S.hP.push(pres);

  // Topbar
  document.getElementById('h-alt').textContent  = alt.toFixed(1)+' m';
  document.getElementById('h-pres').textContent = pres.toFixed(2)+' hPa';
  document.getElementById('h-t').textContent    = t.toFixed(1)+' s';
  document.getElementById('h-amax').textContent = S.altMax.toFixed(0)+' m';

  // Painel ao vivo
  document.getElementById('live-alt').textContent  = Math.round(alt);
  document.getElementById('live-pres').textContent = pres.toFixed(2)+' hPa';
  document.getElementById('live-t').textContent    = t.toFixed(1)+' s';
  document.getElementById('live-vel').textContent  = (vel>=0?'+':'')+vel.toFixed(1)+' m/s';
  document.getElementById('live-amax').textContent = S.altMax.toFixed(0)+' m';

  const pct = Math.min(alt/S.apAlvo*100, 100);
  document.getElementById('alt-fill').style.width = pct+'%';
  updAltimeter(alt);

  // Gauges
  document.getElementById('g-alt').textContent   = Math.round(alt)+' m';
  document.getElementById('gf-alt').style.width  = pct+'%';
  document.getElementById('g-amax').textContent  = Math.round(S.altMax)+' m';
  document.getElementById('gf-amax').style.width = Math.min(S.altMax/S.apAlvo*100,100)+'%';
  document.getElementById('g-pres').textContent  = pres.toFixed(1)+' hPa';

  // Altitude no diagrama
  const sysAlt = document.getElementById('sys-alt-txt');
  if(sysAlt) sysAlt.innerHTML = `${Math.round(alt)} <span style="font-size:12px;color:var(--text2);">m</span>`;

  updCharts();
}

// ── COMANDOS ──────────────────────────────────────────────────────
function cmdIniciar(){
  // Guards de segurança
  if(!['idle','concluido','erro'].includes(S.fase)) return;
  if(!S.conectado){ toast('Sem conexão com o backend.','er'); return; }
  if(!S.agenteOk){  toast('Agente serial não conectado.','er'); return; }

  // Valida nome do ensaio (obrigatório)
  const nomeEnsaio = (document.getElementById('inp-nome')?.value||'').trim();
  if(!nomeEnsaio){
    const el = document.getElementById('inp-nome');
    if(el){ el.style.borderColor='var(--red)'; el.focus(); }
    toast('Nome do ensaio é obrigatório.','er');
    return;
  }
  S.nomeEnsaio = nomeEnsaio;
  S.altimetro  = (document.getElementById('inp-altimetro')?.value||'').trim();
  S.obs        = (document.getElementById('inp-obs')?.value||'').trim();

  // Reset de estado
  S.hT=[];S.hA=[];S.hV=[];S.hP=[];
  S.altMax=0; S.alt=0; S.t=0; S.tPrev=0; S.altPrev=0;
  S.presMin=9999; S.presMax=0; S.lastResult=null;

  // Reset da UI
  ['real-line','real-fill','vel-line','vel-fill','pres-line','pres-fill']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.setAttribute('points',''); });
  document.getElementById('ap-rocket').setAttribute('transform','translate(-40,-40)');
  document.getElementById('rk-flame').style.display = 'none';
  document.getElementById('result-body').innerHTML  = '<div class="r-row"><span class="rk">Ensaio em andamento...</span><span></span></div>';
  document.getElementById('btn-csv').style.display    = 'none';
  document.getElementById('btn-salvar').style.display = 'none';
  document.getElementById('salvo-badge').style.display= 'none';
  document.getElementById('h-pref').textContent = '— hPa';
  document.getElementById('h-pref').className   = 'v';
  document.getElementById('inp-nome').style.borderColor = '';

  updAltimeter(0);
  document.getElementById('alt-fill').style.width = '0%';
  drawRef();
  setFase('calibra');
  addLog(`Ensaio iniciado  apogeu=${S.apAlvo}m  t_sub=${S.tSubida}s  pot=${S.potPct}%  PWM=${S.pwm}`,'info');
  wsSend({ cmd:'iniciar', apogeu:S.apAlvo, dur:S.tSubida,
            potencia_pct:S.potPct, pwm:S.pwm,
            nome_ensaio:S.nomeEnsaio, altimetro:S.altimetro, obs:S.obs });
}

function cmdParar(){
  wsSend({cmd:'parar'});
  addLog('Sinal de abortar enviado.','err');
}

async function salvarNoBanco(){
  const id = S.ensaioId;
  if(!id){ toast('ID do ensaio não encontrado.','er'); return; }
  try{
    const r = await fetch(`${BACKEND}/voos/${id}/confirmar`, { method:'POST' });
    if(!r.ok) throw new Error('HTTP '+r.status);
    document.getElementById('btn-salvar').style.display = 'none';
    document.getElementById('salvo-badge').style.display= 'block';
    toast('Ensaio salvo no banco.','ok');
    addLog(`Ensaio #${id} confirmado no banco.`,'ok');
  } catch(e){
    toast('Erro ao salvar: '+e.message,'er');
    addLog('Erro ao confirmar ensaio: '+e.message,'err');
  }
}

function exportCSV(){
  const m = S.lastResult; if(!m) return;
  const err    = m.alt_max - m.alt_alvo;
  const errPct = (Math.abs(err)/m.alt_alvo*100).toFixed(2);
  const sinal  = err>=0?'+':'';
  const velArr = S.hV.filter((v,i)=>S.hT[i]<=m.t_subida&&v>0);
  const velMax = velArr.length ? Math.max(...velArr).toFixed(2) : '';
  const velMed = m.t_subida>0 ? (m.alt_max/m.t_subida).toFixed(2) : '';
  const dt     = new Date().toISOString().replace('T',' ').slice(0,19);
  const hdr = ['data_hora','apogeu_alvo_m','potencia_pct','pwm','apogeu_atingido_m',
               'erro_m','erro_pct','t_subida_s','t_descida_s','t_total_s',
               'vel_media_ms','vel_max_ms','pressao_ref_hPa','pressao_min_hPa'].join(',');
  const vals = [`"${dt}"`,m.alt_alvo,m.potencia_pct,m.pwm,m.alt_max.toFixed(2),
                err.toFixed(2),errPct,m.t_subida.toFixed(2),m.t_descida.toFixed(2),
                m.t_total.toFixed(2),velMed,velMax,
                m.pref?m.pref.toFixed(2):'',
                S.presMin<9990?S.presMin.toFixed(2):''].join(',');
  const th = 't_s,altitude_m,pressao_hPa,vel_inst_ms,fase';
  const tl = S.hT.map((t,i)=>{
    const pres = S.pref ? Math.max(0,S.pref-S.hA[i]/8.43).toFixed(2) : '';
    return `${t.toFixed(3)},${S.hA[i].toFixed(2)},${pres},${S.hV[i]!==undefined?S.hV[i].toFixed(2):''},${t<=m.t_subida?'subida':'descida'}`;
  }).join('\n');
  const csv = '# BANCO DE TESTE DE ALTIMETROS — UFPB TCC 2026\n# RESUMO\n'+hdr+'\n'+vals+'\n\n# TELEMETRIA\n'+th+'\n'+tl;
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const ts   = new Date().toISOString().slice(0,19).replace(/[:\-T]/g,'');
  a.href = url; a.download = `ensaio_${ts}_ap${m.alt_alvo}m_pot${m.potencia_pct}pct.csv`;
  a.click(); URL.revokeObjectURL(url);
  addLog('CSV exportado.','ok'); toast('CSV baixado.','ok');
}
