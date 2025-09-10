// ===== Estado / Constantes
const EVENT_SLUG = 'default';
const LS_CFG = 'sorteio:cfg:' + EVENT_SLUG;    // configurações (demo)
const LS_ADM = 'sorteio:admin:session';        // sessão fake

const $ = (s)=>document.querySelector(s);
const pad = (n, size=4)=> String(n).padStart(size, '0');
const fmtDate = (d)=> new Date(d).toLocaleString('pt-BR');
const parseSqlDate = (s)=> { // "YYYY-MM-DD HH:MM:SS" -> Date
  if(!s) return new Date();
  return new Date(s.replace(' ', 'T'));
};

// ===== API helpers
async function apiGetInscritos(){
  const r = await fetch('/api/inscritos.php');
  const j = await r.json();
  if(!j.ok) throw new Error(j.msg || 'Falha ao carregar inscritos');
  // normaliza campos p/ a UI antiga
  return j.data.map(p => ({
    ticket: Number(p.numero_bilhete),
    name: p.name || '—',
    email: p.email || '—',
    phone: p.phone || '—',
    createdAt: +parseSqlDate(p.hora_data)
  })).sort((a,b)=> a.ticket - b.ticket);
}

async function apiSortear(){
  const r = await fetch('/api/sortear.php', { method:'POST' });
  const j = await r.json();
  if(!j.ok) throw new Error(j.msg || 'Erro no sorteio');
  return {
    ticket: Number(j.data.numero_bilhete),
    name: j.data.name || '—',
    email: j.data.email || '—',
    phone: j.data.phone || '—',
    createdAt: +parseSqlDate(j.data.hora_data)
  };
}

// ===== Config (demo)
function loadCfg(){
  try{ return JSON.parse(localStorage.getItem(LS_CFG)) || { slug: EVENT_SLUG, title: 'Sorteio do Evento' }; }
  catch(e){ return { slug: EVENT_SLUG, title: 'Sorteio do Evento' }; }
}
function saveCfg(v){ localStorage.setItem(LS_CFG, JSON.stringify(v)); }

// ===== Login fake
const loginView = $('#loginView');
const dashView  = $('#dashView');
const btnLogout = $('#btnLogout');

function isLogged(){
  try{ return JSON.parse(localStorage.getItem(LS_ADM))?.ok === true; }catch(e){ return false; }
}
function setLogged(ok){ localStorage.setItem(LS_ADM, JSON.stringify({ ok })); }
function guard(){
  const ok = isLogged();
  loginView.style.display = ok ? 'none':'grid';
  dashView.style.display  = ok ? 'block':'none';
  btnLogout.style.display = ok ? 'inline-block':'none';
}

$('#btnLogin').addEventListener('click', ()=>{
  const email = $('#email').value.trim();
  const pass  = $('#password').value.trim();
  if(email === 'admin@demo.com' && pass === '123456'){
    setLogged(true); guard(); initDashboard();
  }else{
    alert('Credenciais inválidas (use admin@demo.com / 123456)');
  }
});
btnLogout.addEventListener('click', ()=>{ setLogged(false); guard(); });

// ===== Tabs
document.querySelectorAll('.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.tabs button').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    btn.classList.add('active');
    $('#panel-'+btn.dataset.tab).classList.add('active');
  });
});

// ===== Tabela de inscritos
const tbody = $('#tbody');
const mTotal = $('#mTotal');
const mLast  = $('#mLast');
const mElig  = $('#mElig');
const search = $('#search');
const empty  = $('#empty');

let participants = [];

