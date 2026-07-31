export const playAlertSound = () => {
  try {
    // 1. Play the attention-grabbing chime first
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.3);

    // 2. Play the female voice announcement right after the chime
    setTimeout(() => {
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance('New order received');
        
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(v => 
          v.name.toLowerCase().includes('female') || 
          v.name.toLowerCase().includes('samantha') || 
          v.name.toLowerCase().includes('victoria') ||
          v.name.toLowerCase().includes('google uk english female')
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (femaleVoice) {
          msg.voice = femaleVoice;
        }
        
        msg.rate = 0.95; 
        msg.pitch = 1.2;
        msg.volume = 1.0;
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(msg);
      }
    }, 400); // Wait 400ms for the chime to finish before speaking

  } catch (e) {
    console.warn('Audio/Speech API not supported or blocked:', e);
  }
};

const fallbackBeep = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.2);
  } catch(e) {}
};

export const initAudioContext = () => {
  try {
    // Initialize standard audio context
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    // Also initialize speech synthesis by requesting voices (bypasses some mobile blocks)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  } catch (e) {
    // Ignore
  }
};
