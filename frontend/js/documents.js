/* ── Documents Page JS ── */
const user = requireRole('admin');
if (!user) throw new Error('Unauthorized'); // Stop execution if unauthorized
let currentPage = 1;
let currentCategory = '';
let currentSearch = '';
let currentSort = 'newest';
let viewMode = 'grid';
let deleteDocId = null;
let searchTimer;

const FILE_ICONS = {
  PDF: '<i class="fa-solid fa-file-pdf"></i>', DOC: '<i class="fa-solid fa-file-word"></i>', DOCX: '<i class="fa-solid fa-file-word"></i>', XLS: '<i class="fa-solid fa-file-excel"></i>', XLSX: '<i class="fa-solid fa-file-excel"></i>',
  PPT: '<i class="fa-solid fa-file-powerpoint"></i>', PPTX: '<i class="fa-solid fa-file-powerpoint"></i>', TXT: '<i class="fa-solid fa-file-lines"></i>', JPG: '<i class="fa-regular fa-image"></i>', PNG: '<i class="fa-regular fa-image"></i>', FILE: '<i class="fa-solid fa-paperclip"></i>'
};
const FILE_ICON_CLASS = {
  PDF: 'pdf', DOC: 'doc', DOCX: 'docx', XLS: 'xls', XLSX: 'xlsx',
  PPT: 'ppt', PPTX: 'pptx', TXT: 'txt', JPG: 'jpg', PNG: 'png', FILE: 'file'
};

function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ── Load docs ──
async function loadDocs() {
  const container = document.getElementById('doc-container');
  container.className = viewMode === 'grid' ? 'doc-grid stagger' : 'table-wrap';
  if (viewMode === 'grid') container.innerHTML = '<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>';
  else container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div></div>';

  try {
    let url = `/documents?page=${currentPage}&limit=${viewMode==='grid'?12:15}`;
    if (currentCategory) url += `&category=${currentCategory}`;
    if (currentSearch)   url += `&search=${encodeURIComponent(currentSearch)}`;
    const res = await api.get(url);
    renderDocs(res.data, res.pagination);
    loadStats(res.data, res.pagination?.total);
  } catch (err) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon"><i class="fa-solid fa-triangle-exclamation"></i></div><h3>โหลดไม่สำเร็จ</h3><p>${err.message||''}</p></div>`;
  }
}

function loadStats(items, total) {
  if (total !== undefined) {
    document.getElementById('stat-total').textContent = total;
  }
}

