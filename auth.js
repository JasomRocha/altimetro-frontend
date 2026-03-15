// ── auth.js — Autenticação de usuários ──────────────────────────

let _usuarioLogado = null;
let _modoCadastro  = false;

// Configura os listeners do formulário de login após DOM pronto
document.addEventListener('DOMContentLoaded', function() {

  // Botão principal (Entrar / Cadastrar)
  const btnLogin = document.getElementById('btn-login');
  if (btnLogin) {
    btnLogin.addEventListener('click', function() {
      if (_modoCadastro) fazerCadastro();
      else               fazerLogin();
    });
  }

  // Enter no campo senha → submete
  const senhaInput = document.getElementById('senha-input');
  if (senhaInput) {
    senhaInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        if (_modoCadastro) fazerCadastro();
        else               fazerLogin();
      }
    });
  }

  // Enter no campo login → foca senha
  const loginInput = document.getElementById('login-input');
  if (loginInput) {
    loginInput.addEventListener('keydown', function(e) {
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
      document.getElementById('login-overlay').style.display = 'none';
      document.getElementById('user-label').textContent       = u.nome;
      document.getElementById('btn-logout').style.display     = 'block';
    } catch { localStorage.clear(); }
  }
});

// ── Alterna entre modo login e cadastro ─────────────────────────
function toggleCadastro() {
  const ex  = document.getElementById('cadastro-extra');
  const btn = document.getElementById('btn-login');
  const tog = document.getElementById('toggle-cad');
  if (!ex || !btn || !tog) return;

  _modoCadastro = !_modoCadastro;

  if (_modoCadastro) {
    ex.style.display  = 'block';
    btn.textContent   = 'CADASTRAR';
    tog.textContent   = 'Já tenho conta';
  } else {
    ex.style.display  = 'none';
    btn.textContent   = 'ENTRAR';
    tog.textContent   = 'Criar conta';
  }
}

// ── Login ────────────────────────────────────────────────────────
async function fazerLogin() {
  const li = document.getElementById('login-input').value.trim();
  const se = document.getElementById('senha-input').value;
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
    er.textContent   = e.message;
    er.style.display = 'block';
  }
}

// ── Cadastro ─────────────────────────────────────────────────────
async function fazerCadastro() {
  const no = document.getElementById('nome-input').value.trim();
  const li = document.getElementById('login-input').value.trim();
  const se = document.getElementById('senha-input').value;
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
    er.textContent   = e.message;
    er.style.display = 'block';
  }
}

// ── Aplica sessão após login/cadastro bem-sucedido ───────────────
function _aplicarLogin(d) {
  _usuarioLogado = d;
  localStorage.setItem('altimetro_token', d.token);
  localStorage.setItem('altimetro_user',
    JSON.stringify({ id: d.id, nome: d.nome, login: d.login }));
  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('user-label').textContent       = d.nome;
  document.getElementById('btn-logout').style.display     = 'block';
  addLog('Sessão iniciada: ' + d.nome, 'ok');
}

// ── Logout ───────────────────────────────────────────────────────
function fazerLogout() {
  localStorage.removeItem('altimetro_token');
  localStorage.removeItem('altimetro_user');
  _usuarioLogado = null;
  document.getElementById('user-label').textContent   = '';
  document.getElementById('btn-logout').style.display = 'none';
  document.getElementById('login-overlay').style.display = 'flex';
}
