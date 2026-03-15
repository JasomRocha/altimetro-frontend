// ── historico.js — Listagem e detalhe de ensaios do banco ───────

let _histVoos=[], _histSel=null;

async function histCarregar(){
  const lista=document.getElementById('hist-lista');
  lista.innerHTML='<div class="hist-loading">Carregando...</div>';
  try{
    const r=await fetch(BACKEND+'/voos?limit=50');
    if(!r.ok) throw new Error('HTTP '+r.status);
    _histVoos=await r.json();
    histRenderLista();
  }catch(e){ lista.innerHTML=`<div class="hist-loading">Erro: ${e.message}</div>`; }
}

function histRenderLista(){
  const lista=document.getElementById('hist-lista');
  if(!_histVoos.length){
    lista.innerHTML='<div class="hist-loading">Nenhum ensaio no banco.</div>';
    return;
  }
  lista.innerHTML=_histVoos.map(v=>{
    const dt=new Date(v.data_inicio).toLocaleString('pt-BR');
    const sel=_histSel===v.id_voo?' sel':'';
    const nome=v.nome_ensaio||`Ensaio #${v.id_voo}`;
    return `<div class="hist-item${sel}" onclick="histSelecionar(${v.id_voo})">
      <div class="hi-date" style="font-size:10.5px;font-weight:500;color:var(--text1);margin-bottom:1px;">${nome}</div>
      <div class="hi-date">${dt}${v.altimetro?' · <span style="color:var(--teal)">'+v.altimetro+'</span>':''}</div>
      <div class="hi-alt">${v.alt_max.toFixed(1)}<span> m</span></div>
      <div class="hi-meta">${v.t_total_s.toFixed(1)}s · ${v.n_pontos} pontos${v.erro_pct!=null?' · erro '+v.erro_pct.toFixed(1)+'%':''}</div>
    </div>`;
  }).join('');
}

async function histSelecionar(id){
  _histSel=id; histRenderLista();
  const det=document.getElementById('hist-detalhe');
  det.innerHTML='<div class="hist-loading">Carregando telemetria...</div>';
  try{
    const r=await fetch(`${BACKEND}/voos/${id}/telemetria`);
    if(!r.ok) throw new Error('HTTP '+r.status);
    histRenderDetalhe(await r.json());
  }catch(e){ det.innerHTML=`<div class="hist-loading">Erro: ${e.message}</div>`; }
}

