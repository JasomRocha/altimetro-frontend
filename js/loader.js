// ── loader.js — Carrega os componentes HTML e inicializa a app ───
//
// Fluxo:
//   1. Carrega cada components/*.html via fetch e injeta no DOM
//   2. Após todos carregados, carrega os módulos JS em ordem
//   3. Inicializa a aplicação
//
// Adicionar um novo componente:
//   1. Crie components/meu-componente.html
//   2. Adicione { id: 'ancora-no-index', src: 'components/meu-componente.html' }
//      no array COMPONENTS abaixo

const COMPONENTS = [
  { id: 'c-login',          src: 'components/login.html'         },
  { id: 'c-topbar',         src: 'components/topbar.html'        },
  { id: 'c-navbar',         src: 'components/navbar.html'        },
  { id: 'c-pane-ensaio',    src: 'components/pane-ensaio.html'   },
  { id: 'c-pane-historico', src: 'components/pane-historico.html'},
  { id: 'c-pane-sistema',   src: 'components/pane-sistema.html'  },
];

const JS_MODULES = [
  'js/state.js',
  'js/ws.js',
  'js/charts.js',
  'js/historico.js',
  'js/sistema.js',
  'js/auth.js',
];

// ── Carrega um arquivo HTML e injeta no elemento alvo ─────────────
async function _loadComponent(id, src) {
  const el = document.getElementById(id);
  if (!el) { console.error(`[loader] elemento #${id} não encontrado`); return; }
  try {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao carregar ${src}`);
    el.innerHTML = await res.text();
  } catch (e) {
    console.error(`[loader] falha ao carregar ${src}:`, e.message);
    el.innerHTML = `<div style="color:#e63946;font-family:monospace;padding:10px">
      Erro ao carregar ${src}: ${e.message}
    </div>`;
  }
}

// ── Carrega um script JS dinamicamente (garante ordem) ───────────
function _loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload  = resolve;
    s.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(s);
  });
}

// ── Inicializa a aplicação após tudo carregado ────────────────────
function _initApp() {
  // Parâmetros iniciais
  setApogeu(700);
  setTSubida(20);
  setPotencia(50);
  const slAp = document.getElementById('sl-ap');
  if(slAp) slAp.style.setProperty('--f', ((700-100)/(2000-100)*100).toFixed(1)+'%');

  // Gráficos e diagrama
  if(typeof drawRef         === 'function') drawRef();
  if(typeof atualizarDiagrama === 'function') atualizarDiagrama('idle');

  // Log e conexão
  addLog('Interface inicializada.', 'ok');
  addLog('Conectando ao backend...', 'warn');
  connectWS();
}

// ── Boot principal ────────────────────────────────────────────────
(async function boot() {
  try {
    // 1. Carrega todos os componentes HTML em paralelo
    await Promise.all(COMPONENTS.map(c => _loadComponent(c.id, c.src)));
    console.log('[loader] todos os componentes carregados');

    // 2. Carrega os módulos JS em série (ordem importa)
    for (const src of JS_MODULES) {
      await _loadScript(src);
    }
    console.log('[loader] todos os módulos JS carregados');

    // 3. Inicializa
    _initApp();

  } catch (e) {
    console.error('[loader] erro crítico no boot:', e);
  }
})();
