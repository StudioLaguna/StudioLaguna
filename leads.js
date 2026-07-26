/* ══════════════════════════════════════════════════
   STUDIO LAGUNA — Panel de Leads (lógica)
   ══════════════════════════════════════════════════ */

const STORAGE_ENDPOINT = 'sl_leads_endpoint';
const STORAGE_TOKEN    = 'sl_leads_token';

let allLeads = [];
let activeFilter = 'todos';

/* ── Detección flexible de campos ─────────────────
   El Sheet puede tener encabezados en distinto orden o idioma;
   buscamos por posibles nombres, sin distinguir mayúsculas/acentos. */
function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findField(lead, candidates) {
  const keys = Object.keys(lead);
  for (const cand of candidates) {
    const key = keys.find(k => normalize(k) === normalize(cand));
    if (key && lead[key] !== '' && lead[key] != null) return lead[key];
  }
  return '';
}

function getName(lead)     { return findField(lead, ['nombre', 'name', 'nombre completo']) || 'Sin nombre'; }
function getPhone(lead)    { return findField(lead, ['telefono', 'teléfono', 'phone', 'whatsapp', 'tel']); }
function getEmail(lead)    { return findField(lead, ['email', 'correo', 'correo electronico', 'correo electrónico']); }
function getService(lead) { return findField(lead, ['servicio', 'service', 'asunto', 'interes', 'interés']); }
function getCompany(lead)  { return findField(lead, ['empresa', 'negocio', 'company']); }
function getNotes(lead)    { return findField(lead, ['notas', 'mensaje', 'notes', 'message', 'comentarios']); }
function getPriority(lead) { return normalize(findField(lead, ['prioridad', 'priority', 'clasificacion', 'clasificación'])); }
function getTimestamp(lead){ return findField(lead, ['timestamp', 'fecha', 'date', 'marca temporal']); }
function getType(lead)     { return findField(lead, ['type', 'tipo']); }

function priorityBucket(p) {
  if (['alta', 'high', 'urgente'].includes(p)) return 'alta';
  if (['media', 'medium', 'normal'].includes(p)) return 'media';
  if (['baja', 'low'].includes(p)) return 'baja';
  return '';
}

function onlyDigits(str) { return String(str || '').replace(/\D/g, ''); }

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return String(ts);
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/* ── Config local ──────────────────────────────── */
function getConfig() {
  return {
    endpoint: localStorage.getItem(STORAGE_ENDPOINT) || '',
    token: localStorage.getItem(STORAGE_TOKEN) || ''
  };
}
function saveConfig(endpoint, token) {
  localStorage.setItem(STORAGE_ENDPOINT, endpoint.trim());
  localStorage.setItem(STORAGE_TOKEN, token.trim());
}
function hasConfig() {
  const c = getConfig();
  return !!(c.endpoint && c.token);
}

/* ── Fetch ─────────────────────────────────────── */
async function fetchLeads() {
  const { endpoint, token } = getConfig();
  showState('loading');

  if (!endpoint || !token) {
    openSettings();
    showState('idle');
    return;
  }

  try {
    const url = new URL(endpoint);
    url.searchParams.set('token', token);
    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    allLeads = Array.isArray(data.leads) ? data.leads : [];
    setStatus(true);
    renderFilterChips();
    renderList();
  } catch (err) {
    console.error(err);
    setStatus(false);
    showState('error', err.message && err.message !== 'Failed to fetch'
      ? err.message
      : 'No se pudo conectar. Revisa la URL, el token, o tu conexión a internet.');
  }
}

function setStatus(online) {
  const dot = document.getElementById('statusDot');
  dot.classList.toggle('offline', !online);
}

/* ── Render ────────────────────────────────────── */
function showState(state, errorMsg) {
  document.getElementById('loadingState').style.display = state === 'loading' ? 'block' : 'none';
  document.getElementById('errorState').style.display = state === 'error' ? 'block' : 'none';
  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('leadsList').style.display = (state === 'loading' || state === 'error') ? 'none' : 'flex';
  if (state === 'error') document.getElementById('errorText').textContent = errorMsg || 'Ocurrió un error.';
}

function renderFilterChips() {
  const anyPriority = allLeads.some(l => priorityBucket(getPriority(l)));
  const chipsEl = document.getElementById('filterChips');
  if (!anyPriority) { chipsEl.innerHTML = ''; return; }

  const chips = [
    { key: 'todos', label: 'Todos' },
    { key: 'alta', label: 'Alta prioridad' },
    { key: 'media', label: 'Media' },
    { key: 'baja', label: 'Baja' }
  ];
  chipsEl.innerHTML = chips.map(c =>
    `<button class="chip ${activeFilter === c.key ? 'active' : ''}" data-filter="${c.key}">${c.label}</button>`
  ).join('');
  chipsEl.querySelectorAll('.chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.filter;
      renderFilterChips();
      renderList();
    });
  });
}

