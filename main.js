// ==========================================================
// Sistem Arsip Digital SK PNS & PPPK
// Main JavaScript – 100% sinkron dengan Code.gs terbaru
// ==========================================================

// 1. GANTI URL DI SINI DENGAN URL DEPLOYAN ANDA
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbyaK9aKFWoIpJL7fmkcGI3cTib9V7cJ1kCa7NrGQxMJ9H-M3qI8h-p8cTT9BfqbL-SQ/exec'
};

// 2. GLOBAL VARIABLES
let currentTab = 'dashboard';
let currentPage = 1;
const itemsPerPage = 10;
let arsipData = [];
let filteredData = [];

// 3. INITIALISATION
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadDashboardData();
  updateCurrentDate();
});

// 4. EVENT LISTENERS
function setupEventListeners() {
  // Tab Navigasi
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Tombol jenis SK/PPPK/PAK
  document.querySelectorAll('.sk-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchSKType(btn.dataset.skType));
  });
  document.querySelectorAll('.pppk-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPPPKType(btn.dataset.pppkType));
  });
  document.querySelectorAll('.pak-type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchPAKType(btn.dataset.pakType));
  });

  // Form submit
  document.getElementById('sk-pns-form').addEventListener('submit', handleSKPNSForm);
  document.getElementById('pppk-form').addEventListener('submit', handlePPPKForm);
  document.getElementById('pak-form').addEventListener('submit', handlePAKForm);

  // File upload
  setupFileUpload('pdf-upload', 'file-info', 'file-name');
  setupFileUpload('pdf-upload-pppk', 'file-info-pppk', 'file-name-pppk');
  setupFileUpload('pdf-upload-pak', 'file-info-pak', 'file-name-pak');

  // Search & filter
  document.getElementById('search-arsip').addEventListener('input', filterArsip);
  document.getElementById('filter-jenis').addEventListener('change', filterArsip);

  // Pagination
  document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
  document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

// 5. TAB & TYPE SWITCHER
function switchTab(tabName) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById(`${tabName}-tab`).classList.remove('hidden');
  currentTab = tabName;
  if (tabName === 'arsip') loadArsipData();
}

function switchSKType(type) {
  document.querySelectorAll('.sk-type-btn').forEach(b => b.classList.remove('active', 'bg-blue-100', 'text-blue-700'));
  document.querySelector(`[data-sk-type="${type}"]`).classList.add('active', 'bg-blue-100', 'text-blue-700');
}

function switchPPPKType(type) {
  document.querySelectorAll('.pppk-type-btn').forEach(b => b.classList.remove('active', 'bg-green-100', 'text-green-700'));
  document.querySelector(`[data-pppk-type="${type}"]`).classList.add('active', 'bg-green-100', 'text-green-700');
}

function switchPAKType(type) {
  document.querySelectorAll('.pak-type-btn').forEach(b => b.classList.remove('active', 'bg-purple-100', 'text-purple-700'));
  document.querySelector(`[data-pak-type="${type}"]`).classList.add('active', 'bg-purple-100', 'text-purple-700');
}

// 6. FILE UPLOAD AREA
function setupFileUpload(inputId, infoId, nameId) {
  const input = document.getElementById(inputId);
  const info = document.getElementById(infoId);
  const name = document.getElementById(nameId);
  const area = input.closest('.upload-area');

  input.addEventListener('change', () => {
    if (input.files.length) {
      name.textContent = input.files[0].name;
      info.classList.remove('hidden');
    }
  });

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
    area.addEventListener(evt, preventDefaults, false);
  });
  ['dragenter', 'dragover'].forEach(evt => area.addEventListener(evt, () => area.classList.add('border-blue-500', 'bg-blue-50')));
  ['dragleave', 'drop'].forEach(evt => area.addEventListener(evt, () => area.classList.remove('border-blue-500', 'bg-blue-50')));

  area.addEventListener('drop', e => {
    const files = e.dataTransfer.files;
    if (files.length) {
      input.files = files;
      name.textContent = files[0].name;
      info.classList.remove('hidden');
    }
  });

  function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }
}

