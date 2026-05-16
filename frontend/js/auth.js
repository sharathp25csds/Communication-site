/**
 * VoiceBridge Authentication Logic
 * Handles Login, Signup, JWT management, and Dashboard protection
 */

const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8080'
    : 'https://communication-site.onrender.com';

const API_AUTH_URL = `${API}/api/auth`;

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const authModal = document.getElementById('authModal');
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const authSwitchBtn = document.getElementById('authSwitchBtn');
    const authSwitchText = document.getElementById('authSwitchText');
    const nameField = document.getElementById('nameField');
    const authError = document.getElementById('authError');
    const authEmailInput = document.getElementById('authEmail');
    const authPasswordInput = document.getElementById('authPassword');
    const authNameInput = document.getElementById('authName');

    // UI elements for logged in state
    const navAuthBtn = document.getElementById('navAuthBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const dashboardSection = document.getElementById('userDashboard');
    const dashboardUserEmail = document.getElementById('dashboardUserEmail');

    let isLoginMode = true;

    // Initialize Auth UI
    const checkAuthStatus = () => {
        const token = localStorage.getItem('vb_token');
        const user = JSON.parse(localStorage.getItem('vb_user'));

        if (token && user) {
            // User is logged in
            if (navAuthBtn) navAuthBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (dashboardSection) dashboardSection.style.display = 'block';
            if (dashboardUserEmail) dashboardUserEmail.innerText = user.email;
        } else {
            // User is logged out
            if (navAuthBtn) navAuthBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (dashboardSection) dashboardSection.style.display = 'none';

            // If we are on a page that requires auth, redirect (optional depending on UX)
            // if (window.location.hash === '#userDashboard') window.location.hash = '#Home';
        }
    };

    checkAuthStatus();

    // Toggle between Login and Signup
    if (authSwitchBtn) {
        authSwitchBtn.addEventListener('click', (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;

            authTitle.innerText = isLoginMode ? 'Login to VoiceBridge' : 'Create an Account';
            authSubmitBtn.innerText = isLoginMode ? 'Login' : 'Sign up';
            authSwitchText.innerText = isLoginMode ? "Don't have an account?" : "Already have an account?";
            authSwitchBtn.innerText = isLoginMode ? 'Sign up' : 'Login';
            nameField.style.display = isLoginMode ? 'none' : 'block';
            authError.style.display = 'none';
        });
    }

    // Handle Auth Submission
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', async (e) => {
            e.preventDefault(); // Prevent any default form behavior

            if (authSubmitBtn.disabled) return; // Prevent double submission

            const email = authEmailInput.value.trim();
            const password = authPasswordInput.value.trim();
            const name = isLoginMode ? '' : authNameInput.value.trim();

            if (!email || !password || (!isLoginMode && !name)) {
                showError('Please fill all required fields');
                return;
            }

            const endpoint = isLoginMode ? '/login' : '/signup';
            const payload = isLoginMode ? { email, password } : { name, email, password };

            console.log(`📡 [Auth] Attempting ${isLoginMode ? 'Login' : 'Signup'}...`);

            try {
                // UI: Start Loading State
                authSubmitBtn.disabled = true;
                const originalBtnText = authSubmitBtn.innerText;
                authSubmitBtn.innerText = isLoginMode ? 'Logging in...' : 'Creating account...';
                authError.style.display = 'none';

                const response = await fetch(`${API_AUTH_URL}${endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                console.log(`📡 [Auth] Response Status: ${response.status} ${response.statusText}`);

                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error('❌ [Auth] Received non-JSON response:', text.substring(0, 100));
                    throw new Error(`Server returned non-JSON response (${response.status})`);
                }

                const data = await response.json();

                if (response.ok) {
                    console.log('✅ [Auth] Success');
                    localStorage.setItem('vb_token', data.token);
                    localStorage.setItem('vb_user', JSON.stringify(data.user));

                    showSuccess(data.message || 'Success!');

                    setTimeout(() => {
                        closeAuthModal();
                        window.location.hash = '#userDashboard';
                        window.location.reload();
                    }, 1000);
                } else {
                    console.warn('⚠️ [Auth] Failed:', data.message);
                    showError(data.message || 'Authentication failed');
                    authSubmitBtn.disabled = false;
                    authSubmitBtn.innerText = originalBtnText;
                }
            } catch (error) {
                console.error('❌ [Auth] Fetch Error:', error);
                showError('Connection error. Please check if the server is running.');
                authSubmitBtn.disabled = false;
                authSubmitBtn.innerText = isLoginMode ? 'Login' : 'Sign up';
            }
        });
    }

    // Logout Functionality
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('vb_token');
            localStorage.removeItem('vb_user');
            window.location.hash = '#Home';
            window.location.reload();
        });
    }

    // Helper functions
    function showError(msg) {
        authError.style.color = 'red';
        authError.innerText = msg;
        authError.style.display = 'block';
    }

    function showSuccess(msg) {
        authError.style.color = 'green';
        authError.innerText = msg;
        authError.style.display = 'block';
    }

    function closeAuthModal() {
        if (authModal) {
            authModal.setAttribute('inert', '');
            authModal.style.display = 'none';
        }
    }
});
