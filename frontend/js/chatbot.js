/**
 * VoiceBridge — AI Assistant Integration
 * Powered by Google Gemini
 */

document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chatForm');
    const chatInput = document.getElementById('chatInput');
    const chatBody = document.getElementById('chatBody');

    if (!chatForm || !chatInput || !chatBody) return;

    // Add initial greeting message
    addMessage('Bridge Assistant', 'Hello! I am Bridge, your accessibility communication assistant. How can I help you today?', false);

    // Enter-to-send is naturally handled by the form submit event
    let isSending = false;

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (isSending) return;

        const message = chatInput.value.trim();
        if (!message) return;

        isSending = true;
        if (chatInput) chatInput.disabled = true;

        // Display user message
        addMessage('You', message, true);
        chatInput.value = '';

        // Display typing indicator
        const typingId = showTypingIndicator();

        try {
            const token = localStorage.getItem('vb_token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

        const API =
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1'
            ? 'http://localhost:8080'
            : 'https://communication-site.onrender.com';

            // We add a short timeout using AbortController to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${API}/api/ai/chat`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ message }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            removeTypingIndicator(typingId);

            const responseText = await response.text();
            let data = null;
            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                try { data = responseText ? JSON.parse(responseText) : null; } catch (e) { data = null; }
            }

            if (!response.ok) {
                const remoteMsg = data && (data.error || data.message) ? (data.error || data.message) : responseText;
                console.error('[AI Chat] Bad response', { url: `${API}/api/ai/chat`, status: response.status, bodyPreview: String(remoteMsg).slice(0,200) });
                throw new Error((data && (data.error || data.message)) ? (data.error || data.message) : `Server returned ${response.status}`);
            }

            if (!data) {
                // non-JSON but OK response — show raw text
                if (responseText && responseText.trim()) {
                    addMessage('Bridge Assistant', responseText.trim(), false);
                } else {
                    throw new Error('Invalid response from server');
                }
            } else if (data && data.success && data.reply) {
                addMessage('Bridge Assistant', data.reply, false);
            } else {
                throw new Error((data && (data.error || data.message)) ? (data.error || data.message) : 'Failed to get a response from the AI Assistant');
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            console.error('AI Chat Error:', error);

            let errorMsg = 'Sorry, I am having trouble connecting to my servers right now.';
            if (error.name === 'AbortError' || error.message.includes('timed out')) {
                errorMsg = 'The request timed out. Please check your connection and try again.';
            } else if (error.message.includes('401')) {
                errorMsg = 'Please log in to use the AI Assistant.';
            }

            addMessage('System', errorMsg, false, true);
        } finally {
            isSending = false;
            if (chatInput) chatInput.disabled = false;
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
