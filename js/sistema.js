// ── sistema.js — Diagrama de hardware + animações ────────────────
// Renderiza o pane-sistema e controla as animações por fase

// ── HTML do pane-sistema (injetado em runtime) ────────────────────
function _renderSistemaHTML() {
  // Header
  document.getElementById('sistema-header').innerHTML = `
    <div class="sys-status-bar">
      <span class="sys-status-label">STATUS DO SISTEMA</span>
      <div class="sys-badge" id="sb-arduino"><span class="sys-dot"></span>ARDUINO UNO</div>
      <div class="sys-badge" id="sb-bomba"><span class="sys-dot"></span>BOMBA DC</div>
      <div class="sys-badge" id="sb-valvula"><span class="sys-dot"></span>SOLENOIDE</div>
      <div class="sys-badge" id="sb-bmp"><span class="sys-dot"></span>BMP180</div>
      <div class="sys-badge" id="sb-rele"><span class="sys-dot"></span>MÓDULO RELÉ</div>
      <div class="sys-info-group">
        <div class="sys-info-box">
          <div class="sys-info-label">ALTITUDE CÂMARA</div>
          <div id="sys-alt-txt" class="sys-info-val" style="color:var(--teal);">0 <span style="font-size:12px;color:var(--text2);">m</span></div>
        </div>
        <div class="sys-info-box wide">
          <div class="sys-info-label">FASE DE TESTE</div>
          <div id="sys-fase-txt" class="sys-info-val fase" style="color:var(--text2);">AGUARDANDO</div>
        </div>
      </div>
    </div>`;

  // Canvas do diagrama
  document.getElementById('sistema-canvas-area').innerHTML = `
    <div class="sys-canvas">
      <svg style="position:absolute;inset:0;width:100%;height:100%;z-index:1;" viewBox="0 0 1024 750">
        <!-- Fluxo de ar -->
        <path class="wire flow-air"    id="wire-ar-bomba-vreg"  d="M 220 115 L 420 115"/>
        <path class="wire flow-air"    id="wire-ar-vreg-camara" d="M 560 115 L 740 115"/>
        <path class="wire flow-air"    id="wire-ar-sol-camara"  d="M 860 260 L 860 460" style="stroke:var(--red);stroke-dasharray:8 6;opacity:0.4;"/>
        <!-- Dados -->
        <path class="wire flow-usb" id="wire-usb"         d="M 220 340 L 280 340"/>
        <path class="wire flow-i2c" id="wire-i2c"         d="M 760 155 L 400 155 L 400 280"/>
        <path class="wire flow-signal" id="wire-ard-ms-ctrl" d="M 460 340 L 520 340" style="stroke:var(--text1);"/>
        <path class="wire flow-signal"        id="wire-digital"     d="M 320 400 L 320 430 L 400 430 L 400 460"/>
        <!-- PWM -->
        <path class="wire flow-pwm"           id="wire-pwm"         d="M 600 280 L 600 190 L 130 190 L 130 170"/>
        <!-- 5V lógica -->
        <path class="wire flow-5v" id="wire-5v-ard"      d="M 370 400 L 370 430 L 600 430 L 600 400 M 370 430 L 370 460"/>
        <!-- 12V força -->
        <path class="wire flow-power" id="wire-12v-ms"      d="M 220 550 L 660 550 L 660 400"/>
        <path class="wire flow-power" id="wire-12v-rele"    d="M 220 515 L 280 515"/>
        <path class="wire flow-power"         id="wire-12v-sol"     d="M 460 515 L 740 515" style="stroke:var(--violet);opacity:0.4;"/>
      </svg>

      <!-- Labels dos fios -->
      <div class="wire-label" style="left:320px;top:115px;">AR (VÁCUO)</div>
      <div class="wire-label" style="left:650px;top:115px;">AR (VÁCUO)</div>
      <div class="wire-label" style="left:860px;top:360px;color:var(--red);border-color:var(--red);">ESCAPE (ATM)</div>
      <div class="wire-label" style="left:250px;top:340px;color:#7a9ab8;border-color:#7a9ab8;">USB (TELEMETRIA)</div>
      <div class="wire-label" style="left:580px;top:155px;color:var(--teal);border-color:var(--teal);">I2C (SDA/SCL)</div>
      <div class="wire-label" style="left:490px;top:340px;color:var(--text1);border-color:var(--text1);">CTRL MS</div>
      <div class="wire-label" style="left:320px;top:430px;color:var(--red);border-color:var(--red);">PINO 2 (SINAL)</div>
      <div class="wire-label" style="left:365px;top:190px;color:var(--amber);border-color:var(--amber);">PWM (M1)</div>
      <div class="wire-label" style="left:485px;top:430px;color:#e63946;border-color:#e63946;">5V (LÓGICA)</div>
      <div class="wire-label" style="left:440px;top:550px;color:var(--violet);border-color:var(--violet);">12V (FORÇA MS)</div>
      <div class="wire-label" style="left:250px;top:515px;color:var(--violet);border-color:var(--violet);">12V Entrada</div>
      <div class="wire-label" style="left:600px;top:515px;color:var(--violet);border-color:var(--violet);">12V CHAVEADO</div>

      <!-- Estação de Controle (PC) -->
      <div class="hw-box" id="hw-pc" style="left:40px;top:280px;width:180px;height:120px;border-color:#7a9ab8;">
        <div class="hw-tooltip down">
          <div class="hw-tt-title">ESTAÇÃO DE CONTROLE</div>
          <div class="hw-tt-body">Computador do operador executando o agente Python. Envia comandos ao Arduino via USB e transmite telemetria ao backend via WebSocket.</div>
          <div class="hw-tt-ctrl"><span>Controle:</span> Interface web no browser. O agente serial roda em segundo plano.</div>
        </div>
        <div class="hw-title" style="color:#7a9ab8;font-size:12px;">ESTAÇÃO CONTROLE</div>
        <svg viewBox="0 0 24 24" style="width:40px;height:40px;fill:none;stroke:#7a9ab8;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;margin:6px 0;">
          <rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <div class="hw-sub" style="color:var(--text1);">Script Python</div>
      </div>

      <!-- Bomba DC -->
      <div class="hw-box" id="hw-bomba" style="left:40px;top:60px;width:180px;height:110px;">
        <div class="hw-tooltip down">
          <div class="hw-tt-title">BOMBA DE VÁCUO</div>
          <div class="hw-tt-body">Motor DC 12V que cria pressão negativa na câmara simulando a redução de pressão atmosférica com a altitude.</div>
          <div class="hw-tt-ctrl"><span>Controle:</span> PWM via Motor Shield (M1). Velocidade ajustada pelo parâmetro de Potência (%).</div>
        </div>
        <div class="hw-title">BOMBA DE VÁCUO</div>
        <svg viewBox="0 0 50 50" style="width:48px;height:48px;margin-bottom:4px;">
          <circle cx="25" cy="25" r="23" fill="var(--bg0)" stroke="var(--text2)" stroke-width="2"/>
          <g id="helice" style="transform-origin:25px 25px;">
            <line x1="25" y1="8"  x2="25" y2="25" stroke="var(--text1)" stroke-width="4" stroke-linecap="round"/>
            <line x1="10" y1="33" x2="25" y2="25" stroke="var(--text1)" stroke-width="4" stroke-linecap="round"/>
            <line x1="40" y1="33" x2="25" y2="25" stroke="var(--text1)" stroke-width="4" stroke-linecap="round"/>
          </g>
          <circle cx="25" cy="25" r="4" fill="var(--text1)"/>
        </svg>
        <div class="hw-sub">Motor DC 12V</div>
      </div>

      <!-- Válvula reguladora -->
      <div class="hw-box" style="left:420px;top:85px;width:140px;height:60px;padding:10px;border-radius:30px;">
        <div class="hw-title" style="margin:0;font-size:11px;">VÁLV. AGULHA</div>
        <div class="hw-sub" style="margin-top:2px;">Restritor de Fluxo</div>
      </div>

      <!-- Câmara de pressão -->
      <div class="hw-box" id="hw-camara" style="left:740px;top:60px;width:240px;height:200px;border-color:var(--text2);justify-content:flex-start;padding-top:24px;">
        <div class="hw-tooltip down">
          <div class="hw-tt-title">CÂMARA DE PRESSÃO</div>
          <div class="hw-tt-body">Recipiente selado onde o altímetro é colocado para teste. A bomba reduz a pressão interna simulando o perfil de altitude do voo.</div>
          <div class="hw-tt-ctrl"><span>Ajuste:</span> A válvula agulha controla a taxa de variação de pressão (velocidade de subida).</div>
        </div>
        <div class="hw-title" style="color:var(--teal);font-size:13px;">CÂMARA DE PRESSÃO</div>
        <div style="width:190px;height:50px;border:1px dashed rgba(46,196,182,.4);border-radius:6px;display:flex;align-items:center;justify-content:center;margin:16px 0;">
          <span style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:rgba(46,196,182,.6);">AMBIENTE SIMULADO</span>
        </div>
        <div class="hw-box" id="hw-bmp" style="position:absolute;bottom:16px;left:20px;padding:10px 14px;border-color:var(--text2);width:auto;border-radius:6px;box-shadow:none;">
        <div class="hw-tooltip left">
          <div class="hw-tt-title">SENSOR BMP180</div>
          <div class="hw-tt-body">Barômetro digital de alta precisão fixado na tampa da câmara. Mede pressão e temperatura, permitindo calcular a altitude equivalente.</div>
          <div class="hw-tt-ctrl"><span>Interface:</span> I2C (SDA/SCL) conectado ao Arduino. Leitura a cada ~50ms.</div>
        </div>
          <div style="font-family:var(--mono);font-size:12px;color:var(--text0);font-weight:600;letter-spacing:.1em;">BMP180</div>
          <div class="hw-sub">Afixado na tampa</div>
        </div>
      </div>

      <!-- Arduino UNO -->
      <div class="hw-box" id="hw-ard" style="left:280px;top:280px;width:180px;height:120px;border-color:var(--text2);">
        <div class="hw-tooltip">
          <div class="hw-tt-title">ARDUINO UNO</div>
          <div class="hw-tt-body">Microcontrolador ATmega328P. Lê o BMP180 via I2C, calcula altitude em tempo real e transmite os dados ao PC via serial USB.</div>
          <div class="hw-tt-ctrl"><span>Fórmula:</span> alt = 44330 × (1 − (P/P₀)^0.1902)</div>
        </div>
        <div class="hw-title" style="color:var(--green);font-size:12px;">ARDUINO UNO</div>
        <div style="display:flex;gap:12px;align-items:center;margin:10px 0;">
          <div style="width:40px;height:30px;background:var(--bg0);border:1px solid var(--line2);border-radius:4px;display:flex;align-items:center;justify-content:center;">
            <div style="width:20px;height:12px;background:var(--line2);border-radius:2px;"></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;gap:6px;">
              <div id="ard-led-pwr" style="width:8px;height:8px;border-radius:50%;background:var(--line2);box-shadow:none;"></div>
              <div id="ard-led-13"  style="width:8px;height:8px;border-radius:50%;background:var(--line2);"></div>
            </div>
            <div style="width:45px;height:5px;background:var(--line2);border-radius:2px;"></div>
            <div style="width:25px;height:5px;background:var(--line2);border-radius:2px;"></div>
          </div>
        </div>
        <div class="hw-sub">Cérebro Lógico (ATmega328P)</div>
      </div>

      <!-- Motor Shield -->
      <div class="hw-box" id="hw-ms" style="left:520px;top:280px;width:160px;height:120px;border-color:var(--text2);">
        <div class="hw-tooltip">
          <div class="hw-tt-title">MOTOR SHIELD</div>
          <div class="hw-tt-body">Placa AFMotor encaixada no Arduino. Controla a bomba DC com sinal PWM, fornecendo a corrente necessária para acionar o motor 12V.</div>
          <div class="hw-tt-ctrl"><span>Canal:</span> M1 para a bomba. Suporta até 2A por canal.</div>
        </div>
        <div class="hw-title" style="color:var(--amber);font-size:12px;">MOTOR SHIELD</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;">
          <div style="background:var(--bg0);border:1px solid var(--line2);border-radius:4px;height:26px;display:flex;align-items:center;justify-content:center;">
            <span style="font-family:var(--mono);font-size:10px;font-weight:600;color:var(--amber);">M1</span>
          </div>
          <div style="background:var(--bg0);border:1px solid var(--line2);border-radius:4px;height:26px;display:flex;align-items:center;justify-content:center;">
            <span style="font-family:var(--mono);font-size:10px;color:var(--text2);">M2</span>
          </div>
        </div>
        <div class="hw-sub">AFMotor (Encaixado)</div>
      </div>

      <!-- Fonte 12V -->
      <div class="hw-box" id="hw-fonte" style="left:40px;top:460px;width:180px;height:110px;border-color:var(--text2);">
        <div class="hw-tooltip">
          <div class="hw-tt-title">FONTE CHAVEADA 12V</div>
          <div class="hw-tt-body">Fornece energia para a bomba DC e o módulo relé. O GND é comum a todo o sistema, incluindo o Arduino.</div>
          <div class="hw-tt-ctrl"><span>Atenção:</span> Nunca conecte/desconecte com o sistema em operação.</div>
        </div>
        <div class="hw-title" style="color:var(--violet);">FONTE CHAVEADA</div>
        <div style="font-family:var(--mono);font-size:38px;font-weight:600;color:var(--violet);line-height:1;margin:8px 0;">12V</div>
        <div class="hw-sub" style="color:var(--text1);">Potência e GND Comum</div>
      </div>

      <!-- Relé -->
      <div class="hw-box" id="hw-rele" style="left:280px;top:460px;width:180px;height:110px;">
        <div class="hw-tooltip">
          <div class="hw-tt-title">MÓDULO RELÉ</div>
          <div class="hw-tt-body">Chave eletromecânica controlada pelo Arduino. Na fase de descida, aciona a válvula solenoide para equalizar a pressão da câmara.</div>
          <div class="hw-tt-ctrl"><span>Lógica:</span> Active-Low — sinal LOW no pino 2 fecha o relé e abre a válvula.</div>
        </div>
        <div class="hw-title" style="color:var(--red);">MÓDULO RELÉ</div>
        <div style="display:flex;gap:12px;align-items:center;margin:12px 0;">
          <div style="width:44px;height:28px;background:var(--bg0);border:1px solid var(--line2);border-radius:4px;"></div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="width:30px;height:6px;background:var(--line2);border-radius:2px;"></div>
            <div id="rele-contato" style="width:30px;height:6px;background:var(--line2);border-radius:2px;transition:background .3s;"></div>
          </div>
        </div>
        <div class="hw-sub">Sinal Active-Low</div>
      </div>

      <!-- Válvula solenoide -->
      <div class="hw-box" id="hw-vsol" style="left:740px;top:460px;width:240px;height:110px;">
        <div class="hw-tooltip">
          <div class="hw-tt-title">VÁLVULA SOLENOIDE</div>
          <div class="hw-tt-body">Válvula normalmente fechada (NF). Quando energizada pelo relé, abre e permite entrada de ar na câmara, simulando a descida do foguete.</div>
          <div class="hw-tt-ctrl"><span>Tipo:</span> NF 12V. Controlada pelo relé, acionado pelo Arduino no pino digital 2.</div>
        </div>
        <div class="hw-title" style="color:var(--red);">VÁLVULA SOLENOIDE</div>
        <div style="display:flex;gap:12px;align-items:center;margin:10px 0;">
          <div style="width:66px;height:54px;background:var(--bg0);border:1px solid var(--line2);border-radius:6px;display:flex;flex-direction:column;justify-content:space-around;padding:8px;">
            <div style="height:3px;background:var(--line2);border-radius:2px;"></div>
            <div style="height:3px;background:var(--line2);border-radius:2px;"></div>
            <div style="height:3px;background:var(--line2);border-radius:2px;"></div>
          </div>
          <div id="vsol-embolo" style="width:36px;height:22px;background:var(--line2);border:1px solid var(--text2);border-radius:3px;transition:transform .3s, background .3s;"></div>
        </div>
        <div class="hw-sub">Normalmente Fechada (NF)</div>
      </div>
    </div>`;

  // Footer/legenda
  document.getElementById('sistema-footer').innerHTML = `
    <div class="sys-legend">
      <span class="sys-legend-title">SINALIZAÇÃO DA PLANTA</span>
      <span class="sys-legend-item"><span class="sys-legend-line" style="background:var(--teal);height:4px;"></span>Fluxo de Ar (Vácuo)</span>
      <span class="sys-legend-item"><span class="sys-legend-line" style="background:repeating-linear-gradient(to right,var(--amber) 0,var(--amber) 4px,transparent 4px,transparent 8px);"></span>Sinal PWM</span>
      <span class="sys-legend-item"><span class="sys-legend-line" style="background:repeating-linear-gradient(to right,var(--red) 0,var(--red) 5px,transparent 5px,transparent 9px);"></span>Digital Lógico</span>
      <span class="sys-legend-item"><span class="sys-legend-line" style="background:var(--violet);opacity:.8;"></span>Energia 12V</span>
      <span class="sys-legend-item"><span class="sys-legend-line" style="background:repeating-linear-gradient(to right,#e63946 0,#e63946 4px,transparent 4px,transparent 8px);opacity:.8;"></span>Saída 5V Arduino</span>
      <span class="sys-legend-credit">TCC ENGENHARIA DE COMPUTAÇÃO 2026</span>
    </div>`;
}

