/**
 * VoiceBridge — AI Assistant Integration
 * Powered by Google Gemini
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');

    if (!chatForm || !chatInput || !chatBody) return;

    let isProcessing = false; // Prevent duplicate requests

    // Add initial greeting message
    addMessage('Bridge Assistant', 'Hello! I am Bridge, your accessibility communication assistant. How can I help you today?', false);

    // Enter-to-send is naturally handled by the form submit event
    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Prevent duplicate submissions while a request is in flight
        if (isProcessing) return;

        const message = chatInput.value.trim();
        if (!message) return;

        // Display user message
        addMessage('You', message, true);
        chatInput.value = '';

        // Lock input during processing
        isProcessing = true;
        chatInput.disabled = true;

        // Display typing indicator
        const typingId = showTypingIndicator();

        try {
            const token = localStorage.getItem('vb_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const API = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                ? 'http://localhost:8080'
                : 'https://communication-site.onrender.com';

            // Timeout: 30s for production (Render cold starts can be slow), 15s for local
            const timeoutMs = API.includes('localhost') ? 15000 : 30000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            const response = await fetch(`${API}/api/ai/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            removeTypingIndicator(typingId);

            if (!response.ok) {
                let errData;
                try {
                    errData = await response.json();
                } catch (e) { }
                throw new Error((errData && errData.error) ? errData.error : `Server returned ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.reply) {
                addMessage('Bridge Assistant', data.reply, false);
            } else {
                throw new Error(data.error || 'Failed to get a response');
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            console.error('AI Chat Error:', error);

            let errorMsg = 'Sorry, I am having trouble connecting right now. Please try again.';
            if (error.name === 'AbortError') {
                errorMsg = 'The request timed out. The AI service may be starting up — please try again in a moment.';
            } else if (error.message && error.message.includes('401')) {
                errorMsg = 'Please log in to use the AI Assistant.';
            } else if (error.message && error.message.includes('503')) {
                errorMsg = 'AI service is temporarily unavailable. Please try again shortly.';
            } else if (error.message && error.message !== 'Failed to fetch') {
                // Show the specific backend error message if available
                errorMsg = error.message;
            }

            addMessage('System', errorMsg, false, true);
        } finally {
            // Always unlock input
            isProcessing = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    });

    function addMessage(sender, text, isUser, isError = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `msg ${isUser ? 'user' : ''}`;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'm-avatar';
        avatarDiv.innerHTML = isUser ?
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>' :
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble-msg';
        if (isError) {
            bubbleDiv.style.backgroundColor = '#fee2e2';
            bubbleDiv.style.color = '#991b1b';
            bubbleDiv.style.border = '1px solid #f87171';
        }

        // Convert line breaks to HTML breaks
        bubbleDiv.innerHTML = text.replace(/\n/g, '<br>');

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(bubbleDiv);

        chatBody.appendChild(msgDiv);

        // Auto-scroll
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg';
        msgDiv.id = id;

        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'm-avatar';
        avatarDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path></svg>';

        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'bubble-msg';
        bubbleDiv.innerHTML = '<span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>';

        if (!document.getElementById('typing-style')) {
            const style = document.createElement('style');
            style.id = 'typing-style';
            style.innerHTML = `
                .typing-dot { animation: typing 1.4s infinite ease-in-out both; display: inline-block; font-size: 1.2rem; line-height: 0.5; margin: 0 1px; }
                .typing-dot:nth-child(1) { animation-delay: -0.32s; }
                .typing-dot:nth-child(2) { animation-delay: -0.16s; }
                @keyframes typing { 0%, 80%, 100% { transform: scale(0); } 40% { transform: scale(1); } }
            `;
            document.head.appendChild(style);
        }

        msgDiv.appendChild(avatarDiv);
        msgDiv.appendChild(bubbleDiv);

        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
        }
    }

    console.log('✅ AI Assistant Chatbot Initialized');
});
