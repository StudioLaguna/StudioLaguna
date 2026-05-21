/* ── Custom cursor ────────────────────────────────── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
(function animateCursor() {
  cursor.style.left = mx + 'px'; cursor.style.top = my + 'px';
  rx += (mx - rx) * 0.12; ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
  requestAnimationFrame(animateCursor);
})();

/* ── Stat counter ────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  let count = 0; const step = target / 60;
  const timer = setInterval(() => {
    count += step;
    if (count >= target) { count = target; clearInterval(timer); }
    el.textContent = Math.floor(count) + (el.dataset.target === '95' ? '%' : '+');
  }, 16);
}

/* ── Scroll reveal ───────────────────────────────── */
const reveals  = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
}, { threshold: 0.1 });
reveals.forEach(r => observer.observe(r));

/* ── Stats observer ──────────────────────────────── */
const statNums = document.querySelectorAll('.stat-num[data-target]');
const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); statsObs.unobserve(e.target); } });
}, { threshold: 0.5 });
statNums.forEach(n => statsObs.observe(n));

/* ── Form tabs ───────────────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

/* ── Helpers de validación en línea ─────────────── */
function clearFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.remove('error-field');
  if (error) error.classList.remove('visible');
}

function showFieldError(inputId, errorId) {
  const input = document.getElementById(inputId);
  const error = document.getElementById(errorId);
  if (input) input.classList.add('error-field');
  if (error) error.classList.add('visible');
  if (input) input.focus();
}

/* ── Form submit ─────────────────────────────────── */
async function submitForm(type) {
  let valid = true;

  if (type === 'cita') {
    const n = document.getElementById('nombre-cita').value;
    const t = document.getElementById('tel-cita').value;
    if (!n) { showFieldError('nombre-cita', 'error-nombre-cita'); valid = false; }
    if (!t) { showFieldError('tel-cita', 'error-tel-cita'); valid = false; }
  } else if (type === 'mensaje') {
    const n = document.getElementById('nombre-msg').value;
    const m = document.getElementById('mensaje').value;
    if (!n) { showFieldError('nombre-msg', 'error-nombre-msg'); valid = false; }
    if (!m) { showFieldError('mensaje', 'error-mensaje'); valid = false; }
  }

  if (!valid) return;

  const payload = {
    type,
    nombre: document.getElementById('nombre-cita')?.value || document.getElementById('nombre-msg')?.value,
    telefono: document.getElementById('tel-cita')?.value || '',
    email: document.getElementById('email-cita')?.value || document.getElementById('email-msg')?.value || '',
    empresa: document.getElementById('empresa')?.value || '',
    servicio: document.getElementById('servicio')?.value || '',
    notas: document.getElementById('notas-cita')?.value || document.getElementById('mensaje')?.value || '',
    timestamp: new Date().toISOString()
  };

  try {
    await fetch('https://script.google.com/macros/s/AKfycbwaHHFh5H4Fz9_VXAIAlLhyAInbWhYOzK1qySuBEtxpVVK-tfOjsxQI3SV9wxp2kJ2A/exec', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    });
  } catch(e) { console.error(e); }

  document.getElementById('formWrapper').style.display = 'none';
  document.getElementById('successMsg').classList.add('show');
}

function resetForm() {
  document.getElementById('formWrapper').style.display = 'block';
  document.getElementById('successMsg').classList.remove('show');
}

/* ── WhatsApp con mensaje personalizado ─────────── */
function openWhatsApp(e) {
  e.preventDefault();
  const nombre  = document.getElementById('wa-nombre').value;
  const interes = document.getElementById('wa-interes').value;
  let msg = 'Hola! ';
  if (nombre) msg += 'Mi nombre es ' + nombre + ' y ';
  msg += 'me interesa ' + interes + '.';
  window.open('https://wa.me/526142448419?text=' + encodeURIComponent(msg), '_blank');
}

/* ── Fecha mínima para cita ──────────────────────── */
const dateInput = document.getElementById('fecha');
if (dateInput) {
  const today = new Date(); today.setDate(today.getDate() + 1);
  dateInput.min = today.toISOString().split('T')[0];
}

/* ── Limpiar errores al escribir ─────────────────── */
['nombre-cita', 'tel-cita', 'nombre-msg', 'mensaje'].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener('input', () => {
    el.classList.remove('error-field');
    const err = document.getElementById('error-' + id);
    if (err) err.classList.remove('visible');
  });
});
