export const playAlertSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Creates a pleasant, attention-grabbing double-chime effect
    
    // First chime
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);

    // Second chime (higher pitch)
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1108.73, audioCtx.currentTime); // C#6
      
      gain2.gain.setValueAtTime(0, audioCtx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      osc2.start(audioCtx.currentTime);
      osc2.stop(audioCtx.currentTime + 0.4);
    }, 150);

  } catch (e) {
    console.warn('Audio API not supported or blocked:', e);
  }
};

// We expose a function to initialize the audio context manually on a user click
// so that the browser allows us to play sounds later.
export const initAudioContext = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    // Ignore
  }
};
