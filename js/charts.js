// ── charts.js — Altímetro, gráficos ao vivo e resultado ─────────

// ── ALTÍMETRO ANALÓGICO ──────────────────────────────────────────
function updAltimeter(alt){
  const f=Math.min(Math.max(alt/(S.apAlvo*1.1),0),1);
  document.getElementById('alt-arc').setAttribute('stroke-dasharray',
    `${(f*220).toFixed(1)} ${(258-f*220).toFixed(1)}`);
  document.getElementById('alt-needle').setAttribute('transform',
    `rotate(${(-135+f*270).toFixed(1)} 58 58)`);
}

// ── GRÁFICOS ─────────────────────────────────────────────────────
function ptXY(t,v,tMax,vMin,vMax){
  const x=PL+(t/tMax)*(CW-PL-PR);
  const range=vMax-vMin||1;
  const y=CH-PB-((v-vMin)/range)*(CH-PT-PB);
  return `${x.toFixed(1)},${y.toFixed(1)}`;
}

function drawRef(){
  const ap=S.apAlvo, ts=S.tSubida, td=ts*(13/18);
  const tTot=(ts+td)*1.12, aMax=ap*1.12;
  const pts=[];
  for(let i=0;i<=24;i++){ const t=i/24*ts; pts.push(ptXY(t,ap*t/ts,tTot,0,aMax)); }
  for(let i=1;i<=24;i++){ const t=ts+i/24*td; pts.push(ptXY(t,ap*(1-i/24),tTot,0,aMax)); }
  document.getElementById('ref-line').setAttribute('points',pts.join(' '));
}

function updCharts(){
  if(!S.hT.length) return;
  const tLast=S.hT[S.hT.length-1];
  const ap=S.apAlvo, ts=S.tSubida, td=ts*(13/18);
  const tMax=Math.max(tLast*1.05,(ts+td)*1.12);
  const aMax=Math.max(S.altMax*1.1,ap*1.12);

  // Gráfico altitude
  const ptsA=S.hT.map((t,i)=>ptXY(t,S.hA[i],tMax,0,aMax));
  const rp=[];
  for(let i=0;i<=24;i++){const t=i/24*ts; rp.push(ptXY(t,ap*t/ts,tMax,0,aMax));}
  for(let i=1;i<=24;i++){const t=ts+i/24*td; rp.push(ptXY(t,ap*(1-i/24),tMax,0,aMax));}
  document.getElementById('ref-line').setAttribute('points',rp.join(' '));
  const xlA=ptXY(tLast,0,tMax,0,aMax), x0A=ptXY(S.hT[0],0,tMax,0,aMax);
  document.getElementById('real-fill').setAttribute('points',ptsA.join(' ')+' '+xlA+' '+x0A);
  document.getElementById('real-line').setAttribute('points',ptsA.join(' '));
  document.getElementById('ay-alt-max').textContent=Math.round(aMax)+'m';
  document.getElementById('ay-alt-mid').textContent=Math.round(aMax/2)+'m';
  document.getElementById('ax-alt-mid').textContent=(tMax/2).toFixed(0)+'s';
  document.getElementById('ax-alt-max').textContent=tMax.toFixed(0)+'s';

  // Foguete animado
  const iL=S.hT.length-1;
  if(iL>=1){
    const[x1,y1]=ptXY(S.hT[iL-1],S.hA[iL-1],tMax,0,aMax).split(',');
    const[x2,y2]=ptXY(S.hT[iL],  S.hA[iL],  tMax,0,aMax).split(',');
    const dx=parseFloat(x2)-parseFloat(x1);
    const dy=parseFloat(y2)-parseFloat(y1);
    const angDeg=Math.atan2(dy,dx)*(180/Math.PI)+90;
    document.getElementById('ap-rocket').setAttribute('transform',
      `translate(${x2},${y2}) rotate(${angDeg.toFixed(1)})`);
    document.getElementById('rk-flame').style.display=S.fase==='subida'?'':'none';
  }

  // Gráfico velocidade
  const velArr=S.hV.filter(v=>isFinite(v));
  if(velArr.length){
    const vMax=Math.max(...velArr)*1.1||10;
    const vMin=Math.min(Math.min(...velArr)*1.1,0);
    const ptsV=S.hT.map((t,i)=>ptXY(t,S.hV[i],tMax,vMin,vMax));
    const xlV=ptXY(tLast,vMin,tMax,vMin,vMax), x0V=ptXY(S.hT[0],vMin,tMax,vMin,vMax);
    document.getElementById('vel-fill').setAttribute('points',ptsV.join(' ')+' '+xlV+' '+x0V);
    document.getElementById('vel-line').setAttribute('points',ptsV.join(' '));
    document.getElementById('ay-vel-max').textContent=vMax.toFixed(0)+'m/s';
    document.getElementById('ay-vel-mid').textContent=(vMax/2).toFixed(0)+'m/s';
    document.getElementById('ax-vel-mid').textContent=(tMax/2).toFixed(0)+'s';
    document.getElementById('ax-vel-max').textContent=tMax.toFixed(0)+'s';
  }

  // Gráfico pressão
  if(S.hP.length){
    const pMax=S.presMax*1.001||1015;
    const pMin=S.presMin*0.999||990;
    const ptsP=S.hT.map((t,i)=>ptXY(t,S.hP[i],tMax,pMin,pMax));
    const xlP=ptXY(tLast,pMin,tMax,pMin,pMax), x0P=ptXY(S.hT[0],pMin,tMax,pMin,pMax);
    document.getElementById('pres-fill').setAttribute('points',ptsP.join(' ')+' '+xlP+' '+x0P);
    document.getElementById('pres-line').setAttribute('points',ptsP.join(' '));
    document.getElementById('ay-pres-max').textContent=pMax.toFixed(1);
    document.getElementById('ay-pres-mid').textContent=((pMax+pMin)/2).toFixed(1);
    document.getElementById('ay-pres-min').textContent=pMin.toFixed(1);
    document.getElementById('ax-pres-mid').textContent=(tMax/2).toFixed(0)+'s';
    document.getElementById('ax-pres-max').textContent=tMax.toFixed(0)+'s';
  }
}

