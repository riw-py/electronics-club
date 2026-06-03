/* ── API Helper ── */
const API_BASE = 'https://electronics-club-itsh.onrender.com/api';

const api = {
  getToken: () => localStorage.getItem('ecms_token'),
  setToken: (t) => localStorage.setItem('ecms_token', t),
  removeToken: () => localStorage.removeItem('ecms_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('ecms_user')); } catch { return null; } },
  setUser: (u) => localStorage.setItem('ecms_user', JSON.stringify(u)),
  removeUser: () => localStorage.removeItem('ecms_user'),

  headers(extra = {}) {
    const h = { ...extra };
    const tok = this.getToken();
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    return h;
  },

  async request(method, path, body, isForm = false) {
    const opts = { method, headers: this.headers() };
    if (body) {
      if (isForm) {
        opts.body = body; // FormData
      } else {
        opts.headers['Content-Type'] = 'application/json';
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw { status: res.status, ...data };
    return data;
  },

  get:    (path)        => api.request('GET',    path),
  post:   (path, body)  => api.request('POST',   path, body),
  postForm:(path, form) => api.request('POST',   path, form, true),
  put:    (path, body)  => api.request('PUT',    path, body),
  putForm:(path, form)  => api.request('PUT',    path, form, true),
  delete: (path)        => api.request('DELETE', path),
};

/* ── Toast ── */
function showToast(message, type = 'info', duration = 4000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '<i class="fa-solid fa-check"></i>', error: '<i class="fa-solid fa-circle-xmark"></i>', warning: '<i class="fa-solid fa-triangle-exclamation"></i>', info: '<i class="fa-solid fa-circle-info"></i>' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;
  toast.addEventListener('click', () => removeToast(toast));
  container.appendChild(toast);
  setTimeout(() => removeToast(toast), duration);
}

function removeToast(el) {
  el.classList.add('removing');
  setTimeout(() => el.remove(), 300);
}

/* ── Format helpers ── */
function formatDate(d, opts = {}) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric', month: 'long', day: 'numeric', ...opts
  });
}
function formatDateTime(d) {
  if (!d) return '-';
  return new Date(d).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1024 / 1024).toFixed(2) + ' MB';
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'เมื่อกี้';
  if (m < 60) return `${m} นาทีที่แล้ว`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ชั่วโมงที่แล้ว`;
  const dy = Math.floor(h / 24);
  if (dy < 7) return `${dy} วันที่แล้ว`;
  return formatDate(d);
}

/* ── Role Label ── */
const ROLE_LABELS = { admin: 'ผู้ดูแลระบบ', committee: 'คณะกรรมการ', member: 'สมาชิก' };
const ROLE_BADGE  = { admin: 'badge-red', committee: 'badge-yellow', member: 'badge-blue' };
function roleBadge(role) {
  return `<span class="badge ${ROLE_BADGE[role]||'badge-gray'}">${ROLE_LABELS[role]||role}</span>`;
}

/* ── Category labels ── */
const NEWS_CATEGORIES = { announcement: 'ประกาศ', activity: 'กิจกรรม', achievement: 'ผลงาน', general: 'ทั่วไป' };
const EVENT_TYPES = { club: 'กิจกรรมชมรม', college: 'กิจกรรมวิทยาลัย', competition: 'การแข่งขัน', meeting: 'ประชุม', other: 'อื่นๆ' };
const DOC_CATEGORIES = { report: 'รายงาน', manual: 'คู่มือ', form: 'แบบฟอร์ม', meeting_minutes: 'รายงานการประชุม', research: 'งานวิจัย', other: 'อื่นๆ' };

/* ── Auth guard ── */
function requireAuth() {
  const token = api.getToken();
  const user  = api.getUser();
  if (!token || !user) {
    window.location.href = '/login.html';
    return null;
  }
  return user;
}
function requireRole(...roles) {
  const user = requireAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) {
    showToast('คุณไม่มีสิทธิ์เข้าถึงส่วนนี้', 'error');
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

/* ── Modal helpers ── */
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
  document.body.style.overflow = '';
}
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
      document.body.style.overflow = '';
    });
  }
});

/* ── Animated counter ── */
function animateCount(el, target, duration = 1200) {
  const start = parseInt(el.textContent) || 0;
  const step  = (target - start) / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += step;
    if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.round(current).toLocaleString();
    }
  }, 16);
}

/* ── Render pagination ── */
function renderPagination(container, pagination, onPageChange) {
  if (!pagination || pagination.pages <= 1) { container.innerHTML = ''; return; }
  const { page, pages } = pagination;
  let html = `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page-1}">‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="color:var(--text-muted);padding:0 0.25rem">…</span>`;
    }
  }
  html += `<button class="page-btn" ${page >= pages ? 'disabled' : ''} data-page="${page+1}">›</button>`;
  container.innerHTML = `<div class="pagination">${html}</div>`;
  container.querySelectorAll('.page-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}

/* ── Logout ── */
function logout() {
  api.removeToken();
  api.removeUser();
  window.location.href = '/login.html';
}

window.api = api;
window.showToast = showToast;
window.formatDate = formatDate;
window.formatDateTime = formatDateTime;
window.formatFileSize = formatFileSize;
window.timeAgo = timeAgo;
window.roleBadge = roleBadge;
window.requireAuth = requireAuth;
window.requireRole = requireRole;
window.openModal = openModal;
window.closeModal = closeModal;
window.animateCount = animateCount;
window.renderPagination = renderPagination;
window.logout = logout;
window.NEWS_CATEGORIES = NEWS_CATEGORIES;
window.EVENT_TYPES = EVENT_TYPES;
window.DOC_CATEGORIES = DOC_CATEGORIES;
window.ROLE_LABELS = ROLE_LABELS;
