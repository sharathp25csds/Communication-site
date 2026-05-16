/**
 * VoiceBridge — Live Caption Call System
 * PeerJS-based P2P audio with real-time speech-to-text captions
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========== DOM ELEMENTS ==========
  const myPeerIdDisplay = document.getElementById('myPeerId');
  const remotePeerIdInput = document.getElementById('remotePeerIdInput');
  const contactNameInput = document.getElementById('contactNameInput');
  const startCallBtn = document.getElementById('startCallBtn');
  const hangUpBtn = document.getElementById('hangUpBtn');
  const copyPeerIdBtn = document.getElementById('copyPeerIdBtn');
  const callStatusText = document.getElementById('callStatusText');
  const callStatusDot = document.getElementById('callStatusDot');
  const youCaption = document.getElementById('youCaption');
  const themCaption = document.getElementById('themCaption');
  const muteBtn = document.getElementById('muteBtn');
  const micToggleBtn = document.getElementById('micToggleBtn');
  const toggleCaptionThemeBtn = document.getElementById('toggleCaptionThemeBtn');
  const callLang = document.getElementById('callLang');

  // ========== STATE ==========
  let peer = null;
  let currentCall = null;
  let dataConnection = null;
  let localStream = null;
  let callRecognition = null;
  let isCallListening = false;
  let callStartTime = null;
  let isMuted = false;
  let fullConversationTranscript = '';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // ========== PEERJS INIT ==========
  const initPeer = () => {
    if (typeof Peer === 'undefined') {
      console.warn('⚠️ PeerJS library not loaded. Live caption features unavailable.');
      setStatus('PeerJS unavailable', 'error');
      return;
    }

    try {
      peer = new Peer({ host: "0.peerjs.com", port: 443, secure: true }); // Official public server config

      peer.on('open', (id) => {
        console.log('✅ Peer ID generated:', id);
        if (myPeerIdDisplay) myPeerIdDisplay.innerText = id;
        setStatus('Ready — waiting for a call', 'ready');
      });

      peer.on('call', (call) => {
        console.log('📞 Incoming call...');
        setStatus('Incoming call…', 'ringing');

        navigator.mediaDevices.getUserMedia({ audio: true, video: false })
          .then(stream => {
            localStream = stream;
            call.answer(stream);
            handleCall(call);
          })
          .catch(err => {
            console.error('Mic access denied for incoming call:', err);
            setStatus('Mic access denied', 'error');
          });
      });

      peer.on('connection', (conn) => {
        handleDataConnection(conn);
      });

      peer.on('error', (err) => {
        console.error('❌ PeerJS error:', err);
        setStatus('Connection error', 'error');
      });

      peer.on('disconnected', () => {
        setStatus('Disconnected', 'error');
        peer.reconnect();
      });

      console.log('✅ PeerJS initialized');
    } catch (err) {
      console.error('❌ PeerJS init failed:', err);
    }
  };

  // ========== STATUS DISPLAY ==========
  const setStatus = (text, type) => {
    if (callStatusText) callStatusText.innerText = text;
    if (callStatusDot) {
      callStatusDot.className = 'call-status-dot';
      if (type === 'connected') callStatusDot.classList.add('connected');
      else if (type === 'error') callStatusDot.classList.add('error');
      else if (type === 'ringing') callStatusDot.classList.add('ringing');
      else callStatusDot.classList.add('ready');
    }
  };

  // ========== UI HELPER ==========
  const createBubble = (text, isInterim, isYou) => {
    const wrapper = document.createElement('div');
    wrapper.className = `message-row ${isYou ? 'you' : ''}`;
    wrapper.style.margin = '8px 0';
    wrapper.style.animation = 'pop 0.3s ease-out';
    wrapper.style.opacity = isInterim ? '0.7' : '1';
    wrapper.style.transition = 'opacity 0.3s ease';
    wrapper.style.width = '100%';
    
    const inner = document.createElement('div');
    inner.className = `message-bubble ${isYou ? 'you' : ''}`;
    inner.style.padding = '10px 14px';
    inner.style.fontSize = '0.95rem';
    inner.style.maxWidth = '85%';
    inner.style.wordBreak = 'break-word';
    inner.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
    
    const textNode = document.createElement('span');
    textNode.className = 'bubble-text';
    textNode.textContent = text + (isInterim ? '...' : '');
    inner.appendChild(textNode);
    
    const timeSpan = document.createElement('div');
    timeSpan.className = 'message-time';
    timeSpan.style.textAlign = isYou ? 'right' : 'left';
    timeSpan.style.marginTop = '4px';
    timeSpan.style.fontSize = '0.7rem';
    timeSpan.style.opacity = '0.7';
    timeSpan.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    inner.appendChild(timeSpan);
    wrapper.appendChild(inner);
    return wrapper;
  };

  const updateCaptionUI = (container, finalText, interimText, isYou) => {
    if (!container) return;

    const placeholder = container.querySelector('.caption-placeholder');
    if (placeholder) placeholder.remove();

    let interimBubble = container.interimBubble;

    if (finalText && finalText.trim()) {
      const finalBubble = createBubble(finalText, false, isYou);
      if (interimBubble && interimBubble.parentNode === container) {
        container.insertBefore(finalBubble, interimBubble);
      } else {
        container.appendChild(finalBubble);
      }
      
      const existing = container.getAttribute('data-final') || '';
      container.setAttribute('data-final', existing + finalText + ' ');
    }

    if (interimText && interimText.trim()) {
      if (!interimBubble || interimBubble.parentNode !== container) {
        interimBubble = createBubble(interimText, true, isYou);
        container.appendChild(interimBubble);
        container.interimBubble = interimBubble;
      } else {
        const textNode = interimBubble.querySelector('.bubble-text');
        if (textNode) textNode.textContent = interimText + '...';
      }
    } else if (interimBubble && interimBubble.parentNode === container) {
      interimBubble.remove();
      container.interimBubble = null;
    }

    container.scrollTop = container.scrollHeight;
  };

  // ========== HANDLE ACTIVE CALL ==========
  const handleCall = (call) => {
    currentCall = call;
    callStartTime = Date.now();
    setStatus('Connected', 'connected');
    console.log('✅ WebRTC connected');

    call.on('stream', (remoteStream) => {
      const remoteAudio = document.getElementById('remoteAudio');
      if (remoteAudio) {
        remoteAudio.srcObject = remoteStream;
        remoteAudio.play().catch(() => {});
      }
    });

    call.on('close', () => {
      endCall(false); // Don't close call again
    });

    call.on('error', (err) => {
      console.error('Call error:', err);
      setStatus('Call error', 'error');
    });

    // Start live captions
    startCallCaptions();
  };

  // ========== DATA CONNECTION ==========
  const handleDataConnection = (conn) => {
    dataConnection = conn;
    
    conn.on('open', () => {
      console.log('🔗 Data connection open');
    });

    conn.on('data', (data) => {
      if (data.type === 'caption') {
        updateCaptionUI(themCaption, data.final, data.interim, false);
        if (data.final && data.final.trim()) {
          fullConversationTranscript += `Speaker 2: ${data.final.trim()}\n`;
        }
      }
    });

    conn.on('close', () => {
      dataConnection = null;
    });
  };

  // ========== LIVE CAPTIONS DURING CALL ==========
  const startCallCaptions = () => {
    if (!SpeechRecognition) {
      if (youCaption) youCaption.innerHTML = '<span class="caption-placeholder">Speech recognition not supported</span>';
      return;
    }

    callRecognition = new SpeechRecognition();
    callRecognition.continuous = true;
    callRecognition.interimResults = true;
    callRecognition.lang = callLang ? callLang.value : 'en-IN';
    isCallListening = true;

    callRecognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript + ' ';
        } else {
          interimText += event.results[i][0].transcript;
        }
      }

      updateCaptionUI(youCaption, finalText, interimText, true);

      if (finalText.trim()) {
        fullConversationTranscript += `Speaker 1: ${finalText.trim()}\n`;
      }

      // Send to remote peer
      if (dataConnection && dataConnection.open) {
        dataConnection.send({
          type: 'caption',
          final: finalText,
          interim: interimText
        });
      }
    };

    callRecognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Caption recognition error:', event.error);
      }
    };

    callRecognition.onend = () => {
      if (isCallListening) {
        try { callRecognition.start(); } catch (e) { /* already running */ }
      }
    };

    try {
      callRecognition.start();
    } catch (e) { console.error('Failed to start captions:', e); }
  };

  const stopCallCaptions = () => {
    isCallListening = false;
    if (callRecognition) {
      try { callRecognition.stop(); } catch (e) { /* ignore */ }
      callRecognition = null;
    }
  };

  // ========== END CALL ==========
  const endCall = (closeCall = true) => {
    if (!currentCall && !localStream) return; // already ended

    const duration = callStartTime ? Math.round((Date.now() - callStartTime) / 1000) : 0;
    const contactName = contactNameInput ? contactNameInput.value.trim() || 'Unknown' : 'Unknown';

    stopCallCaptions();

    if (closeCall && currentCall) {
      try { currentCall.close(); } catch (e) { /* ignore */ }
    }
    
    if (dataConnection) {
      try { dataConnection.close(); } catch (e) { /* ignore */ }
      dataConnection = null;
    }

    // Stop local media
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      localStream = null;
    }

    currentCall = null;
    callStartTime = null;
    isMuted = false;

    setStatus('Call ended', 'ready');
    console.log('📞 Call ended');

    // Save call summary to backend (non-blocking)
    if (duration > 0) {
      saveCallSummary(contactName, duration);
    }

    // Reset captions
    if (youCaption) { 
      youCaption.removeAttribute('data-final'); 
      youCaption.innerHTML = '<span class="caption-placeholder">Speaker 1 captions appear here...</span>'; 
      youCaption.interimBubble = null;
    }
    if (themCaption) { 
      themCaption.removeAttribute('data-final');
      themCaption.innerHTML = '<span class="caption-placeholder">Speaker 2 captions appear here...</span>'; 
      themCaption.interimBubble = null;
    }
    if (muteBtn) { muteBtn.classList.remove('active'); muteBtn.querySelector('span:last-child').innerText = 'Mute'; }
  };

  // ========== SAVE CALL SUMMARY ==========
  const saveCallSummary = async (contactName, duration) => {
    const token = localStorage.getItem('vb_token');
    if (!token) return;

    const API = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) 
      ? import.meta.env.VITE_API_URL 
      : '';

    // Build the transcript summary based on what was said
    const transcriptText = fullConversationTranscript.trim() ? fullConversationTranscript.trim() : `Call with ${contactName} — ${duration}s — ${new Date().toLocaleString()}`;
    fullConversationTranscript = ''; // Reset for next call

    try {
      await fetch(`${API}/api/calls/transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          contact_name: contactName,
          duration: duration,
          transcript: transcriptText
        })
      });
      console.log('💾 Call summary saved');
    } catch (err) {
      console.error('Failed to save call summary:', err);
    }
  };

  // ========== BUTTON HANDLERS ==========

  // Start call
  if (startCallBtn) {
    startCallBtn.addEventListener('click', () => {
      if (!peer) { alert('PeerJS is not ready. Please refresh.'); return; }
      const remoteId = remotePeerIdInput ? remotePeerIdInput.value.trim() : '';
      if (!remoteId) { alert('Please enter a Peer ID to call.'); return; }
      if (currentCall) { alert('Call is already active.'); return; }

      console.log('📞 Outgoing call...');
      setStatus('Calling…', 'ringing');

      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          localStream = stream;
          const call = peer.call(remoteId, stream);
          handleCall(call);

          // Establish data connection for captions
          const conn = peer.connect(remoteId);
          handleDataConnection(conn);
        })
        .catch(err => {
          console.error('Mic access denied:', err);
          setStatus('Mic access denied', 'error');
        });
    });
  }

  // Hang up
  if (hangUpBtn) {
    hangUpBtn.addEventListener('click', () => endCall(true));
  }

  // Copy peer ID
  if (copyPeerIdBtn) {
    copyPeerIdBtn.addEventListener('click', () => {
      const id = myPeerIdDisplay ? myPeerIdDisplay.innerText : '';
      if (id && id !== 'Generating...') {
        navigator.clipboard.writeText(id).then(() => {
          copyPeerIdBtn.innerText = '✅ Copied!';
          setTimeout(() => { copyPeerIdBtn.innerText = 'Copy'; }, 1500);
        });
      }
    });
  }

  // Mute
  if (muteBtn) {
    muteBtn.addEventListener('click', () => {
      if (!localStream) return;
      isMuted = !isMuted;
      localStream.getAudioTracks().forEach(t => { t.enabled = !isMuted; });
      muteBtn.classList.toggle('active', isMuted);
      muteBtn.querySelector('span:last-child').innerText = isMuted ? 'Unmute' : 'Mute';
      console.log(`🔇 Mute: ${isMuted}`);
    });
  }

  // Mic toggle (separate from mute — disables captions too)
  if (micToggleBtn) {
    micToggleBtn.addEventListener('click', () => {
      const isOff = micToggleBtn.classList.toggle('danger');
      micToggleBtn.querySelector('span:last-child').innerText = isOff ? 'Mic Off' : 'Mic On';
      if (localStream) {
        localStream.getAudioTracks().forEach(t => { t.enabled = !isOff; });
      }
      if (isOff) stopCallCaptions();
      else if (currentCall) startCallCaptions();
    });
  }

  // Caption theme toggle
  if (toggleCaptionThemeBtn) {
    toggleCaptionThemeBtn.addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark-caption-theme');
      toggleCaptionThemeBtn.querySelector('span:last-child').innerText = isDark ? 'Light mode' : 'Dark mode';
    });
  }

  // Language change during call
  if (callLang) {
    callLang.addEventListener('change', () => {
      if (isCallListening) {
        stopCallCaptions();
        setTimeout(startCallCaptions, 200);
      }
    });
  }

  // ========== INIT ==========
  initPeer();
  console.log('✅ Live Caption Call system initialized');
});
