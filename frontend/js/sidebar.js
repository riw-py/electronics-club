/* ── Sidebar & Navbar component ── */
class SidebarManager {
  constructor() {
    this.sidebar  = document.getElementById('sidebar');
    this.overlay  = document.getElementById('sidebar-overlay');
    this.navbar   = document.getElementById('navbar');
    this.collapsed = localStorage.getItem('sidebar-collapsed') === 'true';
    this.init();
  }

  init() {
    const user = api.getUser();
    this.renderUserInfo(user);
    this.highlightActive();
    this.applyCollapsed();
    this.bindEvents();
    this.updateNavbarTitle();
    if (user) this.filterNavByRole(user.role);
  }

  renderUserInfo(user) {
    const nameEl  = document.getElementById('sidebar-user-name');
    const roleEl  = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-avatar');
    const nbNameEl = document.getElementById('navbar-user-name');
    const nbRoleEl = document.getElementById('navbar-user-role');
    const nbAvatar = document.getElementById('navbar-avatar');

    if (user) {
      if (nameEl)  nameEl.textContent  = user.full_name;
      if (roleEl)  roleEl.textContent  = ROLE_LABELS[user.role] || user.role;
      if (nbNameEl) nbNameEl.textContent = user.full_name;
      if (nbRoleEl) nbRoleEl.textContent = ROLE_LABELS[user.role] || user.role;

      const initials = user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2);
      [avatarEl, nbAvatar].forEach(el => {
        if (!el) return;
        if (user.avatar) {
          el.outerHTML = `<img src="${user.avatar}" class="avatar avatar-sm" id="${el.id}" alt="avatar">`;
        } else {
          el.textContent = initials;
        }
      });
    }
  }

  highlightActive() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.classList.toggle('active', item.dataset.page === current);
    });
  }

  filterNavByRole(role) {
    document.querySelectorAll('[data-role]').forEach(el => {
      const allowed = el.dataset.role.split(',');
      el.style.display = allowed.includes(role) ? '' : 'none';
    });
  }

  updateNavbarTitle() {
    const titles = {
      'index.html':     'หน้าหลัก',
      'news.html':      'ข่าวสารและประชาสัมพันธ์',
      'events.html':    'ปฏิทินกิจกรรม',
      'documents.html': 'คลังเอกสาร',
      'dashboard.html': 'Dashboard',
      'profile.html':   'โปรไฟล์',
    };
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const titleEl = document.getElementById('navbar-page-title');
    if (titleEl) titleEl.textContent = titles[page] || 'Electronics Club';
  }

  applyCollapsed() {
    if (this.sidebar && this.navbar) {
      if (this.collapsed && window.innerWidth > 768) {
        this.sidebar.classList.add('collapsed');
        this.navbar.classList.add('sidebar-collapsed');
      }
    }
  }

  toggle() {
    if (window.innerWidth <= 768) {
      this.sidebar.classList.toggle('mobile-open');
      this.overlay.classList.toggle('active');
    } else {
      this.collapsed = !this.collapsed;
      localStorage.setItem('sidebar-collapsed', this.collapsed);
      this.sidebar.classList.toggle('collapsed', this.collapsed);
      this.navbar.classList.toggle('sidebar-collapsed', this.collapsed);
    }
  }

  bindEvents() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', () => this.toggle());
    if (this.overlay) this.overlay.addEventListener('click', () => {
      this.sidebar.classList.remove('mobile-open');
      this.overlay.classList.remove('active');
    });

    // User dropdown
    const userMenu = document.getElementById('navbar-user');
    const dropdown = document.getElementById('user-dropdown');
    if (userMenu && dropdown) {
      userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => dropdown.classList.remove('open'));
    }

    // Logout
    document.querySelectorAll('[data-action="logout"]').forEach(el => {
      el.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    });
  }
}

// Initialize on DOM ready (for pages that have sidebar)
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('sidebar')) {
    window.sidebarManager = new SidebarManager();
  }
});
