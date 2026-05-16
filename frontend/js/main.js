/**
 * VoiceBridge Main UI Manager
 * Handles universal button interactions, modals, and navigation
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 VoiceBridge UI Manager Initializing...');

    // --- Helper: Error-Safe Event Binding ---
    const bindEvent = (selector, event, callback) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
            // Only log if it's a critical ID that should exist
            if (selector.startsWith('#')) {
                console.warn(`⚠️ Element not found for selector: ${selector}`);
            }
            return;
        }
        elements.forEach(el => {
            el.addEventListener(event, callback);
        });
        console.log(`✅ Bound '${event}' to ${selector} (${elements.length} elements)`);
    };

    // --- Modal Management ---
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.removeAttribute('inert');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            console.log(`🔓 Opened modal: ${modalId}`);
        }
    };

    const closeModal = (modal) => {
        if (modal) {
            modal.setAttribute('inert', '');
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
            console.log(`🔒 Closed modal: ${modal.id}`);
        }
    };

    // Universal Close Handler for all modals
    const closeAllModals = () => {
        document.querySelectorAll('.modal').forEach(m => closeModal(m));
    };

    bindEvent('.modal-close, .modal-backdrop', 'click', (e) => {
        const modal = e.target.closest('.modal');
        closeModal(modal);
    });

    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // --- Report Form Handling ---
    bindEvent('#reportForm', 'submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;

        const formData = {
            name: form.name.value,
            type: form.type.value,
            message: form.message.value
        };

        if (!formData.type || !formData.message) {
            alert('Please select an issue type and enter a message.');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerText = 'Sending...';

            const token = localStorage.getItem('vb_token');
            if (!token) {
                alert('Please log in to submit a report.');
                return;
            }

            const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8080'
                : 'https://communication-site.onrender.com';

            const response = await fetch(`${API}/api/reports/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    subject: formData.type, // Using issue type as subject for now
                    issue_type: formData.type,
                    description: formData.message,
                    priority: 'medium'
                })
            });

            if (response.ok) {
                console.log('📝 Report Submitted:', formData);
                alert('Thank you! Your report has been submitted successfully.');
                form.reset();
            } else {
                const err = await response.json();
                alert(`Error: ${err.message || 'Failed to submit report'}`);
            }
        } catch (error) {
            console.error('Report submission error:', error);
            alert('Failed to submit report. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    // --- Authentication Modals ---
    bindEvent('#navAuthBtn, [data-open-auth]', 'click', (e) => {
        const mode = e.target.closest('[data-open-auth]')?.getAttribute('data-open-auth') || 'login';
        const authTitle = document.getElementById('authTitle');
        const authSubmitBtn = document.getElementById('authSubmitBtn');
        const authSwitchBtn = document.getElementById('authSwitchBtn');
        const nameField = document.getElementById('nameField');

        if (mode === 'signup') {
            if (authTitle) authTitle.innerText = 'Create an Account';
            if (authSubmitBtn) authSubmitBtn.innerText = 'Sign up';
            if (nameField) nameField.style.display = 'block';
        } else {
            if (authTitle) authTitle.innerText = 'Login to VoiceBridge';
            if (authSubmitBtn) authSubmitBtn.innerText = 'Login';
            if (nameField) nameField.style.display = 'none';
        }

        openModal('authModal');
    });

    // --- Navigation ---
    const scrollToId = (id) => {
        const target = document.getElementById(id);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            console.log(`📍 Scrolled to ${id}`);
        }
    };

    bindEvent('#navHomeBtn, .brand', 'click', (e) => {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href').startsWith('#')) {
            const id = link.getAttribute('href').substring(1);
            if (id.toLowerCase() === 'home') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                scrollToId(id);
            }
        }
    });

    bindEvent('#heroCommBtn, #heroSttBtn', 'click', () => {
        openModal('commModal');
    });

    console.log('✅ STT/TTS button initialized');

    bindEvent('#adminPortalBtn', 'click', () => {
        window.location.href = 'admin.html';
    });

    // --- Dashboard Specifics ---
    // Note: #dashboardSuiteBtn is now handled in dashboard.js for better view switching

    bindEvent('#openCallModal', 'click', () => {
        openModal('callModal');
    });

    // --- Footer Year ---
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.innerText = new Date().getFullYear();
    }

    // --- Communication Suite Tab Switching ---
    const commTabs = document.querySelectorAll('#commModal .tab');
    const commToolContents = document.querySelectorAll('#commModal .tool-content');

    commTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.getAttribute('data-tab');
            commTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            commToolContents.forEach(content => {
                content.hidden = (content.id !== `${target}tool`);
            });
        });
    });

    console.log('✅ VoiceBridge UI Manager Ready');
});
