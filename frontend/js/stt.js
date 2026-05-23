/**
 * VoiceBridge — Speech-to-Text (STT) Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    const micBtn = document.getElementById('micBtn');
    const sttOutput = document.getElementById('sttOutput');
    const sttLang = document.getElementById('sttLang');
    const sttStatus = document.getElementById('sttStatus');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;
    let accumulatedTranscript = '';   // Stores full transcript while listening
    let interimChunk = '';            // Current interim result

    if (!SpeechRecognition) {
        if (micBtn) {
            micBtn.disabled = true;
            micBtn.querySelector('.btn-text').innerText = 'Browser Not Supported';
        }
        console.warn('⚠️ Web Speech API not supported in this browser.');
        return;
    }

    const renderLiveTranscript = () => {
        const liveText = (accumulatedTranscript + interimChunk).trim();
        if (!sttOutput) return;

        if (liveText) {
            sttOutput.innerHTML = `<div class="stt-listening-indicator"><div class="stt-wave"><span></span><span></span><span></span><span></span><span></span></div><p>${liveText}</p></div>`;
        } else {
            sttOutput.innerHTML = '<div class="stt-listening-indicator"><div class="stt-wave"><span></span><span></span><span></span><span></span><span></span></div><p>Listening… speak now. Transcript will appear when you stop.</p></div>';
        }
    };

    const createRecognition = () => {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = sttLang ? sttLang.value : 'en-IN';

        rec.onresult = (event) => {
            let finalText = '';
            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalText += transcript + ' ';
                } else {
                    interimText += transcript;
                }
            }
            if (finalText) accumulatedTranscript += finalText;
            interimChunk = interimText;
            renderLiveTranscript();
        };

        rec.onerror = (event) => {
            console.error('❌ STT Error:', event.error);
            const errorText = event.error;
            if (errorText === 'not-allowed' || errorText === 'permission-denied' || errorText === 'service-not-allowed') {
                stopSTT();
                if (sttOutput) sttOutput.innerHTML = '<div class="stt-error">🚫 Microphone access denied. Please allow microphone permission.</div>';
            } else if (errorText === 'no-speech' || errorText === 'audio-capture') {
                if (sttOutput) sttOutput.innerHTML = '<div class="stt-error">🚫 No audio was detected. Please check your microphone and try again.</div>';
            } else if (errorText === 'aborted') {
                if (sttOutput) sttOutput.innerHTML = '<div class="stt-error">🚫 Voice capture was interrupted. Please try again.</div>';
            }
        };

        rec.onend = () => {
            if (isListening && recognition) {
                try { recognition.start(); } catch (e) { console.warn('STT restart skipped:', e); }
            }
        };

        rec.onnomatch = () => {
            if (sttOutput) sttOutput.innerHTML = '<div class="stt-error">No speech recognized. Please try again.</div>';
        };

        return rec;
    };

    const startSTT = () => {
        accumulatedTranscript = '';
        interimChunk = '';
        recognition = createRecognition();
        isListening = true;

        micBtn.classList.add('listening');
        micBtn.querySelector('.btn-text').innerText = 'Stop Listening';
        micBtn.querySelector('.btn-icon').innerText = '🛑';
        
        if (sttStatus) {
            sttStatus.style.display = 'flex';
            sttStatus.innerHTML = '<span class="pulse-dot"></span> Listening…';
        }
        
        if (sttOutput) {
            sttOutput.innerHTML = '<div class="stt-listening-indicator"><div class="stt-wave"><span></span><span></span><span></span><span></span><span></span></div><p>Listening… speak now. Transcript will appear when you stop.</p></div>';
        }

        try {
            recognition.start();
            console.log('🎤 Listening started');
        } catch (e) {
            console.error('Failed to start recognition:', e);
        }
    };

    const stopSTT = () => {
        isListening = false;
        if (recognition) {
            try { recognition.stop(); } catch (e) { /* ignore */ }
            recognition = null;
        }

        if (micBtn) {
            micBtn.classList.remove('listening');
            micBtn.querySelector('.btn-text').innerText = 'Start Listening';
            micBtn.querySelector('.btn-icon').innerText = '🎤';
        }
        
        if (sttStatus) sttStatus.style.display = 'none';

        const finalTranscript = (accumulatedTranscript + interimChunk).trim();
        if (sttOutput) {
            if (finalTranscript) {
                sttOutput.innerHTML = `<div class="stt-result"><p>${finalTranscript}</p><div class="stt-result-actions"><button class="btn btn-soft btn-sm" id="copySttBtn">📋 Copy</button><button class="btn btn-soft btn-sm" id="clearSttBtn">🗑️ Clear</button></div></div>`;
                
                document.getElementById('copySttBtn')?.addEventListener('click', () => {
                    navigator.clipboard.writeText(finalTranscript).then(() => {
                        const btn = document.getElementById('copySttBtn');
                        btn.innerText = '✅ Copied!';
                        setTimeout(() => { btn.innerText = '📋 Copy'; }, 1500);
                    });
                });
                
                document.getElementById('clearSttBtn')?.addEventListener('click', () => {
                    sttOutput.innerHTML = '<div class="placeholder-text">Click the mic to start listening...</div>';
                });
                
                console.log('📄 Final transcript rendered');
            } else {
                sttOutput.innerHTML = '<div class="placeholder-text">No speech detected. Try again.</div>';
            }
        }
        console.log('🛑 Listening stopped');
    };

    if (micBtn) {
        micBtn.addEventListener('click', () => {
            if (isListening) stopSTT();
            else startSTT();
        });
    }

    if (sttLang) {
        sttLang.addEventListener('change', () => {
            if (isListening) {
                stopSTT();
                setTimeout(startSTT, 200);
            }
        });
    }

    console.log('✅ STT initialized');
});
