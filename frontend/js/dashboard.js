/**
 * VoiceBridge Dashboard Logic
 * Handles dashboard data fetching, call history, and protection
 */

document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const token = localStorage.getItem('vb_token');
    const user = JSON.parse(localStorage.getItem('vb_user') || 'null');

    const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:8080'
        : 'https://communication-site.onrender.com';

    // Dashboard Protection
    const isDashboardVisible = () => {
        return window.location.hash === '#userDashboard' || document.getElementById('userDashboard')?.style.display === 'block';
    };

    if (isDashboardVisible() && !token) {
        window.location.hash = '#Home';
        alert('Please login to access the dashboard');
    }

    // --- Communication Suite Button → opens modal ---
    const dashboardSuiteBtn = document.getElementById('dashboardSuiteBtn');
    const openCallModal = document.getElementById('openCallModal');

    if (dashboardSuiteBtn) {
        dashboardSuiteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const commModal = document.getElementById('commModal');
            if (commModal) {
                commModal.removeAttribute('inert');
                commModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
                console.log('✅ Communication Suite opened');
            }
        });
    }

    if (openCallModal) {
        openCallModal.addEventListener('click', () => {
            const callModal = document.getElementById('callModal');
            if (callModal) {
                callModal.removeAttribute('inert');
                callModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }
        });
    }

    // --- Call History & Reports ---
    const loadDashboardData = async () => {
        if (!token) return;
        const historyList = document.getElementById('historyList');
        const historyEmpty = document.getElementById('historyEmpty');
        const reportsBody = document.getElementById('userReportsBody');
        if (!historyList) return;

        try {
            // Fetch Calls
            const res = await fetch(`${API}/api/calls/history`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                const calls = data.calls || data || [];

                if (calls.length === 0) {
                    if (historyEmpty) historyEmpty.style.display = 'block';
                } else {
                    if (historyEmpty) historyEmpty.style.display = 'none';
                    historyList.querySelectorAll('.history-card').forEach(c => c.remove());

                    calls.forEach(call => {
                        const card = document.createElement('div');
                        card.className = 'history-card dashboard-card';
                        card.style.padding = '1rem';
                        const date = new Date(call.created_at);
                        const duration = call.duration >= 60
                            ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s`
                            : `${call.duration}s`;

                        card.innerHTML = `
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                                <strong>${call.contact_name || 'Unknown'}</strong>
                                <span style="font-size:0.8rem; color:var(--muted-foreground)">${date.toLocaleDateString()}</span>
                            </div>
                            <div style="margin-bottom:0.5rem;">
                                <span class="badge">⏱️ ${duration}</span>
                                <span class="badge">🌐 ${call.language || 'en-IN'}</span>
                            </div>
                            <p style="font-size:0.9rem; color:var(--muted-foreground); white-space:pre-wrap; max-height:80px; overflow-y:auto; border-top:1px solid var(--border); padding-top:0.5rem; margin-top:0.5rem;">${call.transcript || 'No summary available'}</p>
                        `;
                        historyList.appendChild(card);
                    });
                }
            }

            // Fetch Reports
            const repRes = await fetch(`${API}/api/reports`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (repRes.ok && reportsBody) {
                const repData = await repRes.json();
                const reports = repData.reports || [];

                if (reports.length > 0) {
                    reportsBody.innerHTML = '';
                    reports.forEach(r => {
                        const tr = document.createElement('tr');
                        const d = new Date(r.created_at);
                        tr.innerHTML = `
                            <td style="padding: 12px; border-bottom: 1px solid hsl(var(--border));">${r.subject || r.issue_type}</td>
                            <td style="padding: 12px; border-bottom: 1px solid hsl(var(--border));">${r.description.substring(0, 40)}...</td>
                            <td style="padding: 12px; border-bottom: 1px solid hsl(var(--border));"><span class="badge ${r.status.toLowerCase() === 'resolved' ? 'badge-success' : 'badge-warning'}">${r.status}</span></td>
                            <td style="padding: 12px; border-bottom: 1px solid hsl(var(--border));">${d.toLocaleDateString()}</td>
                        `;
                        reportsBody.appendChild(tr);
                    });
                }
            }

        } catch (err) {
            console.error('Failed to load dashboard data:', err);
        }
    };

    // Load history when dashboard becomes visible
    if (isDashboardVisible() && token) {
        loadDashboardData();
    }

    // Also load when navigating to dashboard via hash
    window.addEventListener('hashchange', () => {
        if (window.location.hash === '#userDashboard' && token) {
            loadDashboardData();
        }
    });

    // --- History Modal Actions ---
    const exportBtn = document.getElementById('exportTranscriptBtn');
    const deleteBtn = document.getElementById('deleteHistoryBtn');

    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            console.log('📄 Exporting transcript...');
            alert('Transcript exported as TXT');
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this history?')) {
                console.log('🗑️ Deleting history...');
                const historyModal = document.getElementById('historyModal');
                if (historyModal) {
                    historyModal.style.display = 'none';
                    historyModal.setAttribute('inert', '');
                }
            }
        });
    }

    // --- Profile Actions ---
    const updateProfileBtn = document.getElementById('updateProfileBtn');
    if (updateProfileBtn) {
        updateProfileBtn.addEventListener('click', () => {
            console.log('👤 Updating profile...');
            alert('Profile updated (demo)');
        });
    }

    console.log('✅ Dashboard logic initialized');
});
