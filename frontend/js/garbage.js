const user = requireRole();

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
    
    if (btn.dataset.tab === 'tab-schedule') loadSchedule();
    else if (btn.dataset.tab === 'tab-scoreboard') loadScoreboard();
    else if (btn.dataset.tab === 'tab-reports') loadReports();
    else if (btn.dataset.tab === 'tab-dashboard') loadDashboard();
  });
});

let selectedFile = null;

document.getElementById('garbage-file').addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];
    document.getElementById('garbage-file-name').textContent = selectedFile.name;
    document.getElementById('garbage-upload-zone').style.borderColor = 'var(--primary)';
  }
});

// Load Dashboard Data
async function loadDashboard() {
  try {
    const res = await api.get('/garbage/dashboard');
    const { duties } = res.data;
    
    const container = document.getElementById('today-duties');
    const select = document.getElementById('report-duty-id');
    
    // Clear select
    select.innerHTML = '<option value="">-- ไม่ระบุ (ช่วยงานพิเศษ) --</option>';
    
    if (duties.length === 0) {
      container.innerHTML = '<div style="text-align:center;width:100%;color:var(--text-muted)">ไม่มีเวรสำหรับวันนี้</div>';
      return;
    }

    container.innerHTML = duties.map(d => {
      const shiftName = d.shift === 'morning' ? 'เช้า (ก่อน 12:30)' : 'บ่าย (ก่อน 15:30)';
      select.innerHTML += `<option value="${d.id}">เวร${shiftName} - ${d.classroom}</option>`;
      
      return `
        <div class="duty-card">
          <div class="duty-title">เวร${d.shift === 'morning' ? 'เช้า' : 'บ่าย'}</div>
          <div class="duty-room">${d.classroom}</div>
        </div>
      `;
    }).join('');
    
    // Auto select user classroom if available
    if (user && user.classroom) {
      document.getElementById('report-classroom').value = user.classroom;
    }

  } catch (err) {
    console.error(err);
  }
}

