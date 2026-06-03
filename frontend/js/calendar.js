/* ── Calendar Page JS ── */
const user = api.getUser();
if (user && ['admin', 'committee'].includes(user.role)) {
  document.getElementById('add-event-btn').style.display = '';
}

let currentDate = new Date();
let allEvents = [];
let filterType = '';
let deleteEvId = null;

const TYPE_COLORS = {
  club: '#1565C0', college: '#FF6F00', competition: '#FFD600',
  meeting: '#0288D1', other: '#7B7B7B'
};

document.getElementById('ev-type-select').addEventListener('change', (e) => {
  const type = e.target.value;
  if (TYPE_COLORS[type]) {
    document.getElementById('ev-color').value = TYPE_COLORS[type];
  }
});

// ── Type filter chips ──
document.getElementById('type-filters').addEventListener('click', (e) => {
  const chip = e.target.closest('.type-chip');
  if (!chip) return;
  document.querySelectorAll('.type-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  filterType = chip.dataset.type;
  renderCalendar();
  renderUpcoming();
});

document.getElementById('prev-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); loadEvents(); });
document.getElementById('next-btn').addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); loadEvents(); });

// ── Load events ──
async function loadEvents() {
  document.getElementById('cal-grid').innerHTML =
    '<div class="loading-overlay" style="grid-column:1/-1"><div class="spinner"></div></div>';
  try {
    const m = currentDate.getMonth() + 1;
    const y = currentDate.getFullYear();
    const res = await api.get(`/events?month=${m}&year=${y}`);
    allEvents = res.data || [];
    renderCalendar();
    renderUpcoming();
  } catch (err) {
    showToast('โหลดกิจกรรมไม่สำเร็จ', 'error');
    allEvents = [];
    renderCalendar();
  }
}

// ── Render calendar grid ──
function renderCalendar() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  document.getElementById('cal-title').textContent = `${months[month]} ${year + 543}`;

  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);

  const cells = [];
  // Leading days from prev month
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, -(first.getDay() - 1 - i));
    cells.push({ date: d, other: true });
  }
  // Current month days
  for (let d = 1; d <= last.getDate(); d++) cells.push({ date: new Date(year, month, d), other: false });
  // Trailing days
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) cells.push({ date: new Date(year, month + 1, i), other: true });

  const filtered = filterType ? allEvents.filter(e => e.type === filterType) : allEvents;

  const grid = document.getElementById('cal-grid');
  grid.innerHTML = cells.map(({ date, other }) => {
    const isToday = date.getTime() === today.getTime();
    const dateStr = date.toISOString().split('T')[0];

    // Events on this date
    const dayEvents = filtered.filter(ev => {
      const s = new Date(ev.start_datetime); s.setHours(0, 0, 0, 0);
      const e = new Date(ev.end_datetime); e.setHours(0, 0, 0, 0);
      return date >= s && date <= e;
    });

    const maxShow = 2;
    const visible = dayEvents.slice(0, maxShow);
    const more = dayEvents.length - maxShow;

    const pillsHtml = visible.map(ev => `
      <div class="cal-event-pill" style="background:${ev.color || TYPE_COLORS[ev.type] || '#0288D1'}"
           onclick="event.stopPropagation();viewEvent(${ev.id})" title="${escHtml(ev.title)}">
        ${escHtml(ev.title)}
      </div>`).join('');

    return `
      <div class="cal-cell${other ? ' other-month' : ''}${isToday ? ' today' : ''}"
           data-date="${dateStr}" onclick="handleDayClick('${dateStr}')">
        <div class="cal-day-num">${date.getDate()}</div>
        <div class="cal-events">
          ${pillsHtml}
          ${more > 0 ? `<div class="cal-more">+${more} เพิ่มเติม</div>` : ''}
        </div>
      </div>`;
  }).join('');
}

