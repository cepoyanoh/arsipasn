// Sistem Arsip Digital SK PNS & PPPK
// Main JavaScript dengan Google Apps Script Integration

// Google Apps Script Configuration
const GAS_CONFIG = {
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbwcstN1Kj08iuTubxpQ3aY8-5W26pyfptxsYleuvdCoKzdYNPlPoag9SQai6n7IqGsEgQ/exec'
};

// Global Variables
let currentTab = 'dashboard';
let currentPage = 1;
let itemsPerPage = 10;
let arsipData = [];
let filteredData = [];

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    loadDashboardData();
    updateCurrentDate();
});

// Initialize Application
function initializeApp() {
    // Animate dashboard cards on load
    anime({
        targets: '.card-shadow',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(100),
        duration: 800,
        easing: 'easeOutExpo'
    });

    // Initialize chart
    initializeChart();
}

// Setup Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.dataset.tab);
        });
    });

    // SK PNS Type Buttons
    document.querySelectorAll('.sk-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchSKType(this.dataset.skType);
        });
    });

    // PPPK Type Buttons
    document.querySelectorAll('.pppk-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPPPKType(this.dataset.pppkType);
        });
    });

    // PAK Type Buttons
    document.querySelectorAll('.pak-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchPAKType(this.dataset.pakType);
        });
    });

    // Form Submissions
    document.getElementById('sk-pns-form').addEventListener('submit', handleSKPNSForm);
    document.getElementById('pppk-form').addEventListener('submit', handlePPPKForm);
    document.getElementById('pak-form').addEventListener('submit', handlePAKForm);

    // File Upload Handlers
    setupFileUpload('pdf-upload', 'file-info', 'file-name');
    setupFileUpload('pdf-upload-pppk', 'file-info-pppk', 'file-name-pppk');
    setupFileUpload('pdf-upload-pak', 'file-info-pak', 'file-name-pak');

    // Arsip Search and Filter
    document.getElementById('search-arsip').addEventListener('input', filterArsip);
    document.getElementById('filter-jenis').addEventListener('change', filterArsip);

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => changePage(-1));
    document.getElementById('next-page').addEventListener('click', () => changePage(1));
}

// Tab Switching
function switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.classList.add('text-gray-600', 'hover:text-gray-900');
    });
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-600', 'hover:text-gray-900');

    // Show/hide content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    const activeTab = document.getElementById(`${tabName}-tab`);
    activeTab.classList.remove('hidden');
    activeTab.classList.add('animate-fade-in');

    currentTab = tabName;

    // Load specific tab data
    if (tabName === 'arsip') {
        loadArsipData();
    }
}

// SK PNS Type Switching
function switchSKType(skType) {
    document.querySelectorAll('.sk-type-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-blue-100', 'text-blue-700');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    document.querySelector(`[data-sk-type="${skType}"]`).classList.add('active', 'bg-blue-100', 'text-blue-700');
    document.querySelector(`[data-sk-type="${skType}"]`).classList.remove('bg-gray-100', 'text-gray-700');
}

// PPPK Type Switching
function switchPPPKType(pppkType) {
    document.querySelectorAll('.pppk-type-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-green-100', 'text-green-700');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    document.querySelector(`[data-pppk-type="${pppkType}"]`).classList.add('active', 'bg-green-100', 'text-green-700');
    document.querySelector(`[data-pppk-type="${pppkType}"]`).classList.remove('bg-gray-100', 'text-gray-700');
}

// PAK Type Switching
function switchPAKType(pakType) {
    document.querySelectorAll('.pak-type-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-purple-100', 'text-purple-700');
        btn.classList.add('bg-gray-100', 'text-gray-700');
    });
    
    document.querySelector(`[data-pak-type="${pakType}"]`).classList.add('active', 'bg-purple-100', 'text-purple-700');
    document.querySelector(`[data-pak-type="${pakType}"]`).classList.remove('bg-gray-100', 'text-gray-700');
}