// ── Helpers de animação ───────────────────────────────────────────
function _hwBorder(id, cor, shadow=false){
  const el=document.getElementById(id); if(!el) return;
  el.style.borderColor=cor;
  el.style.boxShadow=shadow?`0 0 14px ${cor}50`:'none';
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

// Fios SVG
function _wireActive(id, on){
  const el=document.getElementById(id); if(!el) return;
  if(on) el.classList.add('active'); else el.classList.remove('active');
}

// Altitude no painel
function _updSysAlt(alt){
  const el=document.getElementById('sys-alt-txt');
  if(el) el.innerHTML=`${Math.round(alt)} <span style="font-size:12px;color:var(--text2);">m</span>`;
}

// ── Máquina de estados do diagrama ────────────────────────────────
function atualizarDiagrama(fase){
  const led = document.getElementById('ard-led-13');

  // ── RESET COMPLETO ─────────────────────────────────────────────
  // Bordas dos componentes: tudo cinza
  ['hw-bomba','hw-rele','hw-vsol','hw-ms',
   'hw-ard','hw-bmp','hw-camara','hw-fonte'].forEach(id=>{
    _hwBorder(id,'var(--text2)');
  });
  _hwBg('rele-contato','var(--line2)');

  // Todos os badges apagados
  ['sb-arduino','sb-bomba','sb-valvula','sb-rele','sb-bmp']
    .forEach(id=>_sysBadge(id,''));

  // Todos os fios desativados
  ['wire-usb','wire-i2c','wire-ard-ms-ctrl','wire-5v-ard',
   'wire-12v-ms','wire-12v-rele','wire-12v-sol',
   'wire-ar-bomba-vreg','wire-ar-vreg-camara',
   'wire-pwm','wire-digital','wire-ar-sol-camara']
    .forEach(id=>_wireActive(id,false));

  _heliceStop();
  _emboloAnim(false);
  if(led) led.style.background='var(--line2)';
  const ledPwrR = document.getElementById('ard-led-pwr');
  if(ledPwrR){ ledPwrR.style.background='var(--line2)'; ledPwrR.style.boxShadow='none'; }

  // ── NÍVEL 0: sem conexão com backend ───────────────────────────
  if(!S.conectado){
    _sysFase('SEM CONEXÃO','var(--red)');
    return;
  }

  // ── NÍVEL 1: conectado mas agente offline ───────────────────────
  // Só a fonte e o USB do PC aparecem (PC está conectado ao backend)
  if(!S.agenteOk){
    _hwBorder('hw-fonte','var(--violet)',true);
    _wireActive('wire-12v-ms',true);
    _wireActive('wire-12v-rele',true);
    _sysFase('AGENTE OFFLINE','var(--amber)');
    return;
  }

  // ── NÍVEL 2: agente online + Arduino conectado (idle) ───────────
  // Fonte, USB, 5V lógica, I2C, Arduino, BMP ativos
  _hwBorder('hw-fonte','var(--violet)',true);
  _hwBorder('hw-ard','var(--green)',true);
  _hwBorder('hw-bmp','var(--teal)',true);
  _hwBorder('hw-camara','var(--teal)');
  _wireActive('wire-12v-ms',true);
  _wireActive('wire-12v-rele',true);
  _wireActive('wire-usb',true);
  _wireActive('wire-5v-ard',true);
  _wireActive('wire-i2c',true);
  _wireActive('wire-ard-ms-ctrl',true);
  _sysBadge('sb-arduino','leitura');
  _sysBadge('sb-bmp','leitura');
  if(led) led.style.background='#2a9d5c';
  const ledPwr = document.getElementById('ard-led-pwr');
  if(ledPwr){ ledPwr.style.background='#2a9d5c'; ledPwr.style.boxShadow='0 0 6px #2a9d5c'; }

  // ── NÍVEL 3: fases de operação ──────────────────────────────────
  if(fase==='calibra'){
    _hwBorder('hw-bmp','var(--teal)',true);
    _sysFase('CALIBRANDO','var(--amber)');
    if(led) led.style.background='var(--amber)';

  } else if(fase==='subida'){
    _hwBorder('hw-bomba','var(--amber)',true);
    _hwBorder('hw-ms','var(--amber)',true);
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
    _sysBadge('sb-rele','alerta');
    _wireActive('wire-digital',true);
    _wireActive('wire-ar-sol-camara',true);
    _wireActive('wire-12v-sol',true);
    _emboloAnim(true);
    _sysFase('DESCIDA','var(--teal)');
    if(led) led.style.background='var(--teal)';

  } else if(fase==='concluido'){
    _hwBorder('hw-ard','var(--green)',true);
    _sysFase('CONCLUÍDO','var(--green)');
    if(led) led.style.background='var(--green)';

  } else if(fase==='erro'){
    _hwBorder('hw-ard','var(--red)',true);
    _sysFase('ERRO','var(--red)');
    if(led) led.style.background='var(--red)';

  } else {
    // idle — tudo conectado mas aguardando
    _sysFase('AGUARDANDO','var(--teal)');
  }
}

// ── Init: renderiza o HTML e inicializa ───────────────────────────
_renderSistemaHTML();
atualizarDiagrama('idle');