function handleDayClick(dateStr) {
  const filtered = filterType ? allEvents.filter(e => e.type === filterType) : allEvents;
  const dayEvents = filtered.filter(ev => {
    const s = new Date(ev.start_datetime).toISOString().split('T')[0];
    const e = new Date(ev.end_datetime).toISOString().split('T')[0];
    return dateStr >= s && dateStr <= e;
  });

  const titleEl = document.getElementById('sidebar-date-title');
  const d = new Date(dateStr);
  titleEl.textContent = `กิจกรรมวันที่ ${d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}`;

  renderEventList(dayEvents);
}

// ── Render upcoming/sidebar event list ──
function renderUpcoming() {
  document.getElementById('sidebar-date-title').textContent = 'กิจกรรมที่กำลังจะมาถึง';
  const now = new Date();
  const filtered = (filterType ? allEvents.filter(e => e.type === filterType) : allEvents)
    .filter(ev => new Date(ev.end_datetime) >= now)
    .sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime))
    .slice(0, 5);
  renderEventList(filtered);
}

function renderEventList(events) {
  const list = document.getElementById('event-sidebar-list');
  if (!events.length) {
    list.innerHTML = '<div class="empty-state" style="padding:1.5rem"><div class="empty-state-icon"><i class="fa-regular fa-calendar-days"></i></div><h3>ไม่มีกิจกรรม</h3></div>';
    return;
  }
  list.innerHTML = events.map(ev => `
    <div class="event-sidebar-item" style="border-left-color:${ev.color || TYPE_COLORS[ev.type] || 'var(--sky)'}"
         onclick="viewEvent(${ev.id})">
      <div class="event-sidebar-title">${escHtml(ev.title)}</div>
      <div class="event-sidebar-meta">
        <i class="fa-regular fa-calendar-days"></i> ${formatDateTime(ev.start_datetime)}<br>
        ${ev.location ? '<i class="fa-solid fa-location-dot"></i> ' + escHtml(ev.location) : ''}
      </div>
      <div style="margin-top:0.35rem">
        <span class="badge" style="background:${ev.color || TYPE_COLORS[ev.type]}22;color:${ev.color || TYPE_COLORS[ev.type]};font-size:0.7rem">
          ${EVENT_TYPES[ev.type] || ev.type}
        </span>
      </div>
    </div>`).join('');
}

// ── View Event ──
async function viewEvent(id) {
  try {
    const res = await api.get(`/events/${id}`);
    const ev = res.data;
    document.getElementById('ev-title').textContent = ev.title;

    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);
    const sameDay = start.toDateString() === end.toDateString();
    document.getElementById('ev-date').textContent = sameDay
      ? `${formatDate(ev.start_datetime)} ${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
      : `${formatDateTime(ev.start_datetime)} — ${formatDateTime(ev.end_datetime)}`;

    const locRow = document.getElementById('ev-loc-row');
    if (ev.location) { document.getElementById('ev-location').textContent = ev.location; locRow.style.display = ''; }
    else { locRow.style.display = 'none'; }

    document.getElementById('ev-type').innerHTML = `<span class="badge" style="background:${ev.color || 'var(--sky)'}22;color:${ev.color || 'var(--sky)'}">${EVENT_TYPES[ev.type] || ev.type}</span>`;

    const descRow = document.getElementById('ev-desc-row');
    if (ev.description) { document.getElementById('ev-desc').textContent = ev.description; descRow.style.display = ''; }
    else { descRow.style.display = 'none'; }

    const actions = document.getElementById('ev-actions');
    if (user && ['admin', 'committee'].includes(user.role)) {
      actions.innerHTML = `
        <button class="btn btn-danger btn-sm" onclick="startDeleteEvent(${ev.id}); closeModal('view-event-modal')"><i class="fa-solid fa-trash-can"></i> ลบ</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditEventModal(${ev.id}); closeModal('view-event-modal')"><i class="fa-solid fa-pen"></i> แก้ไข</button>`;
    } else { actions.innerHTML = ''; }

    openModal('view-event-modal');
  } catch (err) { showToast('โหลดกิจกรรมไม่สำเร็จ', 'error'); }
}

