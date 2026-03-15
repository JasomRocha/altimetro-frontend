// ── auth.js — Autenticação de usuários ──────────────────────────
// (carregado no final do body — DOM já disponível)

let _usuarioLogado = null;
let _modoCadastro  = false;

// ── Configura listeners do formulário ────────────────────────────
(function initAuth() {
  const btnLogin  = document.getElementById('btn-login');
  const senhaInp  = document.getElementById('senha-input');
  const loginInp  = document.getElementById('login-input');

  if (btnLogin) {
    btnLogin.addEventListener('click', function() {
      if (_modoCadastro) fazerCadastro();
      else               fazerLogin();
    });
  }

  if (senhaInp) {
    senhaInp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (_modoCadastro) fazerCadastro();
        else               fazerLogin();
      }
    });
  }

  if (loginInp) {
    loginInp.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        const s = document.getElementById('senha-input');
        if (s) s.focus();
      }
    });
  }

  // Auto-login se token salvo
  const tok = localStorage.getItem('altimetro_token');
  const usr = localStorage.getItem('altimetro_user');
  if (tok && usr) {
    try {
      const u = JSON.parse(usr);
      _usuarioLogado = { ...u, token: tok };
      const overlay = document.getElementById('login-overlay');
      const label   = document.getElementById('user-label');
      const btnOut  = document.getElementById('btn-logout');
      if (overlay) overlay.style.display = 'none';
      if (label)   label.textContent     = u.nome;
      if (btnOut)  btnOut.style.display  = 'block';
    } catch { localStorage.clear(); }
  }
})();

// ── Alterna modo login / cadastro ────────────────────────────────
function toggleCadastro() {
  const ex  = document.getElementById('cadastro-extra');
  const btn = document.getElementById('btn-login');
  const tog = document.getElementById('toggle-cad');
  if (!ex || !btn || !tog) return;

  _modoCadastro = !_modoCadastro;

  if (_modoCadastro) {
    ex.style.display = 'block';
    btn.textContent  = 'CADASTRAR';
    tog.textContent  = 'Já tenho conta';
  } else {
    ex.style.display = 'none';
    btn.textContent  = 'ENTRAR';
    tog.textContent  = 'Criar conta';
  }
}

// ── Login ─────────────────────────────────────────────────────────
async function fazerLogin() {
  const li = (document.getElementById('login-input').value || '').trim();
  const se = document.getElementById('senha-input').value || '';
  const er = document.getElementById('login-erro');
  er.style.display = 'none';

  if (!li || !se) {
    er.textContent   = 'Preencha login e senha.';
    er.style.display = 'block';
    return;
  }
  try {
    const r = await fetch(BACKEND + '/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ login: li, senha: se }),
    });
    if (!r.ok) {
      const d = await r.json();
      throw new Error(d.detail || 'Login ou senha incorretos');
    }
    _aplicarLogin(await r.json());
  } catch (e) {
    const er2 = document.getElementById('login-erro');
    er2.textContent   = e.message;
    er2.style.display = 'block';
  }
}

// ── Cadastro ──────────────────────────────────────────────────────
async function fazerCadastro() {
  const no = (document.getElementById('nome-input').value || '').trim();
  const li = (document.getElementById('login-input').value || '').trim();
  const se = document.getElementById('senha-input').value || '';
  const er = document.getElementById('login-erro');
  er.style.display = 'none';

  if (!no || !li || !se) {
    er.textContent   = 'Preencha todos os campos.';
    er.style.display = 'block';
    return;
  }
  if (se.length < 6) {
    er.textContent   = 'Senha mínima: 6 caracteres.';
    er.style.display = 'block';
    return;
  }
  try {
    const r = await fetch(BACKEND + '/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ nome: no, login: li, senha: se }),
    });
    if (!r.ok) {
      const d = await r.json();
      throw new Error(d.detail || 'Erro ao cadastrar');
    }
    _aplicarLogin(await r.json());
  } catch (e) {
    const er2 = document.getElementById('login-erro');
    er2.textContent   = e.message;
    er2.style.display = 'block';
  }
}

// ── Aplica sessão ─────────────────────────────────────────────────
function _aplicarLogin(d) {
  _usuarioLogado = d;
  localStorage.setItem('altimetro_token', d.token);
  localStorage.setItem('altimetro_user',
    JSON.stringify({ id: d.id, nome: d.nome, login: d.login }));
  const overlay = document.getElementById('login-overlay');
  const label   = document.getElementById('user-label');
  const btnOut  = document.getElementById('btn-logout');
  if (overlay) overlay.style.display = 'none';
  if (label)   label.textContent     = d.nome;
  if (btnOut)  btnOut.style.display  = 'block';
  if (typeof addLog === 'function') addLog('Sessão iniciada: ' + d.nome, 'ok');
}

// ── Logout ────────────────────────────────────────────────────────
function fazerLogout() {
  localStorage.removeItem('altimetro_token');
  localStorage.removeItem('altimetro_user');
  _usuarioLogado = null;
  const overlay = document.getElementById('login-overlay');
  const label   = document.getElementById('user-label');
  const btnOut  = document.getElementById('btn-logout');
  if (label)   label.textContent   = '';
  if (btnOut)  btnOut.style.display = 'none';
  if (overlay) overlay.style.display = 'flex';
}