function escapeHtml(s){
  return (s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}
function renderTable(filter=''){
  const txt = (filter||'').toLowerCase();
  const rows = participants.filter(p =>
     !txt
     || String(p.ticket).includes(txt)
     || (p.name||'').toLowerCase().includes(txt)
     || (p.email||'').toLowerCase().includes(txt)
     || (p.phone||'').toLowerCase().includes(txt)
  );
  tbody.innerHTML = rows.map(p=>`<tr>
    <td>#${String(p.ticket).padStart(4,'0')}</td>
    <td>${escapeHtml(p.name||'—')}</td>
    <td>${escapeHtml(p.email||'—')}</td>
    <td>${escapeHtml(p.phone||'—')}</td>
    <td>${fmtDate(p.createdAt)}</td>
  </tr>`).join('');
  empty.style.display = rows.length ? 'none':'block';
}

// Export CSV
$('#btnExport').addEventListener('click', ()=>{
  const header = ['ticket','name','email','phone','createdAt'];
  const lines = [header.join(',')].concat(
    participants.map(p => [p.ticket, `"${(p.name||'').replace(/"/g,'""')}"`, p.email, p.phone, new Date(p.createdAt).toISOString()].join(','))
  );
  const blob = new Blob([lines.join('\n')], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'inscritos.csv'; a.click();
  URL.revokeObjectURL(url);
});

// ===== Sorteio + Telão (via BroadcastChannel)
const btnSortear = $('#btnSortear');
const btnTelao   = $('#btnTelao');
const modal      = $('#modal');
const wNum       = $('#wNum');
const wName      = $('#wName');
const btnFechar  = $('#btnFechar');
const btnRevelar = $('#btnRevelar');
const mDrawAt    = $('#mDrawAt');
const drawHistory = $('#drawHistory');

const channel = new BroadcastChannel('sorteio-channel');

function showModal(w){
  if(!w){ alert('Sem inscritos elegíveis.'); return; }
  wNum.textContent  = '#'+pad(w.ticket,4);
  wName.textContent = w.name || '—';
  modal.style.display = 'grid';
}
btnFechar.addEventListener('click', ()=> modal.style.display = 'none');
btnRevelar.addEventListener('click', ()=>{
  channel.postMessage({ type:'DRAW_REVEAL', payload:{ number: wNum.textContent, name: wName.textContent } });
});

btnSortear.addEventListener('click', async ()=>{
  try{
    channel.postMessage({ type:'DRAW_START' });
    const winner = await apiSortear(); // <<< SORTEIA NO BACKEND
    const stamp = new Date();
    mDrawAt.textContent = stamp.toLocaleString('pt-BR');
    const item = document.createElement('div');
    item.className = 'hint';
    item.textContent = `${mDrawAt.textContent} → #${pad(winner.ticket,4)} — ${winner.name || '—'}`;
    drawHistory.prepend(item);

    channel.postMessage({ type:'DRAW_RESULT', payload:{ number: '#'+pad(winner.ticket,4), name: winner.name || '—' } });
    showModal(winner);

    // Atualiza a lista (um vencedor não volta a ser sorteado)
    await refreshList();
  }catch(e){
    alert(e.message || 'Erro ao sortear');
  }
});

btnTelao.addEventListener('click', ()=>{ window.open('sorteado.html', '_blank'); });

// ===== Config (demo)
const inSlug = $('#slug');
const inTitle = $('#title');
$('#btnSaveCfg').addEventListener('click', ()=>{
  const cfg = { slug: inSlug.value.trim() || EVENT_SLUG, title: inTitle.value.trim() || 'Sorteio do Evento' };
  localStorage.setItem(LS_CFG, JSON.stringify(cfg));
  alert('Configurações salvas (demo).');
});

// ===== Bootstrap do Dashboard
async function refreshList(){
  participants = await apiGetInscritos();
  mTotal.textContent = participants.length;
  const last = participants.length ? participants[participants.length-1].ticket : 0;
  mLast.textContent = '#'+pad(last,4);
  mElig.textContent = participants.length; // simples: todos elegíveis menos quem já saiu (o backend garante)
  renderTable(search.value || '');
}

async function initDashboard(){
  const cfg = loadCfg();
  inSlug.value = cfg.slug || EVENT_SLUG;
  inTitle.value = cfg.title || 'Sorteio do Evento';

  search.addEventListener('input', (e)=> renderTable(e.target.value));
  await refreshList();
}

// start
guard();
if(isLogged()) initDashboard();