function renderList() {
  const search = normalize(document.getElementById('searchInput').value);
  const listEl = document.getElementById('leadsList');

  let filtered = allLeads;
  if (activeFilter !== 'todos') {
    filtered = filtered.filter(l => priorityBucket(getPriority(l)) === activeFilter);
  }
  if (search) {
    filtered = filtered.filter(l => {
      const haystack = normalize(Object.values(l).join(' '));
      return haystack.includes(search);
    });
  }

  if (filtered.length === 0) {
    listEl.innerHTML = '';
    document.getElementById('emptyState').style.display = 'block';
    document.getElementById('errorState').style.display = 'none';
    document.getElementById('loadingState').style.display = 'none';
    return;
  }
  document.getElementById('emptyState').style.display = 'none';

  listEl.innerHTML = filtered.map((lead, i) => {
    const bucket = priorityBucket(getPriority(lead));
    const name = getName(lead);
    const phone = getPhone(lead);
    const service = getService(lead);
    const company = getCompany(lead);
    const notes = getNotes(lead);
    const time = formatTime(getTimestamp(lead));
    const type = getType(lead);

    const tags = [
      type ? `<span class="lead-tag">${escapeHtml(type)}</span>` : '',
      bucket ? `<span class="lead-tag priority-${bucket}">${escapeHtml(getPriority(lead))}</span>` : '',
      service ? `<span class="lead-tag">${escapeHtml(service)}</span>` : ''
    ].filter(Boolean).join('');

    return `
      <div class="lead-card ${bucket ? 'priority-' + bucket : ''}" data-index="${allLeads.indexOf(lead)}">
        <div class="lead-top">
          <div class="lead-name">${escapeHtml(name)}${company ? ' · ' + escapeHtml(company) : ''}</div>
          <div class="lead-time">${escapeHtml(time)}</div>
        </div>
        <div class="lead-tags">${tags}</div>
        <div class="lead-preview">${escapeHtml(notes || '')}</div>
        <div class="lead-actions">
          ${phone ? `<a class="lead-action" href="tel:${escapeHtml(phone)}" onclick="event.stopPropagation()">Llamar</a>` : ''}
          ${phone ? `<a class="lead-action whatsapp" href="https://wa.me/52${onlyDigits(phone)}" target="_blank" onclick="event.stopPropagation()">WhatsApp</a>` : ''}
          ${getEmail(lead) ? `<a class="lead-action" href="mailto:${escapeHtml(getEmail(lead))}" onclick="event.stopPropagation()">Correo</a>` : ''}
        </div>
      </div>
    `;
  }).join('');

  listEl.querySelectorAll('.lead-card').forEach(card => {
    card.addEventListener('click', () => openDetail(allLeads[parseInt(card.dataset.index)]));
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* ── Detalle ───────────────────────────────────── */
function openDetail(lead) {
  const content = document.getElementById('detailContent');
  const entries = Object.entries(lead).filter(([k, v]) => k !== '_row' && v !== '' && v != null);
  content.innerHTML = entries.map(([k, v]) => `
    <div class="detail-field">
      <div class="detail-label">${escapeHtml(k)}</div>
      <div class="detail-value">${escapeHtml(v)}</div>
    </div>
  `).join('');
  document.getElementById('detailModal').style.display = 'flex';
}
document.getElementById('closeDetailBtn').addEventListener('click', () => {
  document.getElementById('detailModal').style.display = 'none';
});
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target.id === 'detailModal') e.target.style.display = 'none';
});

/* ── Configuración ─────────────────────────────── */
function openSettings() {
  const { endpoint, token } = getConfig();
  document.getElementById('endpointInput').value = endpoint;
  document.getElementById('tokenInput').value = token;
  document.getElementById('settingsModal').style.display = 'flex';
}
document.getElementById('settingsBtn').addEventListener('click', openSettings);
document.getElementById('cancelSettingsBtn').addEventListener('click', () => {
  if (hasConfig()) document.getElementById('settingsModal').style.display = 'none';
});
document.getElementById('saveSettingsBtn').addEventListener('click', () => {
  const endpoint = document.getElementById('endpointInput').value.trim();
  const token = document.getElementById('tokenInput').value.trim();
  if (!endpoint || !token) return;
  saveConfig(endpoint, token);
  document.getElementById('settingsModal').style.display = 'none';
  fetchLeads();
});

/* ── Búsqueda y refresco ───────────────────────── */
document.getElementById('searchInput').addEventListener('input', renderList);
document.getElementById('refreshBtn').addEventListener('click', fetchLeads);
document.getElementById('retryBtn').addEventListener('click', fetchLeads);

/* ── Instalación PWA ───────────────────────────── */
let deferredPrompt;
const installBtn = document.getElementById('installBtn');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBtn.style.display = 'flex';
});
installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  installBtn.style.display = 'none';
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
});
window.addEventListener('appinstalled', () => { installBtn.style.display = 'none'; });

/* ── Service worker ────────────────────────────── */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/leads/service-worker.js').catch(err => console.error('SW error:', err));
  });
}

/* ── Inicio ────────────────────────────────────── */
fetchLeads();
