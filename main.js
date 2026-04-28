/* ── Custom cursor ────────────────────────────────── */
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

(function animateCursor() {
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animateCursor);
})();

/* ── Stat counter ────────────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  let count = 0;
  const step = target / 60;
  const timer = setInterval(() => {
    count += step;
    if (count >= target) { count = target; clearInterval(timer); }
    el.textContent = Math.floor(count) + (el.dataset.target === '95' ? '%' : '+');
  }, 16);
}

/* ── Scroll reveal ───────────────────────────────── */
const reveals  = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(r => observer.observe(r));

/* ── Stats observer ──────────────────────────────── */
const statNums = document.querySelectorAll('.stat-num[data-target]');
const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      statsObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
statNums.forEach(n => statsObs.observe(n));

/* ── Form tabs ───────────────────────────────────── */
function switchTab(tab, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.form-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

/* ── Form submit ─────────────────────────────────── */
function submitForm(type) {
  let valid = true;

  if (type === 'cita') {
    const n = document.getElementById('nombre-cita').value;
    const t = document.getElementById('tel-cita').value;
    if (!n || !t) { alert('Por favor completa nombre y teléfono.'); valid = false; }
  } else if (type === 'mensaje') {
    const n = document.getElementById('nombre-msg').value;
    const m = document.getElementById('mensaje').value;
    if (!n || !m) { alert('Por favor completa nombre y mensaje.'); valid = false; }
  }

  if (valid) {
    document.getElementById('formWrapper').style.display  = 'none';
    document.getElementById('successMsg').classList.add('show');
  }
}

function resetForm() {
  document.getElementById('formWrapper').style.display = 'block';
  document.getElementById('successMsg').classList.remove('show');
}

/* ── WhatsApp with custom message ────────────────── */
function openWhatsApp(e) {
  e.preventDefault();
  const nombre  = document.getElementById('wa-nombre').value;
  const interes = document.getElementById('wa-interes').value;
  let msg = 'Hola! ';
  if (nombre) msg += 'Mi nombre es ' + nombre + ' y ';
  msg += 'me interesa ' + interes + '.';
  const phone = '5218001234567';
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
}

/* ── Set min date for appointment ────────────────── */
const dateInput = document.getElementById('fecha');
if (dateInput) {
  const today = new Date();
  today.setDate(today.getDate() + 1);
  dateInput.min = today.toISOString().split('T')[0];
}
