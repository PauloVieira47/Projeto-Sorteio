// ===== Helpers
const $ = (sel) => document.querySelector(sel);
const pad = (n, size=4) => String(n).padStart(size, '0');
const onlyDigits = (v) => (v||'').replace(/\D/g, '');

// máscara BR simples
function formatPhone(digits){
  const d = onlyDigits(digits).slice(0, 11);
  if(d.length <= 2) return '(' + d;
  if(d.length <= 6) return '(' + d.slice(0,2) + ') ' + d.slice(2);
  if(d.length <= 10) return '(' + d.slice(0,2) + ') ' + d.slice(2,6) + '-' + d.slice(6);
  return '(' + d.slice(0,2) + ') ' + d.slice(2,7) + '-' + d.slice(7);
}

// validações
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v||'');
const isName  = (v) => (v||'').trim().split(/\s+/).length >= 2 && (v||'').trim().length >= 5;
const isPhone = (v) => onlyDigits(v).length >= 10;

// ===== API helper
async function apiInscrever({name, email, phone}){
  const r = await fetch('/api/inscrever.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ name, email, phone })
  });
  const text = await r.text();
  let j = null;
  try { j = JSON.parse(text); } catch(_) {}
  if (!j) throw new Error(`Resposta não JSON (${r.status}): ${text}`);
  if (!j.ok) throw new Error(j.msg || `Falha (${r.status})`);
  return j.data;
}


// ===== Interações
const $form = $('#form');
const $fName = $('#f-name');
const $fEmail = $('#f-email');
const $fPhone = $('#f-phone');
const $name = $('#name');
const $email = $('#email');
const $phone = $('#phone');
const $consent = $('#consent');

const $formView = $('#formView');
const $successView = $('#successView');
const $ticketNumberText = $('#ticketNumberText');
const $userNameText = $('#userNameText');
const $btnCopy = $('#btnCopy');
const $btnNew = $('#btnNew');

$('#year').textContent = new Date().getFullYear();

$phone.addEventListener('input', (e) => {
  const before = e.target.value;
  e.target.value = formatPhone(before);
});

function setInvalid(field, cond){ field.classList.toggle('invalid', cond); }

$form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = $name.value.trim();
  const email = $email.value.trim();
  const phone = $phone.value.trim();

  const vName = !isName(name);
  const vEmail = !isEmail(email);
  const vPhone = !isPhone(phone);
  const vConsent = !$consent.checked;

  setInvalid($fName, vName);
  setInvalid($fEmail, vEmail);
  setInvalid($fPhone, vPhone);
  if (vName || vEmail || vPhone || vConsent) return;

  try{
    const data = await apiInscrever({ name, email, phone: onlyDigits(phone) });
    // UI sucesso
    $formView.style.display = 'none';
    $successView.style.display = 'block';
    $userNameText.textContent = name;
    $ticketNumberText.textContent = '#' + pad(data.numero_bilhete, 4);
  }catch(err){
    alert(err.message || 'Erro ao enviar sua inscrição');
  }
});

$btnCopy.addEventListener('click', async () => {
  const text = $ticketNumberText.textContent.trim();
  try{
    await navigator.clipboard.writeText(text);
    $btnCopy.textContent = 'Copiado!';
    setTimeout(()=> $btnCopy.textContent = 'Copiar número', 1500);
  }catch{
    alert('Número: ' + text);
  }
});

$btnNew.addEventListener('click', () => {
  $successView.style.display = 'none';
  $formView.style.display = 'block';
  $form.reset();
  $phone.value = '';
  $name.focus();
});
