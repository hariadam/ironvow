// Sound effects: short chiptune notes made with Web Audio. No audio files.

let audio = null;

// Notes played one after another. freqs in Hz; step = seconds between notes; length = seconds each note rings.
function notes(freqs, step = 0.09, length = 0.35, wave = 'triangle', volume = 0.12) {
  if (!audio) return;
  freqs.forEach((freq, i) => {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const start = audio.currentTime + i * step;
    osc.type = wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(gain).connect(audio.destination);
    osc.start(start);
    osc.stop(start + length + 0.05);
  });
}

const SOUNDS = {
  quest: () => notes([523, 659, 784, 1047]),
  level: () => notes([392, 523, 659, 784, 1047, 1319], 0.08, 0.6, 'triangle', 0.14),
  coin: () => notes([1568, 2093], 0.06, 0.15, 'square', 0.04),
  win: () => notes([440, 554, 659], 0.1, 0.4),
  lose: () => notes([330, 262, 196], 0.14, 0.45, 'sawtooth', 0.05),
};

export const playSound = name => SOUNDS[name]();

// Browsers only allow sound after the player has touched the page, so the audio starts on the first touch.
export function initSound() {
  document.addEventListener('pointerdown', () => {
    if (!audio) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      audio = new Context();
    }
    if (audio.state === 'suspended') audio.resume();
  }, { capture: true });
}
