const user = requireRole('admin');
if (!user) throw new Error('Unauthorized');

async function loadMembers() {
  const tbody = document.getElementById('members-tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center"><div class="spinner" style="margin:auto"></div></td></tr>';
  try {
    const res = await api.get('/users');
    const members = res.data;
    if (!members.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center">ไม่มีผู้ใช้งาน</td></tr>';
      return;
    }
    
    const roleColors = { admin: 'badge-red', committee: 'badge-yellow', member: 'badge-blue' };
    const roleNames = { admin: 'ผู้ดูแลระบบ', committee: 'คณะกรรมการ', member: 'สมาชิก' };

    tbody.innerHTML = members.map(m => `
      <tr>
        <td>${m.student_id || '-'}</td>
        <td>
          <div style="display:flex;align-items:center;gap:0.75rem">
            <img src="${m.avatar ? (m.avatar.startsWith('http') ? m.avatar : API_BASE.replace('/api', '') + m.avatar) : 'img/default-avatar.png'}" 
                 style="width:32px;height:32px;border-radius:50%;object-fit:cover" onerror="this.src='img/default-avatar.png'">
            <div>
              <div style="font-weight:500">${m.full_name}</div>
              <div class="fs-xs text-muted">${m.classroom || '-'}</div>
            </div>
          </div>
        </td>
        <td class="fs-sm text-muted">${m.email}</td>
        <td><span class="badge ${roleColors[m.role] || 'badge-gray'}">${roleNames[m.role] || m.role}</span></td>
        <td style="display:flex;gap:0.4rem">
          <select class="form-control" style="width:120px;padding:0.25rem;font-size:0.8rem;height:auto" onchange="changeRole(${m.id}, this.value)" ${m.id === user.id ? 'disabled' : ''}>
            <option value="member" ${m.role === 'member' ? 'selected' : ''}>สมาชิก</option>
            <option value="committee" ${m.role === 'committee' ? 'selected' : ''}>คณะกรรมการ</option>
            <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>ผู้ดูแลระบบ</option>
          </select>
          <button class="btn btn-danger btn-sm btn-icon" onclick="deleteUser(${m.id})" ${m.id === user.id ? 'disabled' : ''}><i class="fa-solid fa-trash-can"></i></button>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red">โหลดข้อมูลไม่สำเร็จ: ${err.message}</td></tr>`;
  }
}

async function changeRole(id, role) {
  try {
    await api.put(`/users/${id}/role`, { role });
    showToast('เปลี่ยนสิทธิ์สำเร็จ', 'success');
    loadMembers();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
    loadMembers();
  }
}

async function deleteUser(id) {
  if (!confirm('ลบผู้ใช้งานนี้ใช่ไหม?')) return;
  try {
    await api.delete(`/users/${id}`);
    showToast('ลบผู้ใช้งานสำเร็จ', 'success');
    loadMembers();
  } catch (err) {
    showToast(err.message || 'เกิดข้อผิดพลาด', 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadMembers);
