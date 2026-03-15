// ── sistema.js — Animação do diagrama de hardware ───────────────

function _hwBorder(id, cor, shadow=false){
  const el=document.getElementById(id); if(!el) return;
  el.style.borderColor=cor;
  el.style.boxShadow=shadow?`0 0 10px ${cor}40`:'none';
}
function _hwBg(id, cor){
  const el=document.getElementById(id); if(el) el.style.background=cor;
}
function _sysBadge(id, estado){
  const el=document.getElementById(id); if(!el) return;
  el.className='sys-badge'+(estado?' '+estado:'');
}
function _sysFase(txt, cor){
  const el=document.getElementById('sys-fase-txt');
  if(el){ el.textContent=txt; el.style.color=cor; }
}

// Hélice da bomba
let _heliceTimer=null, _heliceAng=0;
function _heliceStart(){
  if(_heliceTimer) return;
  _heliceTimer=setInterval(()=>{
    _heliceAng=(_heliceAng+15)%360;
    const g=document.getElementById('helice');
    if(g) g.style.transform=`rotate(${_heliceAng}deg)`;
  },50);
}
function _heliceStop(){
  if(_heliceTimer){ clearInterval(_heliceTimer); _heliceTimer=null; }
  const g=document.getElementById('helice');
  if(g) g.style.transform='';
}

// Êmbolo da solenoide
function _emboloAnim(aberta){
  const e=document.getElementById('vsol-embolo'); if(!e) return;
  e.style.transform=aberta?'translateX(8px)':'';
  e.style.background=aberta?'var(--red)':'var(--line2)';
}

// Fios SVG animados
function _wireActive(id, on){
  const el=document.getElementById(id); if(!el) return;
  if(on) el.classList.add('active'); else el.classList.remove('active');
}

// Atualiza altitude no painel sistema
function _updSysAlt(alt){
  const el=document.getElementById('sys-alt-txt');
  if(el) el.innerHTML=`${Math.round(alt)} <span style="font-size:10px;color:var(--text2);">m</span>`;
}

// ── MÁQUINA DE ESTADOS DO DIAGRAMA ───────────────────────────────
function atualizarDiagrama(fase){
  // Reset todos os componentes para estado padrão
  ['hw-bomba','hw-rele','hw-vsol','hw-ms'].forEach(id=>_hwBorder(id,'var(--text2)'));
  _hwBorder('hw-camara','var(--teal)');
  _hwBorder('hw-bmp',   'var(--teal)');
  _hwBorder('hw-ard',   'var(--green)');
  _hwBg('rele-contato','var(--line2)');

  ['sb-bomba','sb-valvula','sb-rele'].forEach(id=>_sysBadge(id,''));
  _sysBadge('sb-bmp',     'leitura');
  _sysBadge('sb-arduino', 'leitura');

  ['wire-ar-bomba-vreg','wire-ar-vreg-camara',
   'wire-pwm','wire-digital','wire-ar-sol-camara'].forEach(id=>_wireActive(id,false));
  _wireActive('wire-i2c',true);

  _heliceStop(); _emboloAnim(false);
  const led=document.getElementById('ard-led-13');
  if(led) led.style.background='var(--line2)';

  // Estados por fase
  if(fase==='calibra'){
    _hwBorder('hw-bmp','var(--teal)',true);
    _sysBadge('sb-bmp','leitura');
    _sysFase('CALIBRANDO','var(--amber)');
    if(led) led.style.background='var(--amber)';

  } else if(fase==='subida'){
    _hwBorder('hw-bomba','var(--amber)',true);
    _hwBorder('hw-ms',   'var(--amber)',true);
    _sysBadge('sb-bomba','ativo');
    _wireActive('wire-ar-bomba-vreg',true);
    _wireActive('wire-ar-vreg-camara',true);
    _wireActive('wire-pwm',true);
    _sysFase('SUBIDA','var(--green)');
    _heliceStart();
    if(led) led.style.background='var(--green)';

  } else if(fase==='descida'){
    _hwBorder('hw-rele','var(--red)',true);
    _hwBorder('hw-vsol','var(--red)',true);
    _hwBg('rele-contato','var(--red)');
    _sysBadge('sb-valvula','alerta');
    _sysBadge('sb-rele',  'alerta');
    _wireActive('wire-digital',true);
    _wireActive('wire-ar-sol-camara',true);
    _emboloAnim(true);
    _sysFase('DESCIDA','var(--teal)');
    if(led) led.style.background='var(--teal)';

  } else if(fase==='concluido'){
    _hwBorder('hw-ard','var(--green)',true);
    _sysFase('CONCLUÍDO','var(--green)');
    if(led) led.style.background='var(--green)';

  } else {
    _sysFase('AGUARDANDO','var(--text2)');
  }
}