// 7. FORM HANDLERS
async function handleSKPNSForm(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target));
  const jenisSK = document.querySelector('.sk-type-btn.active').dataset.skType;

  try {
    showNotification('Menyimpan SK PNS...', 'info');
    const save = await fetch(GAS_CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveSKPNS', ...form, jenisSK })
    }).then(r => r.json());
    if (!save.success) throw new Error(save.message);

    const fileInput = document.getElementById('pdf-upload');
    if (fileInput.files[0]) await uploadAndUpdate(fileInput, save, 'SK PNS');

    showNotification('SK PNS berhasil disimpan!', 'success');
    e.target.reset(); removeFile(); loadDashboardData();
  } catch (err) {
    showNotification('Gagal: ' + err.message, 'error');
  }
}

async function handlePPPKForm(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target));
  const jenisSK = document.querySelector('.pppk-type-btn.active').dataset.pppkType;

  try {
    showNotification('Menyimpan PPPK...', 'info');
    const save = await fetch(GAS_CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'savePPPK', ...form, jenisSK })
    }).then(r => r.json());
    if (!save.success) throw new Error(save.message);

    const fileInput = document.getElementById('pdf-upload-pppk');
    if (fileInput.files[0]) await uploadAndUpdate(fileInput, save, 'PPPK');

    showNotification('PPPK berhasil disimpan!', 'success');
    e.target.reset(); removeFilePPPK(); loadDashboardData();
  } catch (err) {
    showNotification('Gagal: ' + err.message, 'error');
  }
}

async function handlePAKForm(e) {
  e.preventDefault();
  const form = Object.fromEntries(new FormData(e.target));
  const jenisPAK = document.querySelector('.pak-type-btn.active').dataset.pakType;

  try {
    showNotification('Menyimpan PAK...', 'info');
    const save = await fetch(GAS_CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'savePAK', ...form, jenisPAK })
    }).then(r => r.json());
    if (!save.success) throw new Error(save.message);

    const fileInput = document.getElementById('pdf-upload-pak');
    if (fileInput.files[0]) await uploadAndUpdate(fileInput, save, 'PAK');

    showNotification('PAK berhasil disimpan!', 'success');
    e.target.reset(); removeFilePAK(); loadDashboardData();
  } catch (err) {
    showNotification('Gagal: ' + err.message, 'error');
  }
}

// 8. UPLOAD PDF + UPDATE URL
async function uploadAndUpdate(fileInput, saveResult, kategori) {
  showNotification('Uploading PDF...', 'info');
  const file = fileInput.files[0];
  const base64 = await fileToBase64(file);
  const up = await fetch(GAS_CONFIG.WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'uploadFile',
      fileData: base64.split(',')[1],
      fileName: file.name,
      mimeType: file.type
    })
  }).then(r => r.json());
  if (!up.success) throw new Error(up.message);

  await fetch(GAS_CONFIG.WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'updateFileUrl',
      recordId: saveResult.recordId,
      fileUrl: up.fileUrl,
      fileId: up.fileId,
      fileName: up.fileName,
      sheetName: kategori,
      rowNumber: saveResult.rowNumber
    })
  });
}

// 9. LOAD DATA
async function loadDashboardData() {
  try {
    const res = await fetch(`${GAS_CONFIG.WEB_APP_URL}?action=getDashboardStats`).then(r => r.json());
    if (res.success) {
      animateCounter('total-pns', res.stats.totalSKPNS);
      animateCounter('total-pppk', res.stats.totalPPPK);
      animateCounter('total-pak', res.stats.totalPAK);
      animateCounter('total-files', res.stats.totalFiles);
    }
  } catch (e) {
    console.error(e);
  }
}

async function loadArsipData() {
  try {
    const res = await fetch(`${GAS_CONFIG.WEB_APP_URL}?action=getArsip`).then(r => r.json());
    if (res.success) {
      arsipData = res.data;
      filteredData = [...arsipData];
      renderArsipTable();
    }
  } catch (e) {
    console.error(e);
    arsipData = []; filteredData = [];
    renderArsipTable();
  }
}