function renderDocs(items, pagination) {
  const container = document.getElementById('doc-container');
  if (!items.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-state-icon"><i class="fa-regular fa-folder-open"></i></div>
      <h3>ยังไม่มีเอกสาร</h3>
      <p>อัปโหลดเอกสารแรกของคุณได้เลย</p>
    </div>`;
    document.getElementById('pagination-container').innerHTML = '';
    return;
  }

  if (viewMode === 'grid') {
    container.innerHTML = items.map(doc => renderDocCard(doc)).join('');
  } else {
    container.innerHTML = `
      <table>
        <thead><tr>
          <th>ไฟล์</th><th>ชื่อเอกสาร</th><th>หมวดหมู่</th>
          <th>อัปโหลดโดย</th><th>วันที่</th><th>ขนาด</th><th>ดาวน์โหลด</th><th>จัดการ</th>
        </tr></thead>
        <tbody>${items.map(doc => renderDocRow(doc)).join('')}</tbody>
      </table>`;
  }

  renderPagination(document.getElementById('pagination-container'), pagination, (p) => {
    currentPage = p;
    loadDocs();
  });
}

function renderDocCard(doc) {
  const ftClass = FILE_ICON_CLASS[doc.file_type] || 'file';
  const ftIcon  = FILE_ICONS[doc.file_type] || '<i class="fa-solid fa-paperclip"></i>';
  const canDelete = user && (user.id === doc.uploaded_by_id || user.role === 'admin');
  return `
  <div class="doc-card animate-slide-up">
    <div class="doc-card-top">
      <div class="file-icon ${ftClass}">${ftIcon}<br><span style="font-size:0.55rem">${doc.file_type}</span></div>
      <div class="doc-card-info">
        <div class="doc-card-title" title="${escHtml(doc.title)}">${escHtml(doc.title)}</div>
        ${doc.description ? `<div class="doc-card-desc">${escHtml(doc.description).substring(0,60)}...</div>` : ''}
      </div>
    </div>
    <div class="doc-card-meta">
      <span class="badge ${getCatBadge(doc.category)}">${DOC_CATEGORIES[doc.category]||doc.category}</span>
      <span><i class="fa-regular fa-user"></i> ${escHtml(doc.uploader_name||'')}</span>
      <span><i class="fa-regular fa-calendar-days"></i> ${formatDate(doc.created_at)}</span>
      <span><i class="fa-solid fa-box-archive"></i> ${formatFileSize(doc.file_size)}</span>
      <span><i class="fa-solid fa-download"></i> ${doc.download_count}</span>
    </div>
    <div class="doc-card-actions">
      <a href="${API_BASE}/documents/${doc.id}/download" class="btn btn-primary btn-sm w-full"
         onclick="trackDownload(${doc.id})" target="_blank">
        <i class="fa-solid fa-download"></i> ดาวน์โหลด
      </a>
      ${canDelete ? `<button class="btn btn-danger btn-sm btn-icon" onclick="startDeleteDoc(${doc.id})" title="ลบ"><i class="fa-solid fa-trash-can"></i></button>` : ''}
    </div>
  </div>`;
}

function renderDocRow(doc) {
  const ftClass = FILE_ICON_CLASS[doc.file_type] || 'file';
  const canDelete = user && (user.id === doc.uploaded_by_id || user.role === 'admin');
  return `
  <tr>
    <td><div class="file-icon ${ftClass}" style="width:36px;height:36px;font-size:0.8rem">${doc.file_type}</div></td>
    <td>
      <div style="font-weight:600;font-size:0.875rem">${escHtml(doc.title)}</div>
      <div class="fs-xs text-muted">${escHtml(doc.original_name)}</div>
    </td>
    <td><span class="badge ${getCatBadge(doc.category)}">${DOC_CATEGORIES[doc.category]||doc.category}</span></td>
    <td class="fs-sm">${escHtml(doc.uploader_name||'')}</td>
    <td class="fs-sm text-muted">${formatDate(doc.created_at)}</td>
    <td class="fs-sm">${formatFileSize(doc.file_size)}</td>
    <td><span class="badge badge-blue"><i class="fa-solid fa-download"></i> ${doc.download_count}</span></td>
    <td style="display:flex;gap:0.4rem">
      <a href="${API_BASE}/documents/${doc.id}/download" class="btn btn-primary btn-sm" target="_blank"><i class="fa-solid fa-download"></i></a>
      ${canDelete ? `<button class="btn btn-danger btn-sm btn-icon" onclick="startDeleteDoc(${doc.id})"><i class="fa-solid fa-trash-can"></i></button>` : ''}
    </td>
  </tr>`;
}

function getCatBadge(cat) {
  const map = { report:'badge-blue', manual:'badge-teal', form:'badge-green', meeting_minutes:'badge-orange', research:'badge-yellow', other:'badge-gray' };
  return map[cat] || 'badge-gray';
}

function trackDownload(id) {
  // Optimistically update counter in UI
  setTimeout(() => { loadDocs(); }, 1000);
}

// ── View toggle ──
function setView(mode) {
  viewMode = mode;
  document.getElementById('grid-view-btn').classList.toggle('active', mode === 'grid');
  document.getElementById('list-view-btn').classList.toggle('active', mode === 'list');
  loadDocs();
}

// ── Category tabs ──
document.getElementById('cat-tabs').addEventListener('click', (e) => {
  const tab = e.target.closest('.cat-tab');
  if (!tab) return;
  document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  currentCategory = tab.dataset.cat;
  currentPage = 1;
  loadDocs();
});

// ── Search ──
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    currentSearch = e.target.value.trim();
    currentPage = 1;
    loadDocs();
  }, 400);
});

// ── Sort ──
document.getElementById('sort-select').addEventListener('change', (e) => {
  currentSort = e.target.value;
  loadDocs();
});

// ── File input ──
const fileInput = document.getElementById('file-input');
const uploadZone = document.getElementById('upload-zone');

fileInput.addEventListener('change', (e) => {
  handleFileSelected(e.target.files[0]);
});

uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault(); uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) {
    const dt = new DataTransfer(); dt.items.add(file);
    fileInput.files = dt.files;
    handleFileSelected(file);
  }
});

function handleFileSelected(file) {
  if (!file) return;
  const nameEl = document.getElementById('selected-file-name');
  nameEl.innerHTML = `<i class="fa-solid fa-paperclip"></i> ${file.name} (${formatFileSize(file.size)})`;
  nameEl.style.display = 'block';
  document.getElementById('upload-icon').innerHTML = '<i class="fa-solid fa-check"></i>';

  // Auto-fill title from filename
  const titleEl = document.getElementById('doc-title');
  if (!titleEl.value) {
    titleEl.value = file.name.replace(/\.[^.]+$/, '');
  }

  // Auto-detect category from extension
  const ext = file.name.split('.').pop().toUpperCase();
  const catEl = document.getElementById('doc-category');
  if (['PPT','PPTX'].includes(ext)) catEl.value = 'report';
  else if (['XLS','XLSX'].includes(ext)) catEl.value = 'report';
  else if (['DOC','DOCX'].includes(ext)) catEl.value = 'report';
}

// ── Upload ──
async function doUpload() {
  const file  = fileInput.files[0];
  const title = document.getElementById('doc-title').value.trim();
  if (!file)  { showToast('กรุณาเลือกไฟล์', 'warning'); return; }
  if (!title) { showToast('กรุณาระบุชื่อเอกสาร', 'warning'); return; }

  const btn = document.getElementById('do-upload-btn');
  btn.disabled = true; btn.textContent = 'กำลังอัปโหลด...';

  const progressEl = document.getElementById('upload-progress');
  const fillEl     = document.getElementById('progress-fill');
  const labelEl    = document.getElementById('progress-label');
  progressEl.classList.add('show');

  // Simulate progress
  let progress = 0;
  const interval = setInterval(() => {
    progress = Math.min(progress + 15, 90);
    fillEl.style.width = progress + '%';
  }, 200);

  try {
    const form = new FormData();
    form.append('file',        file);
    form.append('title',       title);
    form.append('description', document.getElementById('doc-desc').value.trim());
    form.append('category',    document.getElementById('doc-category').value);

    await api.postForm('/documents', form);
    clearInterval(interval);
    fillEl.style.width = '100%';
    labelEl.innerHTML = 'อัปโหลดสำเร็จ! <i class="fa-solid fa-check"></i>';

    setTimeout(() => {
      closeModal('upload-modal');
      resetUploadForm();
      loadDocs();
      showToast('อัปโหลดเอกสารสำเร็จ', 'success');
    }, 600);
  } catch (err) {
    clearInterval(interval);
    progressEl.classList.remove('show');
    showToast(err.message || 'อัปโหลดไม่สำเร็จ', 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i> อัปโหลด';
  }
}

function resetUploadForm() {
  fileInput.value = '';
  document.getElementById('selected-file-name').style.display = 'none';
  document.getElementById('upload-icon').innerHTML = '<i class="fa-solid fa-file-arrow-up"></i>';
  document.getElementById('doc-title').value = '';
  document.getElementById('doc-desc').value = '';
  document.getElementById('doc-category').value = 'other';
  document.getElementById('upload-progress').classList.remove('show');
  document.getElementById('progress-fill').style.width = '0%';
}

// ── Delete ──
function startDeleteDoc(id) {
  deleteDocId = id;
  openModal('delete-doc-modal');
}

document.getElementById('confirm-delete-doc').addEventListener('click', async () => {
  if (!deleteDocId) return;
  try {
    await api.delete(`/documents/${deleteDocId}`);
    showToast('ลบเอกสารสำเร็จ', 'success');
    closeModal('delete-doc-modal');
    deleteDocId = null;
    loadDocs();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
  }
});

// ── Init ──
loadDocs();