function histRenderDetalhe(voo){
  const dt=new Date(voo.data_inicio).toLocaleString('pt-BR');
  const pts=voo.pontos||[];
  const vels=pts.map((p,i)=>{
    if(p.vel!==undefined) return p.vel;
    if(i===0) return 0;
    const dt2=p.t-pts[i-1].t;
    return dt2>0.05?(p.alt-pts[i-1].alt)/dt2:0;
  });
  const velMax=pts.length?Math.max(...vels)*1.1||10:10;
  const prs=pts.filter(p=>p.pres>0).map(p=>p.pres);
  const presMin=prs.length?Math.min(...prs)*0.999:990;
  const presMax=prs.length?Math.max(...prs)*1.001:1015;
  const aMax=(voo.alt_max||0)*1.12||10;
  const tTot=voo.t_total_s||0;

  document.getElementById('hist-detalhe').innerHTML=`
    <div class="hist-detail-hdr">
      <div>
        <div class="hist-big">${(voo.alt_max||0).toFixed(1)}<span style="font-size:18px;color:var(--text2);margin-left:6px;">m</span></div>
        ${voo.nome_ensaio?`<div style="font-family:var(--mono);font-size:13px;font-weight:500;color:var(--text1);margin-bottom:3px;">${voo.nome_ensaio}</div>`:''}
        <div class="hist-big-lbl">${voo.altimetro?'ALT.: '+voo.altimetro+' · ':''}${dt}${voo.usuario?' · '+voo.usuario:''}</div>
        ${voo.obs?`<div style="font-family:var(--mono);font-size:10px;color:var(--text2);margin-top:5px;padding:5px 9px;background:var(--bg2);border-radius:2px;border-left:2px solid var(--teal);">${voo.obs}</div>`:''}
      </div>
    </div>
    <div class="hist-stats">
      <div class="hstat-c"><div class="k">Alvo</div><div class="v">${(voo.apogeu_alvo||0).toFixed(0)} m</div></div>
      <div class="hstat-c"><div class="k">Atingido</div><div class="v c">${(voo.alt_max||0).toFixed(1)} m</div></div>
      <div class="hstat-c"><div class="k">Erro</div><div class="v">${voo.erro_m!=null?(voo.erro_m>=0?'+':'')+voo.erro_m.toFixed(1)+' m':'—'}</div></div>
      <div class="hstat-c"><div class="k">Erro %</div><div class="v">${voo.erro_pct!=null?voo.erro_pct.toFixed(1)+'%':'—'}</div></div>
      <div class="hstat-c"><div class="k">Subida</div><div class="v">${(voo.t_subida_s||0).toFixed(1)} s</div></div>
      <div class="hstat-c"><div class="k">Total</div><div class="v">${tTot.toFixed(1)} s</div></div>
      <div class="hstat-c"><div class="k">Vel. média</div><div class="v">${voo.vel_media_ms!=null?voo.vel_media_ms.toFixed(1)+' m/s':'—'}</div></div>
      <div class="hstat-c"><div class="k">Vel. máx.</div><div class="v">${voo.vel_max_ms!=null?voo.vel_max_ms.toFixed(1)+' m/s':'—'}</div></div>
    </div>
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:5px;overflow-y:auto;">
      <div class="chart-block" style="min-height:90px;">
        <div class="chart-block-hdr"><span class="chart-block-title">Altitude</span><span style="font-family:var(--mono);font-size:9px;color:var(--teal)">m</span></div>
        <div class="chart-axes">
          <div class="axis-y"><span>${aMax.toFixed(0)}</span><span>${(aMax/2).toFixed(0)}</span><span>0</span></div>
          <div class="axis-x-wrap">
            <svg class="chart-svg" id="hs-alt" viewBox="0 0 700 70" preserveAspectRatio="none">
              <defs><linearGradient id="hgr-a" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(46,196,182,.3)"/><stop offset="100%" stop-color="rgba(46,196,182,0)"/></linearGradient></defs>
              <line x1="0" y1="17" x2="700" y2="17" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="0" y1="35" x2="700" y2="35" stroke="#1e2e42" stroke-width="1"/>
              <line x1="0" y1="53" x2="700" y2="53" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="175" y1="0" x2="175" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="350" y1="0" x2="350" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="525" y1="0" x2="525" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <polyline id="hf-a" fill="url(#hgr-a)" stroke="none" points=""/>
              <polyline id="hl-a" fill="none" stroke="var(--teal)" stroke-width="2.5" points=""/>
            </svg>
            <div class="axis-x"><span>0s</span><span>${(tTot*0.25).toFixed(0)}s</span><span>${(tTot*0.5).toFixed(0)}s</span><span>${(tTot*0.75).toFixed(0)}s</span><span>${tTot.toFixed(0)}s</span></div>
          </div>
        </div>
      </div>
      <div class="chart-block" style="min-height:90px;">
        <div class="chart-block-hdr"><span class="chart-block-title">Velocidade</span><span style="font-family:var(--mono);font-size:9px;color:var(--green)">m/s</span></div>
        <div class="chart-axes">
          <div class="axis-y"><span>${velMax.toFixed(0)}</span><span>${(velMax/2).toFixed(0)}</span><span>0</span></div>
          <div class="axis-x-wrap">
            <svg class="chart-svg" id="hs-vel" viewBox="0 0 700 70" preserveAspectRatio="none">
              <defs><linearGradient id="hgr-v" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(61,220,132,.25)"/><stop offset="100%" stop-color="rgba(61,220,132,0)"/></linearGradient></defs>
              <line x1="0" y1="17" x2="700" y2="17" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="0" y1="35" x2="700" y2="35" stroke="#1e2e42" stroke-width="1"/>
              <line x1="0" y1="53" x2="700" y2="53" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="175" y1="0" x2="175" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="350" y1="0" x2="350" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="525" y1="0" x2="525" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <polyline id="hf-v" fill="url(#hgr-v)" stroke="none" points=""/>
              <polyline id="hl-v" fill="none" stroke="var(--green)" stroke-width="2.5" points=""/>
            </svg>
            <div class="axis-x"><span>0s</span><span>${(tTot*0.25).toFixed(0)}s</span><span>${(tTot*0.5).toFixed(0)}s</span><span>${(tTot*0.75).toFixed(0)}s</span><span>${tTot.toFixed(0)}s</span></div>
          </div>
        </div>
      </div>
      <div class="chart-block" style="min-height:90px;">
        <div class="chart-block-hdr"><span class="chart-block-title">Pressão</span><span style="font-family:var(--mono);font-size:9px;color:var(--violet)">hPa</span></div>
        <div class="chart-axes">
          <div class="axis-y"><span>${presMax.toFixed(0)}</span><span>${((presMax+presMin)/2).toFixed(0)}</span><span>${presMin.toFixed(0)}</span></div>
          <div class="axis-x-wrap">
            <svg class="chart-svg" id="hs-pres" viewBox="0 0 700 70" preserveAspectRatio="none">
              <defs><linearGradient id="hgr-p" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(123,108,246,.25)"/><stop offset="100%" stop-color="rgba(123,108,246,0)"/></linearGradient></defs>
              <line x1="0" y1="17" x2="700" y2="17" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="0" y1="35" x2="700" y2="35" stroke="#1e2e42" stroke-width="1"/>
              <line x1="0" y1="53" x2="700" y2="53" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="175" y1="0" x2="175" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="350" y1="0" x2="350" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <line x1="525" y1="0" x2="525" y2="70" stroke="#1e2e42" stroke-width=".5"/>
              <polyline id="hf-p" fill="url(#hgr-p)" stroke="none" points=""/>
              <polyline id="hl-p" fill="none" stroke="var(--violet)" stroke-width="2.5" points=""/>
            </svg>
            <div class="axis-x"><span>0s</span><span>${(tTot*0.25).toFixed(0)}s</span><span>${(tTot*0.5).toFixed(0)}s</span><span>${(tTot*0.75).toFixed(0)}s</span><span>${tTot.toFixed(0)}s</span></div>
          </div>
        </div>
      </div>
    </div>`;
  _histDraw(pts, voo.alt_max||0, tTot);
}