// ── Add Event Modal ──
function openAddEventModal() {
  document.getElementById('edit-ev-title').textContent = 'เพิ่มกิจกรรม';
  document.getElementById('ev-edit-id').value = '';
  document.getElementById('ev-name').value = '';
  const now = new Date(); now.setSeconds(0, 0);
  const end = new Date(now); end.setHours(end.getHours() + 2);
  document.getElementById('ev-start').value = toLocalISO(now);
  document.getElementById('ev-end').value = toLocalISO(end);
  document.getElementById('ev-type-select').value = 'club';
  document.getElementById('ev-color').value = TYPE_COLORS['club'];
  document.getElementById('ev-location-input').value = '';
  document.getElementById('ev-desc-input').value = '';
  openModal('edit-event-modal');
}

// ── Edit Event Modal ──
async function openEditEventModal(id) {
  try {
    const res = await api.get(`/events/${id}`);
    const ev = res.data;
    document.getElementById('edit-ev-title').textContent = 'แก้ไขกิจกรรม';
    document.getElementById('ev-edit-id').value = ev.id;
    document.getElementById('ev-name').value = ev.title;
    document.getElementById('ev-start').value = toLocalISO(new Date(ev.start_datetime));
    document.getElementById('ev-end').value = toLocalISO(new Date(ev.end_datetime));
    document.getElementById('ev-type-select').value = ev.type;
    document.getElementById('ev-color').value = ev.color || '#0288D1';
    document.getElementById('ev-location-input').value = ev.location || '';
    document.getElementById('ev-desc-input').value = ev.description || '';
    openModal('edit-event-modal');
  } catch (err) { showToast('โหลดข้อมูลไม่สำเร็จ', 'error'); }
}

// ── Save Event ──
async function saveEvent() {
  const title = document.getElementById('ev-name').value.trim();
  const start = document.getElementById('ev-start').value;
  const end = document.getElementById('ev-end').value;
  const id = document.getElementById('ev-edit-id').value;

  if (!title || !start || !end) { showToast('กรุณากรอกข้อมูลที่จำเป็น', 'warning'); return; }
  if (new Date(start) > new Date(end)) { showToast('วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด', 'warning'); return; }

  const btn = document.getElementById('save-event-btn');
  btn.disabled = true; btn.textContent = 'กำลังบันทึก...';

  try {
    const body = {
      title,
      start_datetime: new Date(start).toISOString(),
      end_datetime: new Date(end).toISOString(),
      type: document.getElementById('ev-type-select').value,
      color: document.getElementById('ev-color').value,
      location: document.getElementById('ev-location-input').value.trim(),
      description: document.getElementById('ev-desc-input').value.trim(),
    };
    if (id) { await api.put(`/events/${id}`, body); showToast('แก้ไขกิจกรรมสำเร็จ', 'success'); }
    else { await api.post('/events', body); showToast('เพิ่มกิจกรรมสำเร็จ', 'success'); }
    closeModal('edit-event-modal');
    loadEvents();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
  } finally {
    btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> บันทึกกิจกรรม';
  }
}

// ── Delete ──
function startDeleteEvent(id) { deleteEvId = id; openModal('delete-event-modal'); }
document.getElementById('confirm-delete-event').addEventListener('click', async () => {
  if (!deleteEvId) return;
  try {
    await api.delete(`/events/${deleteEvId}`);
    showToast('ลบกิจกรรมสำเร็จ', 'success');
    closeModal('delete-event-modal');
    loadEvents();
    deleteEvId = null;
  } catch (err) { showToast(err.message || 'เกิดข้อผิดพลาด', 'error'); }
});

function toLocalISO(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function escHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// ── Init ──
loadEvents();