// File Upload Setup
function setupFileUpload(inputId, infoId, nameId) {
    const input = document.getElementById(inputId);
    const info = document.getElementById(infoId);
    const name = document.getElementById(nameId);

    input.addEventListener('change', function() {
        if (this.files.length > 0) {
            const file = this.files[0];
            name.textContent = file.name;
            info.classList.remove('hidden');
        }
    });

    // Drag and drop functionality
    const uploadArea = input.closest('.upload-area');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    uploadArea.addEventListener('drop', function(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            input.files = files;
            const file = files[0];
            name.textContent = file.name;
            info.classList.remove('hidden');
        }
    }, false);

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function highlight(e) {
        uploadArea.classList.add('border-blue-500', 'bg-blue-50');
    }

    function unhighlight(e) {
        uploadArea.classList.remove('border-blue-500', 'bg-blue-50');
    }
}

// Remove File Functions
function removeFile() {
    document.getElementById('pdf-upload').value = '';
    document.getElementById('file-info').classList.add('hidden');
}

function removeFilePPPK() {
    document.getElementById('pdf-upload-pppk').value = '';
    document.getElementById('file-info-pppk').classList.add('hidden');
}

function removeFilePAK() {
    document.getElementById('pdf-upload-pak').value = '';
    document.getElementById('file-info-pak').classList.add('hidden');
}

// Form Handlers dengan Google Apps Script
async function handleSKPNSForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const skType = document.querySelector('.sk-type-btn.active').dataset.skType;
    
    try {
        showNotification('Menyimpan data SK PNS...', 'info');
        
        // Persiapkan data untuk Google Apps Script
        const requestData = {
            action: 'saveSKPNS',
            nip: formData.get('nip'),
            nama: formData.get('nama'),
            tempatLahir: formData.get('tempat_lahir'),
            tanggalLahir: formData.get('tanggal_lahir'),
            pangkatGolongan: formData.get('pangkat_golongan'),
            jabatan: formData.get('jabatan'),
            unitKerja: formData.get('unit_kerja'),
            nomorSK: formData.get('nomor_sk'),
            tanggalSK: formData.get('tanggal_sk'),
            tanggalMulai: formData.get('tanggal_mulai'),
            pejabat: formData.get('pejabat'),
            jenisSK: skType
        };
        
        // Simpan data ke Google Sheets via Apps Script
        const saveResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
            throw new Error(saveResult.message);
        }
        
        // Upload file jika ada
        let fileUrl = null;
        let fileId = null;
        let fileName = null;
        const fileInput = document.getElementById('pdf-upload');
        
        if (fileInput.files[0]) {
            showNotification('Uploading file PDF...', 'info');
            
            const fileData = await fileToBase64(fileInput.files[0]);
            const uploadRequest = {
                action: 'uploadFile',
                fileData: fileData.split(',')[1], // Remove data URL prefix
                fileName: fileInput.files[0].name,
                mimeType: fileInput.files[0].type,
                identifier: requestData.nip,
                kategori: 'SK PNS'
            };
            
            const uploadResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadRequest)
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
                fileUrl = uploadResult.fileUrl;
                fileId = uploadResult.fileId;
                fileName = uploadResult.fileName;
                
                // Update record dengan file URL
                const updateRequest = {
                    action: 'updateFileUrl',
                    recordId: saveResult.recordId,
                    fileUrl: fileUrl,
                    fileId: fileId,
                    fileName: fileName,
                    sheetName: 'SK PNS',
                    rowNumber: saveResult.rowNumber
                };
                
                await fetch(GAS_CONFIG.WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateRequest)
                });
            }
        }
        
        showNotification('Data SK PNS berhasil disimpan!', 'success');
        e.target.reset();
        removeFile();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error saving SK PNS:', error);
        showNotification('Gagal menyimpan data: ' + error.message, 'error');
    }
}