// ── RESULTADO FINAL ───────────────────────────────────────────────
function onResult(m){
  m.t_subida_alvo=S.tSubida; S.lastResult=m;
  const err=m.alt_max-m.alt_alvo;
  const errPct=(Math.abs(err)/m.alt_alvo*100).toFixed(1);
  const ea=Math.abs(err);
  const cor=ea<m.alt_alvo*0.05?'g':ea<m.alt_alvo*0.12?'a':'r';
  const sinal=err>=0?'+':'';
  const velMed=m.t_subida>0?(m.alt_max/m.t_subida).toFixed(1):'—';
  const velArr=S.hV.filter((v,i)=>S.hT[i]<=m.t_subida&&v>0);
  const velMax=velArr.length?Math.max(...velArr).toFixed(1):'—';
  let sug='';
  if(err>m.alt_alvo*0.1)       sug=`<div class="r-row"><span class="rk">SUGESTÃO</span><span class="rv a">Fechar a válvula de fluxo</span></div>`;
  else if(err<-m.alt_alvo*0.1) sug=`<div class="r-row"><span class="rk">SUGESTÃO</span><span class="rv a">Abrir a válvula de fluxo</span></div>`;

  document.getElementById('result-body').innerHTML=`
    <div class="apogeu-destaque">
      <div class="apogeu-num ${cor}">${m.alt_max.toFixed(1)}</div>
      <div class="apogeu-label">METROS ATINGIDOS</div>
      <div class="erro-badge ${cor}">ERRO ${sinal}${err.toFixed(1)} m · ${errPct}%</div>
    </div>
    <div class="r-sec">
      <div class="r-sec-title">APOGEU</div>
      <div class="r-row"><span class="rk">Alvo</span><span class="rv c">${m.alt_alvo} m</span></div>
      <div class="r-row"><span class="rk">Atingido</span><span class="rv ${cor}">${m.alt_max.toFixed(1)} m</span></div>
      <div class="r-row"><span class="rk">Erro</span><span class="rv ${cor}">${sinal}${err.toFixed(1)} m (${errPct}%)</span></div>
      ${sug}
    </div>
    <div class="r-sec">
      <div class="r-sec-title">TEMPO</div>
      <div class="r-row"><span class="rk">Subida</span><span class="rv">${m.t_subida.toFixed(1)} s</span></div>
      <div class="r-row"><span class="rk">Descida</span><span class="rv">${m.t_descida.toFixed(1)} s</span></div>
      <div class="r-row"><span class="rk">Total</span><span class="rv">${m.t_total.toFixed(1)} s</span></div>
      <div class="r-row"><span class="rk">Ref. subida</span><span class="rv">${m.t_subida_alvo} s / ${m.alt_alvo} m</span></div>
    </div>
    <div class="r-sec">
      <div class="r-sec-title">VELOCIDADE</div>
      <div class="r-row"><span class="rk">Média subida</span><span class="rv c">${velMed} m/s</span></div>
      <div class="r-row"><span class="rk">Máx. instant.</span><span class="rv">${velMax} m/s</span></div>
    </div>
    <div class="r-sec">
      <div class="r-sec-title">BOMBA</div>
      <div class="r-row"><span class="rk">Potência</span><span class="rv a">${m.potencia_pct}% · ${potLabel(m.potencia_pct)}</span></div>
      <div class="r-row"><span class="rk">PWM</span><span class="rv">${m.pwm}</span></div>
      <div class="r-row"><span class="rk">Pressão ref.</span><span class="rv">${m.pref?m.pref.toFixed(2):'—'} hPa</span></div>
      <div class="r-row"><span class="rk">Pressão mín.</span><span class="rv">${S.presMin<9990?S.presMin.toFixed(2):'—'} hPa</span></div>
    </div>`;

  document.getElementById('btn-csv').style.display='block';
  document.getElementById('btn-salvar').style.display='block';
  document.getElementById('salvo-badge').style.display='none';
  addLog(`Concluído: apogeu=${m.alt_max.toFixed(1)}m  erro=${sinal}${err.toFixed(1)}m (${errPct}%)`,'ok');
  if(sug) addLog(err>0?'Sugestão: fechar válvula.':'Sugestão: abrir válvula.','warn');
}
