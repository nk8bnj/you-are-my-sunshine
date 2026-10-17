type GameAudio = {
  unlock: () => void;
  flower: () => void;
  heart: () => void;
  success: () => void;
  startMusic: () => Promise<boolean>;
  stopMusic: () => void;
  toggleMusic: () => Promise<boolean>;
  isMusicPlaying: () => boolean;
  setQuiet: (quiet: boolean) => void;
};

export function createGameAudio(): GameAudio {
  let context: AudioContext | null = null;
  let music: HTMLAudioElement | null = null;
  let flowerSample: HTMLAudioElement | null = null;
  let targetVolume = 0.18;
  let fadeFrame = 0;
  const lastPlayedAt = new Map<string, number>();

  const getContext = () => {
    if (!context) {
      context = new AudioContext();
    }

    if (context.state === 'suspended') {
      void context.resume().catch(() => {});
    }

    return context;
  };

  const getMusic = () => {
    if (!music) {
      music = new Audio('/assets/town-theme.mp3');
      music.loop = true;
      music.volume = targetVolume;
      music.preload = 'auto';
    }

    return music;
  };

  const startMusic = async () => {
    try {
      const track = getMusic();
      await track.play();
      return true;
    } catch {
      return false;
    }
  };

  const stopMusic = () => {
    const track = getMusic();
    track.pause();
  };

  const getFlowerSample = () => {
    if (!flowerSample) {
      flowerSample = new Audio('/assets/625174__gabfitzgerald__ui-sound-approval-high-pitched-bell-synth.wav');
      flowerSample.volume = 0.18;
      flowerSample.preload = 'auto';
    }

    return flowerSample;
  };

  const playSample = (key: string, sample: HTMLAudioElement) => {
    try {
      const now = window.performance.now();
      const lastPlayed = lastPlayedAt.get(key) ?? 0;
      if (now - lastPlayed < 140) {
        return;
      }
      lastPlayedAt.set(key, now);

      const instance = sample.cloneNode(true) as HTMLAudioElement;
      instance.volume = sample.volume;
      void instance.play().catch(() => {});
    } catch {
      // Sample audio is decorative; blocked audio should never break the game.
    }
  };

  const play = (key: string, frequency: number, duration: number, type: OscillatorType = 'sine', delay = 0) => {
    try {
      const now = window.performance.now();
      const lastPlayed = lastPlayedAt.get(key) ?? 0;
      if (now - lastPlayed < 180) {
        return;
      }
      lastPlayedAt.set(key, now);

      const audio = getContext();
      const oscillator = audio.createOscillator();
      const gain = audio.createGain();

      oscillator.type = type;
      oscillator.frequency.value = frequency;
      const startAt = audio.currentTime + delay;
      gain.gain.setValueAtTime(0.001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.042, startAt + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      oscillator.connect(gain);
      gain.connect(audio.destination);
      oscillator.onended = () => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
    } catch {
      // Audio is decorative; blocked audio should never break the game.
    }
  };

  const playSoftChord = (key: string, frequencies: number[], duration: number, delay = 0) => {
    for (const [index, frequency] of frequencies.entries()) {
      play(`${key}-${index}`, frequency, duration, index === frequencies.length - 1 ? 'sine' : 'triangle', delay + index * 0.045);
    }
  };

  return {
    unlock: () => {
      try { getContext(); } catch { /* Audio is optional on unsupported devices. */ }
    },
    flower: () => playSample('flower-sample', getFlowerSample()),
    heart: () => {
      playSoftChord('heart-appear', [523, 659, 784], 0.18);
      window.setTimeout(() => play('heart-air', 1047, 0.24, 'sine'), 120);
    },
    success: () => {
      playSoftChord('heart-found', [659, 784, 988], 0.2);
      window.setTimeout(() => playSoftChord('heart-found-glow', [784, 1047], 0.24), 120);
    },
    startMusic,
    stopMusic,
    toggleMusic: async () => {
      if (getMusic().paused) {
        return startMusic();
      }

      stopMusic();
      return false;
    },
    isMusicPlaying: () => Boolean(music && !music.paused),
    setQuiet: (quiet) => {
      targetVolume = quiet ? 0.065 : 0.18;
      cancelAnimationFrame(fadeFrame);
      if (!music) return;
      const track = music;
      const initialVolume = track.volume;
      const start = performance.now();
      const fade = (now: number) => {
        const progress = Math.min(1, (now - start) / 650);
        track.volume = initialVolume + (targetVolume - initialVolume) * progress;
        if (progress < 1) fadeFrame = requestAnimationFrame(fade);
      };
      fadeFrame = requestAnimationFrame(fade);
    },
  };
}
