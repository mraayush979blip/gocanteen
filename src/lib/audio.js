export const playAlertSound = () => {
  try {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance('New order received');
      
      // Attempt to load available voices and find a female/clear voice
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
      
      // Adjust parameters for a clear, loud female-sounding voice
      msg.rate = 0.95; 
      msg.pitch = 1.2;
      msg.volume = 1.0;
      
      // Cancel any currently playing speech so this plays immediately
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(msg);
    } else {
      fallbackBeep();
    }
  } catch (e) {
    console.warn('Speech API not supported or blocked:', e);
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
