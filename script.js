// ============= FIREBASE SETUP =============
const firebaseConfig = {
    apiKey: "AIzaSyAxe-p-cMFQ4C9SE5N3QiPM07tb8Q0mwA0",
    authDomain: "price123-267a0.firebaseapp.com",
    databaseURL: "https://price123-267a0-default-rtdb.firebaseio.com",
    projectId: "price123-267a0",
    storageBucket: "price123-267a0.firebasestorage.app",
    messagingSenderId: "267287560086",
    appId: "1:267287560086:web:4fd14e5b6635163cefa7b7",
    measurementId: "G-N46HDNPGEB"
};

const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Fixed login credentials
const FIXED_EMAIL = 'maniyadhruvik@gmail.com';
const FIXED_PASSWORD = 'maniya@2008';

// ============= AUTHENTICATION =============
let currentUser = null;

function toggleForms() {
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    signInForm.classList.toggle('hidden');
    signUpForm.classList.toggle('hidden');
}

function handleSignIn(event) {
    event.preventDefault();

    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;

    if (email === FIXED_EMAIL && password === FIXED_PASSWORD) {
        // Sign in anonymously with Firebase
        auth.signInAnonymously()
            .then(() => {
                currentUser = { email: FIXED_EMAIL, name: 'Dhruvik Maniya' };
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                window.location.href = 'dashboard.html';
            })
            .catch((error) => {
                alert('Firebase error: ' + error.message);
            });
    } else {
        alert('Invalid email or password');
    }
}

function handleSignUp(event) {
    event.preventDefault();
    alert('Contact admin for account access.');
}

// ============= DASHBOARD EXCEL ENTRY =============
let entries = [];
const FIELDS = ['date', 'designno', 'ajjihu', 'jdate', 'ajtn', 'tdate', 'ajde', 'ddate'];
let currentPage = 1;
const rowsPerPage = 20;
let firebaseListenerAttached = false;

function loadDashboard() {
    const loggedIn = localStorage.getItem('currentUser');
    if (loggedIn) {
        currentUser = JSON.parse(loggedIn);
    }

    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }

    // Display user info
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        userInfo.textContent = `Welcome, ${currentUser.name}`;
    }

    // Sign in anonymously if not already signed in
    if (!auth.currentUser) {
        auth.signInAnonymously()
            .then(() => {
                loadEntriesFromFirebase();
            })
            .catch((error) => {
                console.error('Firebase auth error:', error);
                // Fallback: try to load anyway
                loadEntriesFromFirebase();
            });
    } else {
        loadEntriesFromFirebase();
    }
}

function loadEntriesFromFirebase() {
    if (firebaseListenerAttached) return;
    firebaseListenerAttached = true;

    db.ref('entries').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            entries = Object.values(data);
        } else {
            entries = [];
        }

        if (entries.length === 0) {
            createNewRow(false);
            saveEntries();
        }

        displayEntries();
    });
}

function saveEntries() {
    const dataObj = {};
    entries.forEach((entry, index) => {
        dataObj['entry_' + index] = entry;
    });
    db.ref('entries').set(dataObj).catch(err => {
        console.error('Firebase save error:', err);
    });
}

function createNewRow(refresh = true) {
    const entry = {
        id: Date.now() + Math.random(),
        date: '',
        designno: '',
        ajjihu: '',
        jdate: '',
        ajtn: '',
        tdate: '',
        ajde: '',
        ddate: ''
    };
    entries.push(entry);
    if (refresh) {
        saveEntries();
        displayEntries();
        // Focus on the first cell of the new row
        setTimeout(() => {
            const inputs = document.querySelectorAll(`[data-id="${entry.id}"]`);
            if (inputs.length > 0) inputs[0].focus();
        }, 50);
    }
    return entry;
}

function addNewEmptyRow() {
    const entry = createNewRow(false);
    saveEntries();

    // Switch to the last page where the new row is
    currentPage = Math.ceil(entries.length / rowsPerPage);
    displayEntries();

    // Automatically focus on the new row
    setTimeout(() => {
        const inputs = document.querySelectorAll(`[data-id="${entry.id}"]`);
        if (inputs.length > 0) inputs[0].focus();
    }, 100);
}