// Load Schedule
async function loadSchedule() {
  const tbody = document.getElementById('schedule-tbody');
  try {
    const res = await api.get('/garbage/schedule');
    if (res.data.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">ยังไม่มีข้อมูลเวร</td></tr>';
      return;
    }
    
    tbody.innerHTML = res.data.map(d => {
      const dateStr = new Date(d.duty_date).toLocaleDateString('th-TH');
      const shiftStr = d.shift === 'morning' ? '<span class="badge badge-yellow">เช้า</span>' : '<span class="badge badge-blue">บ่าย</span>';
      
      let actionBtn = '';
      if (user && (user.role === 'admin' || user.role === 'committee')) {
        actionBtn = `<td class="admin-only"><button class="btn btn-danger btn-sm btn-icon" onclick="deleteDuty(${d.id})"><i class="fa-solid fa-trash"></i></button></td>`;
      } else {
        actionBtn = '<td class="admin-only" style="display:none"></td>';
      }

      return `<tr>
        <td>${dateStr}</td>
        <td>${shiftStr}</td>
        <td>${d.classroom}</td>
        ${actionBtn}
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:red">โหลดข้อมูลไม่สำเร็จ</td></tr>';
  }
}

// Load Scoreboard
async function loadScoreboard() {
  const tbody = document.getElementById('scoreboard-tbody');
  try {
    const res = await api.get('/garbage/scoreboard');
    
    tbody.innerHTML = res.data.map(r => `
      <tr>
        <td><div style="width:30px;height:30px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-weight:bold">${r.rank}</div></td>
        <td style="font-weight:600">${r.classroom}</td>
        <td><span class="badge ${r.score > 0 ? 'badge-red' : (r.score < 0 ? 'badge-green' : 'badge-gray')}">${r.score}</span></td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:red">โหลดข้อมูลไม่สำเร็จ</td></tr>';
  }
}

// Load Reports for Admin
async function loadReports() {
  const grid = document.getElementById('reports-grid');
  try {
    const res = await api.get('/garbage/reports');
    if (res.data.length === 0) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center">ไม่มีประวัติการส่งงาน</div>';
      return;
    }
    
    grid.innerHTML = res.data.map(r => {
      const submittedAt = new Date(r.submitted_at);
      const timeStr = submittedAt.toLocaleTimeString('th-TH', {hour: '2-digit', minute:'2-digit'});
      const dateStr = submittedAt.toLocaleDateString('th-TH');
      
      // Check if late
      let isLate = false;
      if (r.shift === 'morning' && (submittedAt.getHours() > 12 || (submittedAt.getHours() === 12 && submittedAt.getMinutes() > 30))) isLate = true;
      if (r.shift === 'afternoon' && (submittedAt.getHours() > 15 || (submittedAt.getHours() === 15 && submittedAt.getMinutes() > 30))) isLate = true;

      const lateBadge = isLate ? '<span class="badge badge-red" style="position:absolute;top:10px;right:10px">ส่งช้า</span>' : '';
      
      let statusBadge = '';
      if (r.status === 'pending') statusBadge = '<span class="badge badge-yellow">รอตรวจ</span>';
      else if (r.status === 'completed') statusBadge = '<span class="badge badge-green">ผ่าน</span>';
      else if (r.status === 'not_clean') statusBadge = '<span class="badge badge-red">ไม่เรียบร้อย (+0.5)</span>';
      else if (r.status === 'extra_help') statusBadge = '<span class="badge badge-blue">ช่วยพิเศษ (-0.5)</span>';
      else if (r.status === 'missed') statusBadge = '<span class="badge badge-gray">ขาดเวร (+1.0)</span>';

      return `
        <div class="report-card" style="position:relative">
          ${lateBadge}
          <img src="${API_BASE.replace('/api', '') + r.image_url}" class="report-img" onclick="window.open(this.src)" style="cursor:pointer" onerror="this.src='img/placeholder.png'">
          <div class="report-info">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
              <span style="font-weight:bold">${r.classroom}</span>
              ${statusBadge}
            </div>
            <div class="text-muted fs-sm" style="margin-bottom:0.5rem"><i class="fa-regular fa-clock"></i> ${dateStr} เวลา ${timeStr}</div>
            <div class="fs-sm">ส่งโดย: ${r.reporter_name}</div>
            
            ${r.status === 'pending' && user && (user.role === 'admin' || user.role === 'committee') ? `
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:1rem">
                <button class="btn btn-primary btn-sm" onclick="updateReport(${r.id}, 'completed')">ผ่าน</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="updateReport(${r.id}, 'not_clean')">ไม่เรียบร้อย</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--primary)" onclick="updateReport(${r.id}, 'extra_help')">ช่วยพิเศษ</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--text-muted)" onclick="updateReport(${r.id}, 'missed')">ขาดเวร</button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:red">โหลดข้อมูลไม่สำเร็จ</div>';
  }
}

async function submitReport() {
  if (!selectedFile) return showToast('กรุณาเลือกรูปภาพ', 'error');
  const btn = document.getElementById('submit-report-btn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> กำลังส่ง...';
  
  const formData = new FormData();
  formData.append('image', selectedFile);
  formData.append('classroom', document.getElementById('report-classroom').value);
  const dutyId = document.getElementById('report-duty-id').value;
  if (dutyId) formData.append('duty_id', dutyId);
  
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/garbage/report`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      showToast('ส่งงานสำเร็จ! รอการตรวจสอบ', 'success');
      selectedFile = null;
      document.getElementById('garbage-file-name').textContent = '';
      document.getElementById('garbage-upload-zone').style.borderColor = 'var(--border)';
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาด', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> ส่งงาน';
  }
}

async function saveDuty() {
  const date = document.getElementById('duty-date').value;
  const shift = document.getElementById('duty-shift').value;
  const classroom = document.getElementById('duty-classroom').value;
  
  if (!date || !shift || !classroom) return showToast('กรุณากรอกข้อมูลให้ครบ', 'error');
  
  try {
    await api.post('/garbage/schedule', {
      duties: [{ date, shift, classroom }]
    });
    showToast('บันทึกเวรสำเร็จ', 'success');
    closeModal('add-duty-modal');
    loadSchedule();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

async function deleteDuty(id) {
  if (!confirm('ต้องการลบเวรนี้ใช่หรือไม่?')) return;
  try {
    await api.delete(`/garbage/schedule/${id}`);
    showToast('ลบสำเร็จ', 'success');
    loadSchedule();
  } catch (err) {
    showToast('ลบไม่สำเร็จ', 'error');
  }
}

async function updateReport(id, status) {
  try {
    await api.put(`/garbage/report/${id}/status`, { status });
    showToast('อัปเดตสถานะสำเร็จ', 'success');
    loadReports();
  } catch (err) {
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (user && (user.role === 'admin' || user.role === 'committee')) {
    document.getElementById('tab-reports-btn').style.display = 'block';
    document.getElementById('add-duty-btn').style.display = 'inline-block';
    const adminCols = document.querySelectorAll('.admin-only');
    adminCols.forEach(el => el.style.display = 'table-cell');
  }
  loadDashboard();
});
