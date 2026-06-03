/* ── Shared Sidebar + Navbar HTML injector ── */
/* Include this before sidebar.js in every authenticated page */

function injectLayout() {
  const user = api.getUser();

  const sidebarHTML = `
  <aside class="sidebar" id="sidebar">
    <a href="index.html" class="sidebar-logo">
      <div class="sidebar-logo-icon"><i class="fa-solid fa-bolt"></i></div>
      <div class="sidebar-logo-text">
        <div class="sidebar-logo-title">Electronics Club</div>
        <div class="sidebar-logo-sub">ชมรมวิชาชีพอิเล็กทรอนิกส์</div>
      </div>
    </a>

    <nav class="sidebar-nav">
      <div class="sidebar-section">
        <div class="sidebar-section-label">เมนูหลัก</div>
        <a href="index.html"     class="nav-item" data-page="index.html">
          <span class="nav-item-icon"><i class="fa-solid fa-house"></i></span> หน้าหลัก
        </a>
        <a href="news.html"      class="nav-item" data-page="news.html">
          <span class="nav-item-icon"><i class="fa-solid fa-newspaper"></i></span> ข่าวสาร
        </a>
        <a href="events.html"    class="nav-item" data-page="events.html">
          <span class="nav-item-icon"><i class="fa-regular fa-calendar-days"></i></span> ปฏิทินกิจกรรม
        </a>
        <a href="documents.html" class="nav-item" data-page="documents.html">
          <span class="nav-item-icon"><i class="fa-regular fa-folder-open"></i></span> คลังเอกสาร
        </a>
      </div>

      <div class="sidebar-section" data-role="admin,committee">
        <div class="sidebar-section-label">จัดการระบบ</div>
        <a href="dashboard.html" class="nav-item" data-page="dashboard.html" data-role="admin,committee">
          <span class="nav-item-icon"><i class="fa-solid fa-chart-line"></i></span> Dashboard
        </a>
        <a href="members.html" class="nav-item" data-page="members.html" data-role="admin">
          <span class="nav-item-icon"><i class="fa-solid fa-users"></i></span> จัดการสมาชิก
        </a>
      </div>

      <div class="sidebar-section">
        <div class="sidebar-section-label">บัญชีผู้ใช้</div>
        <a href="profile.html" class="nav-item" data-page="profile.html">
          <span class="nav-item-icon"><i class="fa-regular fa-user"></i></span> โปรไฟล์
        </a>
        <button class="nav-item" data-action="logout">
          <span class="nav-item-icon"><i class="fa-solid fa-right-from-bracket"></i></span> ออกจากระบบ
        </button>
      </div>
    </nav>

    <div class="sidebar-footer">
      <a href="profile.html" class="sidebar-user">
        <div class="avatar-placeholder avatar-sm" id="sidebar-avatar" style="font-size:0.75rem">
          ${user ? user.full_name?.charAt(0) : '?'}
        </div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name" id="sidebar-user-name">${user?.full_name || 'ผู้ใช้งาน'}</div>
          <div class="sidebar-user-role" id="sidebar-user-role">${user?.role || ''}</div>
        </div>
      </a>
    </div>
  </aside>

  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <nav class="navbar" id="navbar">
    <button class="navbar-toggle" id="sidebar-toggle" aria-label="Toggle sidebar"><i class="fa-solid fa-bars"></i></button>
    <span class="navbar-title" id="navbar-page-title"></span>
    <div class="navbar-spacer"></div>
    <button class="navbar-notif" id="notif-btn" aria-label="การแจ้งเตือน">
      <i class="fa-regular fa-bell"></i>
      <span class="notif-badge hidden" id="notif-count">0</span>
    </button>
    <div class="navbar-user" id="navbar-user" style="position:relative">
      <div class="avatar-placeholder avatar-sm" id="navbar-avatar" style="font-size:0.75rem">
        ${user ? user.full_name?.charAt(0) : '?'}
      </div>
      <div>
        <div class="navbar-user-name" id="navbar-user-name">${user?.full_name || 'ผู้ใช้งาน'}</div>
        <div class="navbar-user-role" id="navbar-user-role">${user?.role || ''}</div>
      </div>
      <span style="color:var(--text-muted);font-size:0.75rem"><i class="fa-solid fa-chevron-down"></i></span>
      <div class="user-dropdown" id="user-dropdown">
        <a href="profile.html"><i class="fa-regular fa-user"></i> โปรไฟล์</a>
        <hr>
        <button data-action="logout" class="danger"><i class="fa-solid fa-right-from-bracket"></i> ออกจากระบบ</button>
      </div>
    </div>
  </nav>
  <div id="toast-container"></div>
  `;

  const wrapper = document.createElement('div');
  wrapper.innerHTML = sidebarHTML;
  document.body.prepend(...wrapper.childNodes);
  document.body.classList.add('has-sidebar');
}

// Auto-inject if user is logged in
document.addEventListener('DOMContentLoaded', () => {
  if (!api.getToken() || !api.getUser()) {
    window.location.href = '/login.html';
    return;
  }
  injectLayout();
});
