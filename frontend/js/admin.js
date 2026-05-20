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
    const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://communication-site.onrender.com';
        
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

    let allUsers = [];
    let allCalls = [];
    let allReports = [];
    let allChats = [];
    let refreshInterval = null;

    const startPolling = () => {
        if (refreshInterval) clearInterval(refreshInterval);
        refreshInterval = setInterval(loadAdminData, 5000);
        console.log('🔄 [Admin Portal] Polling started (5s interval)');
    };

    const stopPolling = () => {
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
            console.log('🔄 [Admin Portal] Polling stopped');
        }
    };

    const filterAndRenderUsers = () => {
        const query = document.getElementById('usersSearch')?.value.toLowerCase().trim() || '';
        const filtered = allUsers.filter(u => 
            (u.name && u.name.toLowerCase().includes(query)) || 
            (u.email && u.email.toLowerCase().includes(query))
        );
        renderUsersTable(filtered, 'usersTable', false);
        
        // Update user count header
        const countSpan = document.getElementById('usersCount');
        if (countSpan) {
            countSpan.innerText = `${filtered.length} user${filtered.length !== 1 ? 's' : ''}`;
        }
    };

    const filterAndRenderCalls = () => {
        const query = document.getElementById('transcriptsSearch')?.value.toLowerCase().trim() || '';
        const filtered = allCalls.filter(c => 
            (c.user_name && c.user_name.toLowerCase().includes(query)) ||
            (c.contact_name && c.contact_name.toLowerCase().includes(query)) ||
            (c.transcript && c.transcript.toLowerCase().includes(query)) ||
            (c.language && c.language.toLowerCase().includes(query))
        );
        renderCallsTable(filtered);
        
        // Update transcripts count header
        const countSpan = document.getElementById('transcriptsCount');
        if (countSpan) {
            countSpan.innerText = `${filtered.length} transcript${filtered.length !== 1 ? 's' : ''}`;
        }
    };

    const filterAndRenderReports = () => {
        const statusFilter = document.getElementById('reportStatusFilter')?.value || '';
        const filtered = allReports.filter(r => 
            !statusFilter || r.status.toLowerCase() === statusFilter.toLowerCase()
        );
        renderReportsTable(filtered);
        
        // Update reports count header
        const countSpan = document.getElementById('reportsCount');
        if (countSpan) {
            countSpan.innerText = `${filtered.length} report${filtered.length !== 1 ? 's' : ''}`;
        }
    };

    const filterAndRenderChats = () => {
        const query = document.getElementById('chatsSearch')?.value.toLowerCase().trim() || '';
        const filtered = allChats.filter(c => 
            (c.user_name && c.user_name.toLowerCase().includes(query)) ||
            (c.message && c.message.toLowerCase().includes(query)) ||
            (c.reply && c.reply.toLowerCase().includes(query))
        );
        renderChatsTable(filtered);
        
        // Update chats count header
        const countSpan = document.getElementById('chatsCount');
        if (countSpan) {
            countSpan.innerText = `${filtered.length} conversation${filtered.length !== 1 ? 's' : ''}`;
        }
    };

    const loadAdminData = async () => {
        const token = localStorage.getItem('vb_admin_token');
        if (!token) return logout();

        try {
            console.log('🔄 [Admin Portal] Fetching latest admin panel data...');
            
            // Load Stats
            const statsRes = await fetch(`${API}/api/admin/stats`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!statsRes.ok) throw new Error('Unauthorized');
            const statsData = await statsRes.json();

            if (statsData.success) {
                document.getElementById('totalUsers').innerText = statsData.stats.totalUsers;
                document.getElementById('totalCalls').innerText = statsData.stats.totalCalls;
                document.getElementById('totalReports').innerText = statsData.stats.totalReports;
                document.getElementById('totalChats').innerText = statsData.stats.totalAiChats;
                
                // Render recent users using helper
                renderUsersTable(statsData.recentUsers, 'usersTable', true);
            }

            // Load Users
            const usersRes = await fetch(`${API}/api/admin/users`, { headers: { 'Authorization': `Bearer ${token}` } });
            const usersData = await usersRes.json();
            if (usersData.success) {
                allUsers = usersData.users;
                filterAndRenderUsers();
            }

            // Load Transcripts
            const callsRes = await fetch(`${API}/api/admin/calls`, { headers: { 'Authorization': `Bearer ${token}` } });
            const callsData = await callsRes.json();
            if (callsData.success) {
                allCalls = callsData.calls;
                filterAndRenderCalls();
            }

            // Load Reports
            const reportsRes = await fetch(`${API}/api/admin/reports`, { headers: { 'Authorization': `Bearer ${token}` } });
            const reportsData = await reportsRes.json();
            if (reportsData.success) {
                allReports = reportsData.reports;
                filterAndRenderReports();
            }

            // Load Chats
            const chatsRes = await fetch(`${API}/api/admin/chats`, { headers: { 'Authorization': `Bearer ${token}` } });
            const chatsData = await chatsRes.json();
            if (chatsData.success) {
                allChats = chatsData.chats;
                filterAndRenderChats();
            }

        } catch (e) {
            console.error('❌ [Admin Portal] Error loading data:', e);
            logout();
        }
    };

    const logout = (showToastAndDelay = false) => {
        console.log('✅ Admin logout started');
        stopPolling();

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
                const response = await fetch(`${API}/api/auth/login`, {
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
                    startPolling();
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

    // Bind real-time search and filter controls
    const usersSearchInput = document.getElementById('usersSearch');
    if (usersSearchInput) {
        usersSearchInput.addEventListener('input', filterAndRenderUsers);
    }

    const transcriptsSearchInput = document.getElementById('transcriptsSearch');
    if (transcriptsSearchInput) {
        transcriptsSearchInput.addEventListener('input', filterAndRenderCalls);
    }

    const chatsSearchInput = document.getElementById('chatsSearch');
    if (chatsSearchInput) {
        chatsSearchInput.addEventListener('input', filterAndRenderChats);
    }

    const reportFilterSelect = document.getElementById('reportStatusFilter');
    if (reportFilterSelect) {
        reportFilterSelect.addEventListener('change', filterAndRenderReports);
    }

    const refreshReportsBtn = document.getElementById('refreshReportsBtn');
    if (refreshReportsBtn) {
        refreshReportsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loadAdminData();
            showToast('Dashboard data refreshed successfully', 'success');
        });
    }

    // Check admin auth on load
    if (localStorage.getItem('vb_admin_token')) {
        if (adminLoginModal) adminLoginModal.style.display = 'none';
        if (adminDashboard) adminDashboard.style.display = 'block';
        loadAdminData();
        startPolling();
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

        // Clear only when not appending recent list
        if (!isRecent) {
            tbody.innerHTML = '';
        }

        if (!users || users.length === 0) {
            if (!isRecent && tbody.children.length === 0) {
                tbody.innerHTML = `
                    <tr class="empty-state">
                        <td colspan="4">
                            <div class="empty-state-inline">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40">
                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                </svg>
                                <span>No users found</span>
                            </div>
                        </td>
                    </tr>
                `;
            }
            return;
        }

        // Clean up empty-state row if we are appending recent list
        if (isRecent) {
            const emptyStateRow = tbody.querySelector('.empty-state');
            if (emptyStateRow) emptyStateRow.remove();
        }

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
                <td><strong>${c.user_name || 'Guest'}</strong></td>
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
                <td><strong>${r.user_name || 'Guest'}</strong></td>
                <td>${r.user_email || 'N/A'}</td>
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

    function renderChatsTable(chats) {
        const tbody = document.querySelector('#chatsTable tbody');
        if (!tbody) return;
        if (!chats || chats.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="5">
                        <div class="empty-state-inline" style="display:flex; flex-direction:column; align-items:center; padding: 2rem; color:var(--muted-foreground);">
                            <span style="font-size:2rem; margin-bottom:1rem;">💬</span>
                            <span>No chats found. Conversations with Bridge AI will appear here.</span>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = '';
        chats.forEach(c => {
            const d = new Date(c.created_at);
            
            // User Row
            const userTr = document.createElement('tr');
            userTr.innerHTML = `
                <td>#${c.id}-U</td>
                <td><strong>${c.user_name || 'Guest'}</strong></td>
                <td><span class="badge badge-info" style="font-size:0.75rem;">User</span></td>
                <td>${c.message}</td>
                <td>${d.toLocaleString()}</td>
            `;
            tbody.appendChild(userTr);

            // AI Row
            const aiTr = document.createElement('tr');
            aiTr.innerHTML = `
                <td>#${c.id}-A</td>
                <td><strong>Bridge AI</strong></td>
                <td><span class="badge badge-success" style="font-size:0.75rem;">AI</span></td>
                <td>${c.reply}</td>
                <td>${d.toLocaleString()}</td>
            `;
            tbody.appendChild(aiTr);
        });
    }

    // Expose for inline buttons
    window.updateReportStatus = async (id, status) => {
        const token = localStorage.getItem('vb_admin_token');
        try {
            await fetch(`${API}/api/reports/status/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            loadAdminData(); // Refresh UI
        } catch (err) {
            console.error('❌ [Admin Portal] Error updating report status:', err);
        }
    };
});
