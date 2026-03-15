// ── auth.js — Autenticação de usuários ──────────────────────────

let _usuarioLogado = null;

function toggleCadastro(){
  const ex  = document.getElementById('cadastro-extra');
  const btn = document.getElementById('btn-login');
  const tog = document.getElementById('toggle-cad');
  if(ex.style.display==='none'){
    ex.style.display='block';
    btn.textContent='CADASTRAR';
    btn.onclick=fazerCadastro;
    tog.textContent='Já tenho conta';
  } else {
    ex.style.display='none';
    btn.textContent='ENTRAR';
    btn.onclick=fazerLogin;
    tog.textContent='Criar conta';
  }
}

async function fazerLogin(){
  const li=document.getElementById('login-input').value.trim();
  const se=document.getElementById('senha-input').value;
  const er=document.getElementById('login-erro');
  er.style.display='none';
  if(!li||!se){ er.textContent='Preencha login e senha.'; er.style.display='block'; return; }
  try{
    const r=await fetch(BACKEND+'/auth/login',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({login:li, senha:se})
    });
    if(!r.ok){ const d=await r.json(); throw new Error(d.detail||'Login inválido'); }
    _aplicarLogin(await r.json());
  }catch(e){ er.textContent=e.message; er.style.display='block'; }
}

async function fazerCadastro(){
  const no=document.getElementById('nome-input').value.trim();
  const li=document.getElementById('login-input').value.trim();
  const se=document.getElementById('senha-input').value;
  const er=document.getElementById('login-erro');
  er.style.display='none';
  if(!no||!li||!se){ er.textContent='Preencha todos os campos.'; er.style.display='block'; return; }
  if(se.length<6){ er.textContent='Senha mínima: 6 caracteres.'; er.style.display='block'; return; }
  try{
    const r=await fetch(BACKEND+'/auth/register',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nome:no, login:li, senha:se})
    });
    if(!r.ok){ const d=await r.json(); throw new Error(d.detail||'Erro ao cadastrar'); }
    _aplicarLogin(await r.json());
  }catch(e){ er.textContent=e.message; er.style.display='block'; }
}

function _aplicarLogin(d){
  _usuarioLogado=d;
  localStorage.setItem('altimetro_token', d.token);
  localStorage.setItem('altimetro_user',  JSON.stringify({id:d.id, nome:d.nome, login:d.login}));
  document.getElementById('login-overlay').style.display='none';
  document.getElementById('user-label').textContent      =d.nome;
  document.getElementById('btn-logout').style.display    ='block';
  addLog('Sessão iniciada: '+d.nome,'ok');
}

function fazerLogout(){
  localStorage.removeItem('altimetro_token');
  localStorage.removeItem('altimetro_user');
  _usuarioLogado=null;
  document.getElementById('user-label').textContent  ='';
  document.getElementById('btn-logout').style.display='none';
  document.getElementById('login-overlay').style.display='flex';
}

// Auto-login ao carregar a página (após DOM pronto)
document.addEventListener('DOMContentLoaded', function(){
  const tok=localStorage.getItem('altimetro_token');
  const usr=localStorage.getItem('altimetro_user');
  if(tok&&usr){
    try{
      const u=JSON.parse(usr);
      _usuarioLogado={...u, token:tok};
      document.getElementById('login-overlay').style.display='none';
      document.getElementById('user-label').textContent      =u.nome;
      document.getElementById('btn-logout').style.display    ='block';
    }catch{ localStorage.clear(); }
  }
});
