// /**
//  * VoiceBridge — Text-to-Speech (TTS) Engine
//  */

// document.addEventListener('DOMContentLoaded', () => {
//     const speakBtn = document.getElementById('speakBtn');
//     const pauseBtn = document.getElementById('pauseBtn');
//     const resumeBtn = document.getElementById('resumeBtn');
//     const stopTtsBtn = document.getElementById('stopTtsBtn');
//     const ttsInput = document.getElementById('ttsInput');
//     const ttsLang = document.getElementById('ttsLang');
//     const ttsStatus = document.getElementById('ttsStatus');

//     const synth = window.speechSynthesis;
//     let currentUtterance = null;

//     if (!synth) {
//         if (speakBtn) {
//             speakBtn.disabled = true;
//             speakBtn.querySelector('.btn-text').innerText = 'TTS Not Supported';
//         }
//         console.warn('⚠️ speechSynthesis not supported');
//         return;
//     }

//     const updateTtsControls = (state) => {
//         // state: 'idle' | 'speaking' | 'paused'
//         if (speakBtn) speakBtn.style.display = state === 'idle' ? '' : 'none';
//         if (pauseBtn) pauseBtn.style.display = state === 'speaking' ? '' : 'none';
//         if (resumeBtn) resumeBtn.style.display = state === 'paused' ? '' : 'none';
//         if (stopTtsBtn) stopTtsBtn.style.display = state !== 'idle' ? '' : 'none';
        
//         if (ttsStatus) {
//             if (state === 'speaking') {
//                 ttsStatus.style.display = 'flex';
//                 ttsStatus.innerHTML = '<span class="pulse-dot speaking"></span> Speaking…';
//             } else if (state === 'paused') {
//                 ttsStatus.style.display = 'flex';
//                 ttsStatus.innerHTML = '<span class="dot"></span> Paused';
//             } else {
//                 ttsStatus.style.display = 'none';
//             }
//         }
//     };

//     updateTtsControls('idle');

//     const speak = () => {
//         const text = ttsInput.value.trim();
//         if (!text) { alert('Please type something to speak.'); return; }

//         synth.cancel();

//         currentUtterance = new SpeechSynthesisUtterance(text);
//         currentUtterance.lang = ttsLang ? ttsLang.value : 'en-IN';
//         currentUtterance.volume = 1.0;
//         currentUtterance.rate = 1.0;
//         currentUtterance.pitch = 1.0;

//         currentUtterance.onstart = () => updateTtsControls('speaking');
//         currentUtterance.onpause = () => updateTtsControls('paused');
//         currentUtterance.onresume = () => updateTtsControls('speaking');
//         currentUtterance.onend = () => { updateTtsControls('idle'); currentUtterance = null; };
//         currentUtterance.onerror = (e) => {
//             console.error('TTS error:', e);
//             updateTtsControls('idle');
//             currentUtterance = null;
//         };

//         synth.speak(currentUtterance);
//         updateTtsControls('speaking'); // Trigger immediately for better UI response
//         console.log('🔊 TTS speaking');
//     };

//     if (speakBtn) speakBtn.addEventListener('click', speak);
//     if (pauseBtn) pauseBtn.addEventListener('click', () => synth.pause());
//     if (resumeBtn) resumeBtn.addEventListener('click', () => synth.resume());
//     if (stopTtsBtn) stopTtsBtn.addEventListener('click', () => {
//         synth.cancel();
//         updateTtsControls('idle');
//         currentUtterance = null;
//     });

//     console.log('✅ TTS initialized');
// });