async function handlePPPKForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const pppkType = document.querySelector('.pppk-type-btn.active').dataset.pppkType;
    
    try {
        showNotification('Menyimpan data PPPK...', 'info');
        
        const requestData = {
            action: 'savePPPK',
            nippkp: formData.get('nippkp'),
            nama: formData.get('nama'),
            tempatLahir: formData.get('tempat_lahir'),
            tanggalLahir: formData.get('tanggal_lahir'),
            jabatanPppk: formData.get('jabatan_pppk'),
            unitKerja: formData.get('unit_kerja'),
            nomorSK: formData.get('nomor_sk'),
            tanggalSK: formData.get('tanggal_sk'),
            tanggalMulai: formData.get('tanggal_mulai'),
            pejabat: formData.get('pejabat'),
            jenisSK: pppkType
        };
        
        const saveResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
            throw new Error(saveResult.message);
        }
        
        // Upload file jika ada
        const fileInput = document.getElementById('pdf-upload-pppk');
        if (fileInput.files[0]) {
            showNotification('Uploading file PDF...', 'info');
            
            const fileData = await fileToBase64(fileInput.files[0]);
            const uploadRequest = {
                action: 'uploadFile',
                fileData: fileData.split(',')[1],
                fileName: fileInput.files[0].name,
                mimeType: fileInput.files[0].type,
                identifier: requestData.nippkp,
                kategori: 'PPPK'
            };
            
            const uploadResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadRequest)
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
                const updateRequest = {
                    action: 'updateFileUrl',
                    recordId: saveResult.recordId,
                    fileUrl: uploadResult.fileUrl,
                    fileId: uploadResult.fileId,
                    fileName: uploadResult.fileName,
                    sheetName: 'PPPK',
                    rowNumber: saveResult.rowNumber
                };
                
                await fetch(GAS_CONFIG.WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateRequest)
                });
            }
        }
        
        showNotification('Data PPPK berhasil disimpan!', 'success');
        e.target.reset();
        removeFilePPPK();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error saving PPPK:', error);
        showNotification('Gagal menyimpan data: ' + error.message, 'error');
    }
}

async function handlePAKForm(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const pakType = document.querySelector('.pak-type-btn.active').dataset.pakType;
    
    try {
        showNotification('Menyimpan data PAK...', 'info');
        
        const requestData = {
            action: 'savePAK',
            nipNippkp: formData.get('nip_nippkp'),
            nama: formData.get('nama'),
            jabatan: formData.get('jabatan'),
            unitKerja: formData.get('unit_kerja'),
            periode: formData.get('periode'),
            tahun: formData.get('tahun'),
            akDiperoleh: formData.get('ak_diperoleh'),
            akKumulatif: formData.get('ak_kumulatif'),
            nomorPak: formData.get('nomor_pak'),
            tanggalPak: formData.get('tanggal_pak'),
            jenisPAK: pakType
        };
        
        const saveResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const saveResult = await saveResponse.json();
        
        if (!saveResult.success) {
            throw new Error(saveResult.message);
        }
        
        // Upload file jika ada
        const fileInput = document.getElementById('pdf-upload-pak');
        if (fileInput.files[0]) {
            showNotification('Uploading file PDF...', 'info');
            
            const fileData = await fileToBase64(fileInput.files[0]);
            const uploadRequest = {
                action: 'uploadFile',
                fileData: fileData.split(',')[1],
                fileName: fileInput.files[0].name,
                mimeType: fileInput.files[0].type,
                identifier: requestData.nipNippkp,
                kategori: 'PAK'
            };
            
            const uploadResponse = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(uploadRequest)
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.success) {
                const updateRequest = {
                    action: 'updateFileUrl',
                    recordId: saveResult.recordId,
                    fileUrl: uploadResult.fileUrl,
                    fileId: uploadResult.fileId,
                    fileName: uploadResult.fileName,
                    sheetName: 'PAK',
                    rowNumber: saveResult.rowNumber
                };
                
                await fetch(GAS_CONFIG.WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateRequest)
                });
            }
        }
        
        showNotification('Data PAK berhasil disimpan!', 'success');
        e.target.reset();
        removeFilePAK();
        loadDashboardData();
        
    } catch (error) {
        console.error('Error saving PAK:', error);
        showNotification('Gagal menyimpan data: ' + error.message, 'error');
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const requestData = {
            action: 'getDashboardStats'
        };
        
        const response = await fetch(GAS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const stats = result.stats;
            
            // Update counter dengan animasi
            animateCounter('total-pns', stats.totalSKPNS);
            animateCounter('total-pppk', stats.totalPPPK);
            animateCounter('total-pak', stats.totalPAK);
            animateCounter('total-files', stats.totalFiles);
        } else {
            console.error('Failed to load dashboard data:', result.message);
        }
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        // Set default values jika error
        animateCounter('total-pns', 0);
        animateCounter('total-pppk', 0);
        animateCounter('total-pak', 0);
        animateCounter('total-files', 0);
    }
}

