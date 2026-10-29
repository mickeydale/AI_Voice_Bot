/**
 * audio.js — Audio Engine & Speech Synthesis
 * Synthesizes UI audio feedback chimes and drives Text-to-Speech
 * with voice selection and waveform modulation.
 */

class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.synth = window.speechSynthesis;
    this.voices = [];
    this.selectedVoice = null;
    this.rate = 1.0;
    this.pitch = 1.0;
    this.soundFxEnabled = true;
    this.isSpeaking = false;
    this.speakingInterval = null;
    this.currentSpeakingVolume = 0; // 0.0 - 1.0 for visualizer
    this.lastSpokenText = '';

    this.initAudioContext();
    this.loadVoices();

    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }
  }

  initAudioContext() {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    } catch (e) {
      console.warn('Web Audio API not supported in this browser.', e);
    }
  }

  resumeAudioContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  loadVoices() {
    if (!this.synth) return [];
    this.voices = this.synth.getVoices().filter(v => v.lang.startsWith('en'));
    
    // Auto-select preferred high-quality voice if not already picked
    if (!this.selectedVoice && this.voices.length > 0) {
      const preferred = this.voices.find(v => 
        v.name.includes('Google') || 
        v.name.includes('Natural') || 
        v.name.includes('Samantha') || 
        v.name.includes('Daniel') ||
        v.name.includes('Jenny') ||
        v.name.includes('Zira')
      );
      this.selectedVoice = preferred || this.voices[0];
    }
    return this.voices;
  }

  setVoice(voiceURI) {
    const found = this.voices.find(v => v.voiceURI === voiceURI);
    if (found) {
      this.selectedVoice = found;
    }
  }

  setRate(val) {
    this.rate = parseFloat(val) || 1.0;
  }

  setPitch(val) {
    this.pitch = parseFloat(val) || 1.0;
  }

  setSoundFx(enabled) {
    this.soundFxEnabled = Boolean(enabled);
  }

  /**
   * Synthesize interactive sound chimes without external audio assets
   */
  playChime(type = 'start') {
    if (!this.soundFxEnabled || !this.audioCtx) return;
    this.resumeAudioContext();

    const ctx = this.audioCtx;
    const now = ctx.currentTime;

    if (type === 'start') {
      // Ascending pleasant chord for mic start
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5
      osc2.frequency.setValueAtTime(659.25, now);
      osc2.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);
    } else if (type === 'stop') {
      // Soft descending tone for mic release
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(392.00, now + 0.15); // G4

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'response') {
      // Gentle chime when AI starts responding
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now); // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.18); // A5

      gain.gain.setValueAtTime(0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  /**
   * Speak text using Web Speech Synthesis
   */
  speak(text, { onStart, onEnd, onError } = {}) {
    if (!this.synth) {
      console.warn('SpeechSynthesis is not available.');
      if (onError) onError('Speech synthesis not supported');
      return;
    }

    // Cancel any previous speech
    this.cancel();

    // Clean text of markdown asterisks or code formatting for natural speech
    const cleanText = text
      .replace(/[*_#`~[\]]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    this.lastSpokenText = cleanText;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.selectedVoice) {
      utterance.voice = this.selectedVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      this.isSpeaking = true;
      this.startSpeakingSimulation();
      if (onStart) onStart();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.stopSpeakingSimulation();
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.stopSpeakingSimulation();
      console.warn('SpeechSynthesis error:', e);
      if (onError) onError(e);
    };

    this.synth.speak(utterance);
  }

  cancel() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.stopSpeakingSimulation();
  }

  replayLast(callbacks = {}) {
    if (this.lastSpokenText) {
      this.speak(this.lastSpokenText, callbacks);
    }
  }

  /**
   * Rhythmic volume simulation to modulate the audio orb while speaking
   */
  startSpeakingSimulation() {
    this.stopSpeakingSimulation();
    this.speakingInterval = setInterval(() => {
      // Organic speech wave rhythm (mix of sine + random fluctuation)
      const base = 0.4 + Math.sin(Date.now() / 140) * 0.35;
      const noise = (Math.random() - 0.5) * 0.25;
      this.currentSpeakingVolume = Math.max(0.1, Math.min(1.0, base + noise));
    }, 50);
  }

  stopSpeakingSimulation() {
    if (this.speakingInterval) {
      clearInterval(this.speakingInterval);
      this.speakingInterval = null;
    }
    this.currentSpeakingVolume = 0;
  }

  getSpeakingVolume() {
    return this.currentSpeakingVolume;
  }
}

export const audioManager = new AudioManager();