function displayEntries() {
    const tbody = document.getElementById('entriesTableBody');
    const noData = document.getElementById('noData');

    if (entries.length === 0) {
        tbody.innerHTML = '';
        noData.style.display = 'block';
        renderPagination();
        return;
    }

    noData.style.display = 'none';

    // Pagination slicing
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const paginatedEntries = entries.slice(startIndex, endIndex);

    tbody.innerHTML = paginatedEntries.map((entry, index) => {
        const globalIndex = startIndex + index;
        return `
            <tr id="row-${entry.id}">
                <td class="cell-index">${globalIndex + 1}</td>
                <td><input type="date" class="excel-input" data-id="${entry.id}" data-field="date" value="${entry.date || ''}"></td>
                <td><input type="text" class="excel-input" data-id="${entry.id}" data-field="designno" value="${entry.designno || ''}"></td>
                <td><input type="text" class="excel-input" data-id="${entry.id}" data-field="ajjihu" value="${entry.ajjihu || ''}"></td>
                <td><input type="date" class="excel-input" data-id="${entry.id}" data-field="jdate" value="${entry.jdate || ''}"></td>
                <td><input type="text" class="excel-input" data-id="${entry.id}" data-field="ajtn" value="${entry.ajtn || ''}"></td>
                <td><input type="date" class="excel-input" data-id="${entry.id}" data-field="tdate" value="${entry.tdate || ''}"></td>
                <td><input type="text" class="excel-input" data-id="${entry.id}" data-field="ajde" value="${entry.ajde || ''}"></td>
                <td><input type="date" class="excel-input" data-id="${entry.id}" data-field="ddate" value="${entry.ddate || ''}"></td>
                <td class="action-cell">
                    <button class="btn-delete-small" onclick="deleteEntry(${entry.id})">×</button>
                </td>
            </tr>
        `;
    }).join('');

    renderPagination();

    // Add event listeners to all inputs
    const inputs = document.querySelectorAll('.excel-input');
    inputs.forEach(input => {
        input.addEventListener('change', handleInputChange);
        input.addEventListener('keydown', handleKeyDown);
        input.addEventListener('focus', function () {
            this.parentElement.parentElement.classList.add('row-active');
        });
        input.addEventListener('blur', function () {
            this.parentElement.parentElement.classList.remove('row-active');
        });
    });
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationControls');
    if (!paginationContainer) return;

    if (entries.length <= rowsPerPage) {
        paginationContainer.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(entries.length / rowsPerPage);
    let html = `
        <div class="pagination">
            <button class="pag-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">PREV</button>
            <span class="pag-info">Page ${currentPage} of ${totalPages}</span>
            <button class="pag-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">NEXT</button>
        </div>
    `;
    paginationContainer.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(entries.length / rowsPerPage);
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    if (currentPage !== page) {
        currentPage = page;
        displayEntries();
        // Scroll table to top when page changes
        document.querySelector('.table-wrapper').scrollTop = 0;
    }
}

function handleInputChange(e) {
    const id = parseFloat(e.target.dataset.id);
    const field = e.target.dataset.field;
    const value = e.target.value;

    const index = entries.findIndex(emp => emp.id === id);
    if (index !== -1) {
        entries[index][field] = value;
        saveEntries();
    }
}

function handleKeyDown(e) {
    const input = e.target;
    const id = parseFloat(input.dataset.id);
    const field = input.dataset.field;
    const fieldIndex = FIELDS.indexOf(field);

    // Find absolute index in main entries array
    const absoluteIndex = entries.findIndex(emp => emp.id === id);
    // Find relative index on current page
    const rowIndexOnPage = absoluteIndex % rowsPerPage;

    const rows = document.getElementById('entriesTableBody').rows;

    switch (e.key) {
        case 'ArrowRight':
            if (input.selectionEnd === input.value.length) {
                if (fieldIndex < FIELDS.length - 1) {
                    rows[rowIndexOnPage].cells[fieldIndex + 2].querySelector('input').focus();
                    e.preventDefault();
                } else if (absoluteIndex < entries.length - 1) {
                    // Move to next row
                    if (rowIndexOnPage === rowsPerPage - 1) {
                        changePage(currentPage + 1);
                        setTimeout(() => document.getElementById('entriesTableBody').rows[0].cells[1].querySelector('input').focus(), 50);
                    } else {
                        rows[rowIndexOnPage + 1].cells[1].querySelector('input').focus();
                    }
                    e.preventDefault();
                }
            }
            break;

        case 'ArrowLeft':
            if (input.selectionStart === 0) {
                if (fieldIndex > 0) {
                    rows[rowIndexOnPage].cells[fieldIndex].querySelector('input').focus();
                    e.preventDefault();
                } else if (absoluteIndex > 0) {
                    // Move to prev row
                    if (rowIndexOnPage === 0) {
                        changePage(currentPage - 1);
                        setTimeout(() => document.getElementById('entriesTableBody').rows[rowsPerPage - 1].cells[FIELDS.length].querySelector('input').focus(), 50);
                    } else {
                        rows[rowIndexOnPage - 1].cells[FIELDS.length].querySelector('input').focus();
                    }
                    e.preventDefault();
                }
            }
            break;

        case 'ArrowDown':
            if (rowIndexOnPage < rows.length - 1) {
                rows[rowIndexOnPage + 1].cells[fieldIndex + 1].querySelector('input').focus();
                e.preventDefault();
            } else if (absoluteIndex < entries.length - 1) {
                // Move to next page
                changePage(currentPage + 1);
                setTimeout(() => document.getElementById('entriesTableBody').rows[0].cells[fieldIndex + 1].querySelector('input').focus(), 50);
                e.preventDefault();
            } else {
                addNewEmptyRow();
            }
            break;

        case 'ArrowUp':
            if (rowIndexOnPage > 0) {
                rows[rowIndexOnPage - 1].cells[fieldIndex + 1].querySelector('input').focus();
                e.preventDefault();
            } else if (currentPage > 1) {
                // Move to prev page
                changePage(currentPage - 1);
                setTimeout(() => document.getElementById('entriesTableBody').rows[rowsPerPage - 1].cells[fieldIndex + 1].querySelector('input').focus(), 50);
                e.preventDefault();
            }
            break;

        case 'Enter':
            if (fieldIndex < FIELDS.length - 1) {
                rows[rowIndexOnPage].cells[fieldIndex + 2].querySelector('input').focus();
            } else if (absoluteIndex < entries.length - 1) {
                if (rowIndexOnPage === rowsPerPage - 1) {
                    changePage(currentPage + 1);
                    setTimeout(() => document.getElementById('entriesTableBody').rows[0].cells[1].querySelector('input').focus(), 50);
                } else {
                    rows[rowIndexOnPage + 1].cells[1].querySelector('input').focus();
                }
            } else {
                addNewEmptyRow();
            }
            e.preventDefault();
            break;

        case 'Tab':
            if (e.shiftKey) {
                if (fieldIndex === 0 && absoluteIndex > 0) {
                    if (rowIndexOnPage === 0) {
                        changePage(currentPage - 1);
                        setTimeout(() => document.getElementById('entriesTableBody').rows[rowsPerPage - 1].cells[FIELDS.length].querySelector('input').focus(), 50);
                    }
                }
            } else {
                if (fieldIndex === FIELDS.length - 1) {
                    if (absoluteIndex === entries.length - 1) {
                        addNewEmptyRow();
                        e.preventDefault();
                    } else if (rowIndexOnPage === rowsPerPage - 1) {
                        changePage(currentPage + 1);
                        setTimeout(() => document.getElementById('entriesTableBody').rows[0].cells[1].querySelector('input').focus(), 50);
                        e.preventDefault();
                    }
                }
            }
            break;
    }
}

function deleteEntry(id) {
    if (confirm('Delete this row?')) {
        entries = entries.filter(e => e.id !== id);
        saveEntries();
        displayEntries();
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        auth.signOut();
        localStorage.removeItem('currentUser');
        currentUser = null;
        firebaseListenerAttached = false;
        window.location.href = 'index.html';
    }
}

// ============= EXCEL EXPORT =============
function exportToExcel() {
    if (entries.length === 0) {
        alert('No data to export!');
        return;
    }

    // Prepare data for Excel
    const dataForExcel = entries.map((entry, index) => ({
        '#': index + 1,
        'Date': entry.date,
        'Design No': entry.designno,
        'AJ JIHU': entry.ajjihu,
        'J Date': entry.jdate,
        'AJ TN': entry.ajtn,
        'T Date': entry.tdate,
        'AJ DE': entry.ajde,
        'D Date': entry.ddate
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Entry');

    XLSX.writeFile(wb, `data_entry_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// ============= MULTIPLE ROWS =============
function add50EmptyRows() {
    if (entries.length > 0) {
        if (!confirm('Add 50 empty rows?')) return;
    }

    for (let i = 0; i < 50; i++) {
        entries.push({
            id: Date.now() + i + Math.random(),
            date: '',
            designno: '',
            ajjihu: '',
            jdate: '',
            ajtn: '',
            tdate: '',
            ajde: '',
            ddate: ''
        });
    }

    saveEntries();
    displayEntries();
}

// ============= CLEAR ALL DATA =============
function clearAllData() {
    if (!confirm('Permanently delete ALL entries?')) return;

    entries = [];
    saveEntries();
    displayEntries();
}

// ============= NAVIGATION =============
function showSection(section) {
    const sections = ['entry', 'report', 'settings'];
    sections.forEach(s => {
        const el = document.getElementById(s + 'Section');
        const nav = document.getElementById('nav' + s.charAt(0).toUpperCase() + s.slice(1));
        if (el) {
            if (s === section) {
                el.classList.remove('hidden');
                nav.classList.add('active');
            } else {
                el.classList.add('hidden');
                nav.classList.remove('active');
            }
        }
    });

    if (section === 'report') {
        // Default dates for report: today and 30 days ago
        const end = new Date().toISOString().split('T')[0];
        const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        document.getElementById('reportStartDate').value = start;
        document.getElementById('reportEndDate').value = end;
    }
}

// ============= REPORTS =============
function generateReport() {
    const start = document.getElementById('reportStartDate').value;
    const end = document.getElementById('reportEndDate').value;

    if (!start || !end) {
        alert('Please select both Start and End dates.');
        return;
    }

    function isDateInRange(dateStr) {
        if (!dateStr) return false;
        return dateStr >= start && dateStr <= end;
    }

    // Collect ALL unique designs
    const allDesignMap = {};
    entries.forEach(entry => {
        const d = (entry.designno || '').trim();
        if (!d) return;

        // Use the main 'date' field for range filtering
        const entryInRange = isDateInRange(entry.date);

        if (!allDesignMap[d]) {
            allDesignMap[d] = {
                design: d,
                count: 0,
                jdates: [],
                tdates: [],
                ddates: [],
                ajjihus: [],
                ajtns: [],
                ajdes: [],
                hasAjjihu: false,
                hasAjtn: false,
                hasAjde: false,
                hasEntryInRange: false
            };
        }

        if (entryInRange) {
            allDesignMap[d].hasEntryInRange = true;
            allDesignMap[d].count++;
            if (entry.jdate) allDesignMap[d].jdates.push(entry.jdate);
            if (entry.tdate) allDesignMap[d].tdates.push(entry.tdate);
            if (entry.ddate) allDesignMap[d].ddates.push(entry.ddate);
            if (entry.ajjihu && entry.ajjihu.trim()) {
                allDesignMap[d].hasAjjihu = true;
                allDesignMap[d].ajjihus.push(entry.ajjihu.trim());
            }
            if (entry.ajtn && entry.ajtn.trim()) {
                allDesignMap[d].hasAjtn = true;
                allDesignMap[d].ajtns.push(entry.ajtn.trim());
            }
            if (entry.ajde && entry.ajde.trim()) {
                allDesignMap[d].hasAjde = true;
                allDesignMap[d].ajdes.push(entry.ajde.trim());
            }
        }
    });

    // Classify each design
    const allDesigns = [];
    const liveDesigns = [];
    const notLiveDesigns = [];

    Object.values(allDesignMap).forEach(item => {
        if (!item.hasEntryInRange) return;

        const hasAnyAjValue = item.hasAjjihu || item.hasAjtn || item.hasAjde;

        if (hasAnyAjValue) {
            // AJ JIHU / AJ TN / AJ DE has value = Live
            item.status = 'Live';
            item.statusClass = 'badge-live';
            liveDesigns.push(item);
        } else {
            // Nothing written in AJ fields = Not Live
            item.status = 'Not Live';
            item.statusClass = 'badge-notlive';
            notLiveDesigns.push(item);
        }
        allDesigns.push(item);
    });

    // Sort all lists
    allDesigns.sort((a, b) => a.design.localeCompare(b.design));
    liveDesigns.sort((a, b) => a.design.localeCompare(b.design));
    notLiveDesigns.sort((a, b) => a.design.localeCompare(b.design));

    // Update summary cards
    document.getElementById('reportResults').classList.remove('hidden');
    document.getElementById('totalCount').textContent = allDesigns.length;
    document.getElementById('liveCount').textContent = liveDesigns.length;
    document.getElementById('notliveCount').textContent = notLiveDesigns.length;

    // Fill Total Designs table (with status column)
    fillTotalReportTable('totalTableBody', 'totalTableFoot', allDesigns, liveDesigns.length, notLiveDesigns.length);

    // Fill category tables with grand total
    fillReportTable('liveTableBody', 'liveTableFoot', liveDesigns, 'No live designs found in this range.');
    fillReportTable('notliveTableBody', 'notliveTableFoot', notLiveDesigns, 'No not-live designs found in this range.');

    // Show total tab by default
    showReportTab('total');

    // Smooth scroll
    document.getElementById('reportResults').scrollIntoView({ behavior: 'smooth' });
}

function fillTotalReportTable(tbodyId, tfootId, designList, liveC, notliveC) {
    const tbody = document.getElementById(tbodyId);
    const tfoot = document.getElementById(tfootId);

    if (designList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#999;">No designs found.</td></tr>';
        tfoot.innerHTML = '';
    } else {
        tbody.innerHTML = designList.map((item, index) => `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td style="font-weight:600;">${item.design}</td>
                <td><span class="badge">${item.count}</span></td>
                <td>${item.jdates.length > 0 ? item.jdates.map(d => formatDateForReport(d)).join(', ') : '-'}</td>
                <td>${item.tdates.length > 0 ? item.tdates.map(d => formatDateForReport(d)).join(', ') : '-'}</td>
                <td>${item.ddates.length > 0 ? item.ddates.map(d => formatDateForReport(d)).join(', ') : '-'}</td>
                <td><span class="badge ${item.statusClass}">${item.status}</span></td>
            </tr>
        `).join('');

        const totalEntries = designList.reduce((sum, d) => sum + d.count, 0);
        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td colspan="2" style="text-align:right; font-weight:800; font-size:15px;">Grand Total:</td>
                <td><span class="badge badge-total">${totalEntries}</span></td>
                <td colspan="2" style="font-weight:700; color:#11998e;">Live: ${liveC}</td>
                <td style="font-weight:700; color:#eb3349;">Not Live: ${notliveC}</td>
                <td style="font-weight:800; font-size:15px;">${designList.length} Designs</td>
            </tr>
        `;
    }
}

function fillReportTable(tbodyId, tfootId, designList, emptyMsg) {
    const tbody = document.getElementById(tbodyId);
    const tfoot = document.getElementById(tfootId);

    if (designList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">${emptyMsg}</td></tr>`;
        tfoot.innerHTML = '';
    } else {
        tbody.innerHTML = designList.map((item, index) => `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td style="font-weight:600;">${item.design}</td>
                <td><span class="badge">${item.count}</span></td>
                <td>${item.ajjihus.length > 0 ? item.ajjihus.join(', ') : '-'}</td>
                <td>${item.ajtns.length > 0 ? item.ajtns.join(', ') : '-'}</td>
                <td>${item.ajdes.length > 0 ? item.ajdes.join(', ') : '-'}</td>
            </tr>
        `).join('');

        const totalEntries = designList.reduce((sum, d) => sum + d.count, 0);
        const totalAjjihu = designList.reduce((sum, d) => sum + d.ajjihus.length, 0);
        const totalAjtn = designList.reduce((sum, d) => sum + d.ajtns.length, 0);
        const totalAjde = designList.reduce((sum, d) => sum + d.ajdes.length, 0);

        tfoot.innerHTML = `
            <tr class="grand-total-row">
                <td colspan="2" style="text-align:right; font-weight:800; font-size:14px;">Grand Total:</td>
                <td><span class="badge badge-total">${totalEntries}</span></td>
                <td style="font-weight:700; color:#11998e;">AJ JIHU: ${totalAjjihu}</td>
                <td style="font-weight:700; color:#667eea;">AJ TN: ${totalAjtn}</td>
                <td style="font-weight:700; color:#e67e22;">AJ DE: ${totalAjde}</td>
            </tr>
        `;
    }
}

function showReportTab(tab) {
    const panels = ['total', 'live', 'notlive'];
    panels.forEach(p => {
        const panel = document.getElementById(p + 'Panel');
        const tabBtn = document.getElementById('tab' + p.charAt(0).toUpperCase() + p.slice(1));
        if (panel && tabBtn) {
            if (p === tab) {
                panel.classList.remove('hidden');
                tabBtn.classList.add('active');
            } else {
                panel.classList.add('hidden');
                tabBtn.classList.remove('active');
            }
        }
    });
}

function formatDateForReport(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('signInForm')) {
        document.getElementById('signin-email').focus();
    } else if (document.getElementById('entriesTableBody')) {
        loadDashboard();
        showSection('entry'); // Default section
    }
});
