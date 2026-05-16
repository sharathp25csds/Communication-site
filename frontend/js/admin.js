/**
 * VoiceBridge Admin Portal Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🛡️ Admin Portal Initializing...');

    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const adminDashboard = document.getElementById('adminDashboard');
    const adminLoginModal = document.getElementById('adminLoginModal');
    const adminLogoutBtn = document.getElementById('adminLogoutBtn');
    const adminError = document.getElementById('adminError');
    
        const API_BASE = 'https://communication-site-production.up.railway.app/api';

    // Helper: Close Modal
    const closeAdminModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
            modal.setAttribute('aria-hidden', 'true');
        }
    };

    // Close buttons for admin modal
    document.querySelectorAll('#xCloseAdminLogin, #closeAdminLogin').forEach(btn => {
        btn.addEventListener('click', () => closeAdminModal(adminLoginModal));
    });

    const loadAdminData = async () => {
        const token = localStorage.getItem('vb_admin_token');
        if (!token) return logout();

        try {
            // Load Stats
            const statsRes = await fetch(`${API_BASE}/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!statsRes.ok) throw new Error('Unauthorized');
            const statsData = await statsRes.json();
            
            if (statsData.success) {
                document.getElementById('totalUsers').innerText = statsData.stats.totalUsers;
                document.getElementById('totalCalls').innerText = statsData.stats.totalCalls;
                document.getElementById('totalReports').innerText = statsData.stats.totalReports;
                document.getElementById('totalChats').innerText = statsData.stats.totalAiChats;
                renderUsersTable(statsData.recentUsers, 'usersTable', true);
            }

            // Load Users
            const usersRes = await fetch(`${API_BASE}/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            const usersData = await usersRes.json();
            if (usersData.success) renderUsersTable(usersData.users, 'usersTable', false);

            // Load Transcripts
            const callsRes = await fetch(`${API_BASE}/admin/calls`, { headers: { 'Authorization': `Bearer ${token}` } });
            const callsData = await callsRes.json();
            if (callsData.success) renderCallsTable(callsData.calls);

            // Load Reports
            const reportsRes = await fetch(`${API_BASE}/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } });
            const reportsData = await reportsRes.json();
            if (reportsData.success) renderReportsTable(reportsData.reports);

        } catch (e) {
            console.error(e);
            logout();
        }
    };

    const logout = (showToastAndDelay = false) => {
        console.log('✅ Admin logout started');
        
        // Remove all admin-related auth persistence safely
        localStorage.removeItem('vb_admin_token');
        localStorage.removeItem('adminAuth');
        sessionStorage.removeItem('vb_admin_token');
        sessionStorage.removeItem('adminAuth');
        
        console.log('🗑️ Session cleared');

        const doRedirect = () => {
            console.log('✅ Redirecting to homepage');
            window.location.replace('index.html');
        };

        if (showToastAndDelay) {
            showToast('Logged out successfully', 'success');
            
            // Show loading animation on the logout button if possible
            if (adminLogoutBtn) {
                adminLogoutBtn.style.opacity = '0.5';
                adminLogoutBtn.style.pointerEvents = 'none';
                const svg = adminLogoutBtn.querySelector('svg');
                if (svg) svg.style.display = 'none';
                adminLogoutBtn.innerHTML = '<span class="btn-loader" style="display:inline-block; width:14px; height:14px; margin-right:8px; border-width:2px;"></span> Logging out...';
            }

            // Smooth transition before redirect
            document.body.style.transition = 'opacity 0.4s ease';
            document.body.style.opacity = '0';
            
            setTimeout(doRedirect, 800);
        } else {
            doRedirect();
        }
    };
    
    // Toast helper for Admin UI
    const showToast = (msg, type = 'info') => {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return alert(msg);
        
        const toast = document.createElement('div');
        toast.className = `toast ${type} show`;
        const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
        toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${msg}</span>`;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    };

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', async () => {
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;
            const btnText = adminLoginBtn.querySelector('.btn-text');
            const btnLoader = adminLoginBtn.querySelector('.btn-loader');

            if (btnText) btnText.style.display = 'none';
            if (btnLoader) btnLoader.style.display = 'inline-block';
            adminLoginBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                
                const data = await response.json();

                if (response.ok && data.user && data.user.role === 'admin') {
                    if (adminLoginModal) adminLoginModal.style.display = 'none';
                    if (adminDashboard) adminDashboard.style.display = 'block';
                    localStorage.setItem('vb_admin_token', data.token);
                    console.log('✅ Admin authenticated');
                    loadAdminData();
                } else {
                    if (adminError) {
                        adminError.innerText = response.ok ? 'Not authorized as admin' : (data.message || 'Invalid credentials');
                        adminError.style.display = 'block';
                    }
                }
            } catch (err) {
                if (adminError) {
                    adminError.innerText = 'Network error occurred';
                    adminError.style.display = 'block';
                }
            } finally {
                if (btnText) btnText.style.display = 'inline';
                if (btnLoader) btnLoader.style.display = 'none';
                adminLoginBtn.disabled = false;
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout(true);
        });
    }

    // Check admin auth on load
    if (localStorage.getItem('vb_admin_token')) {
        if (adminLoginModal) adminLoginModal.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        loadAdminData();
    }

    // Sidebar navigation
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const sectionId = link.getAttribute('data-section');
            if (!sectionId) return;

            e.preventDefault();
            
            document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
            const targetSection = document.getElementById(`${sectionId}-section`);
            if (targetSection) targetSection.classList.add('active');
            
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    document.querySelectorAll('button[data-section]').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.getAttribute('data-section');
            const correspondingLink = document.querySelector(`.sidebar-link[data-section="${sectionId}"]`);
            if (correspondingLink) correspondingLink.click();
        });
    });

    // Render tables
    function renderUsersTable(users, tableId, isRecent) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (!tbody) return;
        if (!users || users.length === 0) return;
        
        if (!isRecent) tbody.innerHTML = '';
        
        users.forEach(u => {
            const tr = document.createElement('tr');
            const d = new Date(u.created_at);
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${d.toLocaleDateString()}</td>
                <td>${d.toLocaleTimeString()}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderCallsTable(calls) {
        const tbody = document.querySelector('#transcriptsTable tbody');
        if (!tbody) return;
        if (!calls || calls.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="8">
                        <div class="empty-state-inline" style="display:flex; flex-direction:column; align-items:center; padding: 2rem; color:var(--muted-foreground);">
                            <span style="font-size:2rem; margin-bottom:1rem;">📞</span>
                            <span>No transcripts found. Calls will appear here.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        calls.forEach(c => {
            const tr = document.createElement('tr');
            
            const startD = new Date(c.created_at);
            const durationSecs = parseInt(c.duration) || 0;
            const endD = new Date(startD.getTime() + (durationSecs * 1000));
            
            const formatDur = durationSecs >= 60 
                ? `${Math.floor(durationSecs / 60)}m ${durationSecs % 60}s` 
                : `${durationSecs}s`;

            const transcriptPreview = c.transcript ? c.transcript.substring(0, 40) + '...' : 'No summary';

            tr.innerHTML = `
                <td>#${c.id}</td>
                <td><strong>${c.user_name}</strong></td>
                <td>${c.contact_name || 'Unknown'}</td>
                <td>${formatDur}</td>
                <td>${startD.toLocaleTimeString()}</td>
                <td>${endD.toLocaleTimeString()}</td>
                <td title="${c.transcript || ''}">${transcriptPreview}</td>
                <td><span class="badge badge-success" style="font-size:0.75rem;">Completed</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderReportsTable(reports) {
        const tbody = document.querySelector('#reportsTableBody');
        if (!tbody) return;
        if (!reports || reports.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="8">
                        <div class="empty-state-inline" style="display:flex; flex-direction:column; align-items:center; padding: 2rem; color:var(--muted-foreground);">
                            <span style="font-size:2rem; margin-bottom:1rem;">📝</span>
                            <span>No reports found. User reports will appear here.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = '';
        reports.forEach(r => {
            const tr = document.createElement('tr');
            const d = new Date(r.created_at);
            
            const isResolved = r.status.toLowerCase() === 'resolved';
            const badgeClass = isResolved ? 'badge-success' : 'badge-warning';
            
            tr.innerHTML = `
                <td>#${r.id}</td>
                <td><strong>${r.user_name}</strong></td>
                <td>${r.user_email}</td>
                <td>${r.subject || r.issue_type}</td>
                <td title="${r.description}">${r.description.substring(0, 40)}...</td>
                <td>${d.toLocaleString()}</td>
                <td><span class="badge ${badgeClass}">${r.status}</span></td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-report-action btn-report-resolve ${isResolved ? 'active' : ''}" onclick="updateReportStatus(${r.id}, 'resolved')" ${isResolved ? 'disabled' : ''}>
                            Resolve
                        </button>
                        <button class="btn-report-action btn-report-pending ${!isResolved ? 'active' : ''}" onclick="updateReportStatus(${r.id}, 'pending')" ${!isResolved ? 'disabled' : ''}>
                            Pending
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Expose for inline buttons
    window.updateReportStatus = async (id, status) => {
        const token = localStorage.getItem('vb_admin_token');
        try {
            await fetch(`${API_BASE}/reports/status/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            loadAdminData(); // Refresh UI
        } catch (err) {
            console.error(err);
        }
    };
});