// 10. ARSIP TABLE & PAGINATION
function renderArsipTable() {
  const tbody = document.getElementById('arsip-table-body');
  const start = (currentPage - 1) * itemsPerPage;
  const pageData = filteredData.slice(start, start + itemsPerPage);

  if (!pageData.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center p-4 text-gray-500">Tidak ada data</td></tr>';
  } else {
    tbody.innerHTML = pageData.map((item, i) => `
      <tr class="bg-white border-b hover:bg-gray-50">
        <td class="px-6 py-4">${start + i + 1}</td>
        <td class="px-6 py-4">${item.jenis}</td>
        <td class="px-6 py-4">${item.nomor}</td>
        <td class="px-6 py-4">${item.nama}</td>
        <td class="px-6 py-4">${formatDate(item.tanggal)}</td>
        <td class="px-6 py-4">
          ${item.fileUrl ? `<a href="${item.fileUrl}" target="_blank" class="text-blue-600 hover:underline">${item.fileName || 'Lihat PDF'}</a>` : '<span class="text-gray-400">-</span>'}
        </td>
        <td class="px-6 py-4 flex gap-2">
          <button onclick="viewDocument('${item.id}')" class="text-green-600 hover:text-green-800">👁</button>
          <button onclick="editDocument('${item.id}')" class="text-blue-600 hover:text-blue-800">✎</button>
          <button onclick="deleteDocument('${item.id}', '${item.sheetName}', ${item.rowNumber})" class="text-red-600 hover:text-red-800">🗑</button>
        </td>
      </tr>
    `).join('');
  }
  updatePagination();
}

function updatePagination() {
  const total = filteredData.length;
  const start = total ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const end = Math.min(start + itemsPerPage - 1, total);
  document.getElementById('showing-start').textContent = start;
  document.getElementById('showing-end').textContent = end;
  document.getElementById('total-arsip').textContent = total;
  document.getElementById('prev-page').disabled = currentPage === 1;
  document.getElementById('next-page').disabled = end >= total;
}

function changePage(dir) {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const newPage = currentPage + dir;
  if (newPage >= 1 && newPage <= totalPages) {
    currentPage = newPage;
    renderArsipTable();
  }
}

function filterArsip() {
  const search = document.getElementById('search-arsip').value.toLowerCase();
  const jenis = document.getElementById('filter-jenis').value;
  filteredData = arsipData.filter(item =>
    (item.nama.toLowerCase().includes(search) || item.nomor.toLowerCase().includes(search)) &&
    (!jenis || item.jenis === jenis)
  );
  currentPage = 1;
  renderArsipTable();
}

// 11. ACTIONS
function viewDocument(id) {
  showNotification('Fitur lihat dokumen akan segera tersedia', 'info');
}
function editDocument(id) {
  showNotification('Fitur edit dokumen akan segera tersedia', 'info');
}
async function deleteDocument(id, sheetName, rowNumber) {
  if (!confirm('Yakin ingin menghapus dokumen ini?')) return;
  try {
    showNotification('Menghapus...', 'info');
    const res = await fetch(GAS_CONFIG.WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteRecord', recordId: id, sheetName, rowNumber })
    }).then(r => r.json());
    if (res.success) {
      arsipData = arsipData.filter(x => x.id !== id);
      filteredData = filteredData.filter(x => x.id !== id);
      renderArsipTable();
      loadDashboardData();
      showNotification('Dokumen dihapus', 'success');
    } else throw new Error(res.message);
  } catch (e) {
    showNotification('Gagal hapus: ' + e.message, 'error');
  }
}

// 12. UTILITIES
function formatDate(d) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function updateCurrentDate() {
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = err => reject(err);
  });
}
function animateCounter(id, target) {
  const el = document.getElementById(id);
  anime({ targets: { val: 0 }, val: target, duration: 1500, easing: 'easeOutExpo', update: a => el.textContent = Math.round(a.animatables[0].target.val) });
}
function showNotification(msg, type = 'info') {
  const colors = { info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500 text-black' };
  const notif = document.createElement('div');
  notif.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${colors[type]} transition transform translate-x-full`;
  notif.innerHTML = `<div class="flex items-center justify-between gap-4"><span>${msg}</span><button onclick="this.parentElement.parentElement.remove()">✕</button></div>`;
  document.body.appendChild(notif);
  setTimeout(() => notif.classList.remove('translate-x-full'), 100);
  setTimeout(() => notif.remove(), 4000);
}

// 13. GLOBAL SUPPLY
window.removeFile = () => { document.getElementById('pdf-upload').value = ''; document.getElementById('file-info').classList.add('hidden'); };
window.removeFilePPPK = () => { document.getElementById('pdf-upload-pppk').value = ''; document.getElementById('file-info-pppk').classList.add('hidden'); };
window.removeFilePAK = () => { document.getElementById('pdf-upload-pak').value = ''; document.getElementById('file-info-pak').classList.add('hidden'); };
window.viewDocument = viewDocument;
window.editDocument = editDocument;
window.deleteDocument = deleteDocument;
