/* ── News Page JS ── */
let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let searchTimer;
let deleteTargetId = null;
const user = api.getUser();

// Show add button for committee+
if (user && ['admin','committee'].includes(user.role)) {
  document.getElementById('add-news-btn').style.display = '';
}

// Category filter chips
document.getElementById('category-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  currentCategory = chip.dataset.cat;
  currentPage = 1;
  loadNews();
});

// Search debounce
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadNews();
  }, 400);
});

// ── Load News ──
async function loadNews() {
  const grid = document.getElementById('news-grid');
  grid.innerHTML = '<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>';

  try {
    let url = `/news?page=${currentPage}&limit=9`;
    if (currentCategory) url += `&category=${currentCategory}`;
    if (currentSearch)   url += `&search=${encodeURIComponent(currentSearch)}`;

    const res = await api.get(url);
    renderNews(res.data, res.pagination);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
      <h3>โหลดข่าวสารไม่สำเร็จ</h3>
      <p>${err.message || 'กรุณาตรวจสอบการเชื่อมต่อ'}</p>
    </div>`;
  }
}

function escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function renderNews(items, pagination) {
  const grid = document.getElementById('news-grid');
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon"><i class="fa-solid fa-newspaper"></i></div>
      <h3>ยังไม่มีข่าวสาร</h3>
      <p>ยังไม่มีข่าวสารในหมวดหมู่นี้</p>
    </div>`;
    document.getElementById('pagination-container').innerHTML = '';
    return;
  }

  const catColors = { announcement:'badge-red', activity:'badge-blue', achievement:'badge-yellow', general:'badge-gray' };

  grid.innerHTML = items.map(n => {
    const cleanExcerpt = (n.excerpt || '').replace(/<[^>]*>?/gm, '');
    const displayExcerpt = cleanExcerpt.substring(0, 100) + (cleanExcerpt.length > 100 ? '...' : '');
    const imageUrl = n.image_url ? (n.image_url.startsWith('http') ? n.image_url : API_BASE.replace('/api', '') + n.image_url) : null;
    
    return `
    <div class="news-card animate-slide-up" data-id="${n.id}">
      ${imageUrl
        ? `<img src="${imageUrl}" class="news-card-img" alt="${escHtml(n.title)}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
           <div class="news-card-img-placeholder" style="display:none"><i class="fa-solid fa-newspaper"></i></div>`
        : `<div class="news-card-img-placeholder"><i class="fa-solid fa-newspaper"></i></div>`
      }
      <div class="news-card-body">
        <div class="news-card-category">${NEWS_CATEGORIES[n.category] || n.category}</div>
        <h3 class="news-card-title truncate" title="${escHtml(n.title)}">${escHtml(n.title)}</h3>
        <p class="news-card-excerpt">${escHtml(displayExcerpt)}</p>
      </div>
      <div class="news-card-footer">
        <div style="display:flex;align-items:center;gap:0.4rem">
          <span class="badge ${catColors[n.category]||'badge-gray'}" style="font-size:0.7rem">${NEWS_CATEGORIES[n.category]||n.category}</span>
          ${!n.is_published ? '<span class="badge badge-orange" style="font-size:0.7rem">ฉบับร่าง</span>' : ''}
        </div>
        <div style="display:flex;gap:0.4rem;align-items:center">
          <span style="font-size:0.75rem;color:var(--text-muted)"><i class="fa-regular fa-eye"></i> ${n.view_count||0}</span>
          <button class="btn btn-ghost btn-sm" onclick="viewNews(${n.id})">อ่าน</button>
        </div>
      </div>
    </div>
    `;
  }).join('');

  renderPagination(document.getElementById('pagination-container'), pagination, (p) => {
    currentPage = p;
    loadNews();
  });
}

// ── View News ──
async function viewNews(id) {
  try {
    const res = await api.get(`/news/${id}`);
    const n = res.data;
    document.getElementById('view-category-badge').innerHTML = `<span class="badge badge-blue">${NEWS_CATEGORIES[n.category]||n.category}</span>`;
    document.getElementById('view-title').textContent   = n.title;
    document.getElementById('view-author').innerHTML  = `<i class="fa-solid fa-pen-nib"></i> ${escHtml(n.author_name)}`;
    document.getElementById('view-date').innerHTML    = `<i class="fa-regular fa-calendar-days"></i> ${formatDateTime(n.created_at)}`;
    document.getElementById('view-views').innerHTML   = `<i class="fa-regular fa-eye"></i> ${(n.view_count||0)+1} ครั้ง`;
    document.getElementById('view-content').innerHTML   = n.content || '';
    const imgEl = document.getElementById('view-img');
    if (n.image_url) { imgEl.src = n.image_url; imgEl.classList.remove('hidden'); }
    else              { imgEl.classList.add('hidden'); }

    // Edit/delete buttons for owner or admin
    const actions = document.getElementById('view-actions');
    if (user && ['admin','committee'].includes(user.role)) {
      actions.innerHTML = `
        <button class="btn btn-danger btn-sm" onclick="startDelete(${n.id}); closeModal('view-modal')"><i class="fa-solid fa-trash-can"></i> ลบ</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditModal(${n.id}); closeModal('view-modal')"><i class="fa-solid fa-pen"></i> แก้ไข</button>`;
    } else { actions.innerHTML = ''; }

    openModal('view-modal');
  } catch (err) {
    showToast('โหลดข่าวไม่สำเร็จ', 'error');
  }
}

