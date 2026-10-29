/**
 * speech.js — Speech Recognition (STT) & Real Mic Audio Stream Analyzer
 * Captures user speech via Web Speech API and analyzes live microphone
 * volume for the interactive canvas visualizer.
 */

class SpeechManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.micStream = null;
    this.micAudioContext = null;
    this.micAnalyser = null;
    this.micDataArray = null;
    this.micVolume = 0;
    this.silenceTimeout = null;
    
    // Callbacks
    this.onResult = null;
    this.onInterim = null;
    this.onStart = null;
    this.onEnd = null;
    this.onError = null;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not available in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isListening = true;
      if (this.onStart) this.onStart();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript && this.onInterim) {
        this.onInterim(interimTranscript);
      }

      if (finalTranscript && this.onResult) {
        this.onResult(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      this.isListening = false;
      this.stopMicStream();
      if (this.onError) this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.stopMicStream();
      if (this.onEnd) this.onEnd();
    };
  }

  isSupported() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  async startListening() {
    if (!this.recognition) {
      if (this.onError) this.onError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari, or type your question.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
      return;
    }

    try {
      // Connect live mic stream to analyzer for dynamic visualizer waves
      await this.initMicStream();
      this.recognition.start();
    } catch (err) {
      console.warn('Recognition start exception:', err);
      // Sometimes start() throws if already starting
      try {
        this.recognition.stop();
        setTimeout(() => this.recognition.start(), 200);
      } catch (e) {
        if (this.onError) this.onError(err.message || 'Microphone access failed');
      }
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore
      }
    }
    this.isListening = false;
    this.stopMicStream();
  }

  async initMicStream() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.micAudioContext = new AudioContextClass();
        const source = this.micAudioContext.createMediaStreamSource(this.micStream);
        this.micAnalyser = this.micAudioContext.createAnalyser();
        this.micAnalyser.fftSize = 64;
        source.connect(this.micAnalyser);

        this.micDataArray = new Uint8Array(this.micAnalyser.frequencyBinCount);
        this.trackMicVolume();
      }
    } catch (e) {
      console.log('Microphone visualizer stream optional error:', e);
    }
  }

  trackMicVolume() {
    if (!this.isListening || !this.micAnalyser) return;

    this.micAnalyser.getByteFrequencyData(this.micDataArray);
    let sum = 0;
    for (let i = 0; i < this.micDataArray.length; i++) {
      sum += this.micDataArray[i];
    }
    const avg = sum / this.micDataArray.length;
    this.micVolume = Math.min(1.0, avg / 100);

    requestAnimationFrame(() => this.trackMicVolume());
  }

  stopMicStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micAudioContext && this.micAudioContext.state !== 'closed') {
      try {
        this.micAudioContext.close();
      } catch (e) {}
      this.micAudioContext = null;
    }
    this.micAnalyser = null;
    this.micVolume = 0;
  }

  getMicVolume() {
    return this.micVolume;
  }
}

export const speechManager = new SpeechManager();