function _histDraw(pontos, altMax, tMax){
  if(!pontos||!pontos.length) return;
  const W=700,H=70,PL=0,PR=0,PT=4,PB=4,tFim=tMax*1.05||1;
  function pt(t,v,vMin,vMax){
    const x=PL+(t/tFim)*(W-PL-PR);
    const r=vMax-vMin||1;
    const y=H-PB-((v-vMin)/r)*(H-PT-PB);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }
  function draw(f,l,vals,vMin,vMax){
    const pp=pontos.map((p,i)=>pt(p.t,vals[i],vMin,vMax));
    const ul=pp[pp.length-1].split(',');
    const fill=pp.join(' ')+` ${ul[0]},${(H-PB).toFixed(1)} ${PL},${(H-PB).toFixed(1)}`;
    const fe=document.getElementById(f), le=document.getElementById(l);
    if(fe) fe.setAttribute('points',fill);
    if(le) le.setAttribute('points',pp.join(' '));
  }
  draw('hf-a','hl-a', pontos.map(p=>p.alt||0), 0, altMax*1.12||10);
  const vels=pontos.map((p,i)=>{
    if(p.vel!==undefined) return p.vel;
    if(i===0) return 0;
    const dt=p.t-pontos[i-1].t;
    return dt>0.05?(p.alt-pontos[i-1].alt)/dt:0;
  });
  draw('hf-v','hl-v', vels, 0, Math.max(...vels)*1.1||10);
  const prs=pontos.map(p=>p.pres||0).filter(v=>v>0);
  if(prs.length){
    const pMin=Math.min(...prs)*0.999, pMax=Math.max(...prs)*1.001;
    draw('hf-p','hl-p', pontos.map(p=>p.pres||pMin), pMin, pMax);
  }
}