// ── Add Modal ──
function openAddModal() {
  document.getElementById('edit-modal-title').textContent = 'เพิ่มข่าวสาร';
  document.getElementById('edit-id').value = '';
  document.getElementById('edit-title').value = '';
  document.getElementById('edit-category').value = 'general';
  document.getElementById('edit-published').checked = true;
  document.getElementById('news-content-editor').innerHTML = '';
  document.getElementById('img-preview-container').innerHTML = '';
  document.getElementById('edit-image').value = '';
  openModal('edit-modal');
}

// ── Edit Modal ──
async function openEditModal(id) {
  try {
    const res = await api.get(`/news/${id}`);
    const n = res.data;
    document.getElementById('edit-modal-title').textContent = 'แก้ไขข่าวสาร';
    document.getElementById('edit-id').value = n.id;
    document.getElementById('edit-title').value = n.title;
    document.getElementById('edit-category').value = n.category;
    document.getElementById('edit-published').checked = Boolean(n.is_published);
    document.getElementById('news-content-editor').innerHTML = n.content || '';
    const prev = document.getElementById('img-preview-container');
    if (n.image_url) {
      prev.innerHTML = `<div class="img-preview"><img src="${n.image_url}" alt="preview"><button class="img-preview-remove" onclick="clearImage()"><i class="fa-solid fa-xmark"></i></button></div>`;
    } else { prev.innerHTML = ''; }
    openModal('edit-modal');
  } catch (err) { showToast('โหลดข้อมูลไม่สำเร็จ', 'error'); }
}

// ── Save News ──
async function saveNews() {
  const title   = document.getElementById('edit-title').value.trim();
  const content = document.getElementById('news-content-editor').innerHTML.trim();
  const id      = document.getElementById('edit-id').value;

  if (!title) { showToast('กรุณากรอกหัวข้อข่าว', 'warning'); return; }
  if (!content || content === '<br>') { showToast('กรุณากรอกเนื้อหาข่าว', 'warning'); return; }

  const saveBtn = document.getElementById('save-news-btn');
  saveBtn.disabled = true; saveBtn.textContent = 'กำลังบันทึก...';

  try {
    const formData = new FormData();
    formData.append('title',        title);
    formData.append('content',      content);
    formData.append('category',     document.getElementById('edit-category').value);
    formData.append('is_published', document.getElementById('edit-published').checked);
    const imgFile = document.getElementById('edit-image').files[0];
    if (imgFile) formData.append('image', imgFile);

    if (id) {
      await api.putForm(`/news/${id}`, formData);
      showToast('แก้ไขข่าวสารสำเร็จ', 'success');
    } else {
      await api.postForm('/news', formData);
      showToast('เพิ่มข่าวสารสำเร็จ', 'success');
    }
    closeModal('edit-modal');
    loadNews();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกข่าว';
  }
}

// ── Delete ──
function startDelete(id) {
  deleteTargetId = id;
  openModal('delete-modal');
}
document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
  if (!deleteTargetId) return;
  try {
    await api.delete(`/news/${deleteTargetId}`);
    showToast('ลบข่าวสารสำเร็จ', 'success');
    closeModal('delete-modal');
    loadNews();
    deleteTargetId = null;
  } catch (err) { showToast(err.message || 'เกิดข้อผิดพลาด', 'error'); }
});

// ── Image upload preview ──
document.getElementById('edit-image').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  document.getElementById('img-preview-container').innerHTML =
    `<div class="img-preview"><img src="${url}" alt="preview"><button class="img-preview-remove" onclick="clearImage()"><i class="fa-solid fa-xmark"></i></button></div>`;
});

const dz = document.getElementById('img-dropzone');
dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));
dz.addEventListener('drop', (e) => {
  e.preventDefault(); dz.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    const dt = new DataTransfer(); dt.items.add(file);
    document.getElementById('edit-image').files = dt.files;
    document.getElementById('edit-image').dispatchEvent(new Event('change'));
  }
});

function clearImage() {
  document.getElementById('edit-image').value = '';
  document.getElementById('img-preview-container').innerHTML = '';
}

// ── Inline rich text editor ──
function execCmd(cmd) {
  document.getElementById('news-content-editor').focus();
  document.execCommand(cmd, false, null);
}

// Initialize
loadNews();