// Load Arsip Data
async function loadArsipData() {
    try {
        const requestData = {
            action: 'getArsip'
        };
        
        const response = await fetch(GAS_CONFIG.WEB_APP_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            arsipData = result.data;
            filteredData = [...arsipData];
            renderArsipTable();
        } else {
            console.error('Failed to load arsip data:', result.message);
            arsipData = [];
            filteredData = [];
            renderArsipTable();
        }
        
    } catch (error) {
        console.error('Error loading arsip data:', error);
        arsipData = [];
        filteredData = [];
        renderArsipTable();
    }
}

// Filter Arsip
function filterArsip() {
    const searchTerm = document.getElementById('search-arsip').value.toLowerCase();
    const jenisFilter = document.getElementById('filter-jenis').value;

    filteredData = arsipData.filter(item => {
        const matchesSearch = item.nama.toLowerCase().includes(searchTerm) || 
                            item.nomor.toLowerCase().includes(searchTerm);
        const matchesJenis = !jenisFilter || item.jenis === jenisFilter;
        
        return matchesSearch && matchesJenis;
    });

    currentPage = 1;
    renderArsipTable();
}

// Render Arsip Table
function renderArsipTable() {
    const tbody = document.getElementById('arsip-table-body');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);

    if (pageData.length === 0) {
        tbody.innerHTML = '<tr class="bg-white border-b hover:bg-gray-50"><td colspan="7" class="px-6 py-4 text-center text-gray-500">Tidak ada data yang sesuai</td></tr>';
    } else {
        tbody.innerHTML = pageData.map((item, index) => `
            <tr class="bg-white border-b hover:bg-gray-50">
                <td class="px-6 py-4">${startIndex + index + 1}</td>
                <td class="px-6 py-4">${item.jenis}</td>
                <td class="px-6 py-4">${item.nomor}</td>
                <td class="px-6 py-4">${item.nama}</td>
                <td class="px-6 py-4">${formatDate(item.tanggal)}</td>
                <td class="px-6 py-4">
                    ${item.fileUrl ? 
                        `<a href="${item.fileUrl}" target="_blank" class="text-blue-600 hover:text-blue-800">${item.fileName || 'View PDF'}</a>` : 
                        '<span class="text-gray-400">No File</span>'
                    }
                </td>
                <td class="px-6 py-4">
                    <button class="text-green-600 hover:text-green-800 mr-2" onclick="viewDocument('${item.id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 mr-2" onclick="editDocument('${item.id}')">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                    </button>
                    <button class="text-red-600 hover:text-red-800" onclick="deleteDocument('${item.id}', '${item.sheetName}', ${item.rowNumber})">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    updatePagination();
}

// Update Pagination
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredData.length);

    document.getElementById('showing-start').textContent = filteredData.length > 0 ? startIndex + 1 : 0;
    document.getElementById('showing-end').textContent = endIndex;
    document.getElementById('total-arsip').textContent = filteredData.length;

    document.getElementById('prev-page').disabled = currentPage === 1;
    document.getElementById('next-page').disabled = currentPage === totalPages || totalPages === 0;
}

// Change Page
function changePage(direction) {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const newPage = currentPage + direction;

    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderArsipTable();
    }
}

// Document Actions
function viewDocument(id) {
    showNotification('Fitur view dokumen akan segera tersedia', 'info');
}

function editDocument(id) {
    showNotification('Fitur edit dokumen akan segera tersedia', 'info');
}

async function deleteDocument(id, sheetName, rowNumber) {
    if (confirm('Apakah Anda yakin ingin menghapus dokumen ini?')) {
        try {
            showNotification('Menghapus dokumen...', 'info');
            
            const requestData = {
                action: 'deleteRecord',
                recordId: id,
                sheetName: sheetName,
                rowNumber: rowNumber
            };
            
            const response = await fetch(GAS_CONFIG.WEB_APP_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Remove from local data
                arsipData = arsipData.filter(item => item.id !== id);
                filteredData = filteredData.filter(item => item.id !== id);
                renderArsipTable();
                showNotification('Dokumen berhasil dihapus', 'success');
                loadDashboardData();
            } else {
                showNotification('Gagal menghapus dokumen: ' + result.message, 'error');
            }
            
        } catch (error) {
            console.error('Error deleting document:', error);
            showNotification('Gagal menghapus dokumen: ' + error.message, 'error');
        }
    }
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    document.getElementById('current-date').textContent = now.toLocaleDateString('id-ID', options);
}

function animateCounter(elementId, targetValue) {
    const element = document.getElementById(elementId);
    anime({
        targets: { value: 0 },
        value: targetValue,
        duration: 2000,
        easing: 'easeOutExpo',
        update: function(anim) {
            element.textContent = Math.round(anim.animatables[0].target.value);
        }
    });
}

function initializeChart() {
    const ctx = document.getElementById('statsChart');
    if (!ctx) return;

    // Mock chart data - in real implementation, fetch from Google Apps Script
    const chartData = {
        labels: ['2020', '2021', '2022', '2023', '2024'],
        datasets: [{
            label: 'SK PNS',
            data: [25, 35, 45, 40, 55],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
        }, {
            label: 'PPPK',
            data: [15, 20, 25, 30, 35],
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4
        }, {
            label: 'PAK',
            data: [40, 50, 60, 55, 65],
            borderColor: 'rgb(168, 85, 247)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            tension: 0.4
        }]
    };

    drawChart(ctx, chartData);
}

function drawChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = (height - 40) * (i / 5) + 20;
        ctx.beginPath();
        ctx.moveTo(40, y);
        ctx.lineTo(width - 20, y);
        ctx.stroke();
    }

    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Inter';
    data.labels.forEach((label, i) => {
        const x = 60 + (i * (width - 80) / (data.labels.length - 1));
        ctx.fillText(label, x - 10, height - 5);
    });

    data.datasets.forEach((dataset, datasetIndex) => {
        ctx.strokeStyle = dataset.borderColor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        dataset.data.forEach((value, i) => {
            const x = 60 + (i * (width - 80) / (data.labels.length - 1));
            const y = height - 40 - (value / 70) * (height - 60);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
    });
}

// Helper function untuk convert file ke base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Notification System
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform translate-x-full transition-transform duration-300`;
    
    const colors = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white',
        warning: 'bg-yellow-500 text-black'
    };

    notification.classList.add(...colors[type].split(' '));
    notification.innerHTML = `
        <div class="flex items-center justify-between">
            <span class="font-medium">${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Export functions for global access
window.removeFile = removeFile;
window.removeFilePPPK = removeFilePPPK;
window.removeFilePAK = removeFilePAK;
window.viewDocument = viewDocument;
window.editDocument = editDocument;

window.deleteDocument = deleteDocument;

