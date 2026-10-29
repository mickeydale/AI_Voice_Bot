/**
 * main.js — Application Orchestrator
 * Connects speech recognition, text-to-speech, Puter.js/serverless AI,
 * canvas visualizer orb, question cards, and modal settings.
 */

import { personaManager } from './persona.js';
import { audioManager } from './audio.js';
import { speechManager } from './speech.js';
import { aiEngine } from './ai.js';
import { OrbVisualizer } from './visualizer.js';

// Application State
let orbVisualizer = null;
let autoSpeak = true;
let isProcessing = false;

// DOM Elements
const el = {
  // Centerpiece & Orb
  centerpiece: document.querySelector('.voice-centerpiece'),
  orbCanvas: document.getElementById('orbCanvas'),
  orbStateBadge: document.getElementById('orbStateBadge'),
  stateIcon: document.getElementById('stateIcon'),
  stateText: document.getElementById('stateText'),
  liveSubtitleBox: document.getElementById('liveSubtitleBox'),
  subtitleSpeaker: document.getElementById('subtitleSpeaker'),
  subtitleContent: document.getElementById('subtitleContent'),
  
  // Controls
  btnToggleMic: document.getElementById('btnToggleMic'),
  micRipple: document.getElementById('micRipple'),
  micStatusLabel: document.getElementById('micStatusLabel'),
  btnStopVoice: document.getElementById('btnStopVoice'),
  btnReplayVoice: document.getElementById('btnReplayVoice'),
  chkAutoSpeak: document.getElementById('chkAutoSpeak'),
  textQueryForm: document.getElementById('textQueryForm'),
  inputQueryText: document.getElementById('inputQueryText'),
  btnSendText: document.getElementById('btnSendText'),
  audioBars: document.getElementById('audioBars'),

  // Header & Brand
  personaHeadline: document.getElementById('personaHeadline'),
  btnPersonaEditor: document.getElementById('btnPersonaEditor'),
  btnVoiceSettings: document.getElementById('btnVoiceSettings'),
  btnInfoModal: document.getElementById('btnInfoModal'),

  // Questions & Transcript
  questionCards: document.querySelectorAll('.question-card[data-question]'),
  btnSpontaneousQ: document.getElementById('btnSpontaneousQ'),
  transcriptMessages: document.getElementById('transcriptMessages'),
  messageCountBadge: document.getElementById('messageCountBadge'),
  btnCopyTranscript: document.getElementById('btnCopyTranscript'),
  btnClearTranscript: document.getElementById('btnClearTranscript'),

  // Persona Modal
  personaModal: document.getElementById('personaModal'),
  btnClosePersonaModal: document.getElementById('btnClosePersonaModal'),
  btnSavePersona: document.getElementById('btnSavePersona'),
  btnResetPersona: document.getElementById('btnResetPersona'),
  btnExportPersona: document.getElementById('btnExportPersona'),
  personaNameInput: document.getElementById('personaNameInput'),
  personaTitleInput: document.getElementById('personaTitleInput'),
  personaToneSelect: document.getElementById('personaToneSelect'),
  personaStoryInput: document.getElementById('personaStoryInput'),
  personaSuperpowerInput: document.getElementById('personaSuperpowerInput'),
  personaGrowthInput: document.getElementById('personaGrowthInput'),
  personaMisconceptionInput: document.getElementById('personaMisconceptionInput'),
  personaLimitsInput: document.getElementById('personaLimitsInput'),
  personaCustomPrompt: document.getElementById('personaCustomPrompt'),

  // Voice Settings Modal
  voiceModal: document.getElementById('voiceModal'),
  btnCloseVoiceModal: document.getElementById('btnCloseVoiceModal'),
  voiceSelect: document.getElementById('voiceSelect'),
  rateSlider: document.getElementById('rateSlider'),
  rateVal: document.getElementById('rateVal'),
  pitchSlider: document.getElementById('pitchSlider'),
  pitchVal: document.getElementById('pitchVal'),
  aiModelSelect: document.getElementById('aiModelSelect'),
  chkSoundFx: document.getElementById('chkSoundFx'),
  btnTestVoice: document.getElementById('btnTestVoice'),
  btnSaveVoiceSettings: document.getElementById('btnSaveVoiceSettings'),

  // Info Modal
  infoModal: document.getElementById('infoModal'),
  btnCloseInfoModal: document.getElementById('btnCloseInfoModal'),
  btnCloseInfoModalBtn: document.getElementById('btnCloseInfoModalBtn')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  initVisualizer();
  syncPersonaUI();
  initVoiceOptions();
  bindEventListeners();
  addInitialGreeting();
});

function initVisualizer() {
  orbVisualizer = new OrbVisualizer('orbCanvas');
  setAppState('idle', 'Ready to Talk', '⚡');
}

/**
 * Updates UI state across orb, state badge, mic button, and centerpiece classes
 */
function setAppState(state, labelText, icon = '⚡') {
  if (orbVisualizer) {
    orbVisualizer.setState(state);
  }

  // Remove existing state classes
  el.centerpiece.classList.remove('state-idle', 'state-listening', 'state-thinking', 'state-speaking');
  el.centerpiece.classList.add(`state-${state}`);

  el.stateText.textContent = labelText;
  el.stateIcon.textContent = icon;

  if (state === 'listening') {
    el.btnToggleMic.classList.add('active');
    el.micStatusLabel.textContent = 'Listening... (Speak now)';
    el.btnStopVoice.disabled = false;
  } else if (state === 'speaking') {
    el.btnToggleMic.classList.remove('active');
    el.micStatusLabel.textContent = 'Speaking...';
    el.btnStopVoice.disabled = false;
  } else if (state === 'thinking') {
    el.btnToggleMic.classList.remove('active');
    el.micStatusLabel.textContent = 'Thinking...';
    el.btnStopVoice.disabled = false;
  } else {
    // idle
    el.btnToggleMic.classList.remove('active');
    el.micStatusLabel.textContent = 'Click to Speak';
    el.btnStopVoice.disabled = true;
  }
}

/**
 * Synchronize Persona state with header and modal
 */
function syncPersonaUI() {
  const p = personaManager.getPersona();
  el.personaHeadline.textContent = `${p.name}’s Interactive Voice Bot (${p.title})`;

  el.personaNameInput.value = p.name;
  el.personaTitleInput.value = p.title;
  el.personaToneSelect.value = p.tone;
  el.personaStoryInput.value = p.lifeStory;
  el.personaSuperpowerInput.value = p.superpower;
  el.personaGrowthInput.value = p.growthAreas;
  el.personaMisconceptionInput.value = p.coworkerMisconceptions;
  el.personaLimitsInput.value = p.pushingLimits;
  el.personaCustomPrompt.value = p.customPrompt || '';
}

/**
 * Populate browser voices into dropdown
 */
function initVoiceOptions() {
  const populate = () => {
    const voices = audioManager.loadVoices();
    el.voiceSelect.innerHTML = '';
    
    if (voices.length === 0) {
      const opt = document.createElement('option');
      opt.textContent = 'Default System Voice';
      el.voiceSelect.appendChild(opt);
      return;
    }

    voices.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.voiceURI;
      opt.textContent = `${v.name} (${v.lang})`;
      if (audioManager.selectedVoice && audioManager.selectedVoice.voiceURI === v.voiceURI) {
        opt.selected = true;
      }
      el.voiceSelect.appendChild(opt);
    });
  };

  populate();
  setTimeout(populate, 500);
}

/**
 * Add initial welcome message in transcript
 */
function addInitialGreeting() {
  const p = personaManager.getPersona();
  const welcomeText = `Hello! I’m ${p.name}'s voice avatar. You can ask me directly about my life story, my #1 superpower, top growth areas, coworker misconceptions, and how I push my boundaries. Click the mic or tap any question on the right to start!`;
  
  appendMessage('bot', welcomeText, 'Initial Greeting');
}

/**
 * Bind All Event Listeners
 */
function bindEventListeners() {
  // Mic Toggle Button
  el.btnToggleMic.addEventListener('click', toggleMicrophone);

  // Click on Canvas Orb also toggles mic for intuitive interaction
  el.orbCanvas.addEventListener('click', toggleMicrophone);

  // Auto-speak toggle
  el.chkAutoSpeak.addEventListener('change', (e) => {
    autoSpeak = e.target.checked;
    showToast(autoSpeak ? 'Auto Voice enabled' : 'Auto Voice muted');
  });

  // Stop Voice Button
  el.btnStopVoice.addEventListener('click', () => {
    audioManager.cancel();
    speechManager.stopListening();
    setAppState('idle', 'Ready to Talk', '⚡');
    showToast('Voice stopped');
  });

  // Replay Last Spoken
  el.btnReplayVoice.addEventListener('click', () => {
    if (!audioManager.lastSpokenText) {
      showToast('No recent answer to replay.');
      return;
    }
    speakBotAnswer(audioManager.lastSpokenText);
  });

  // Text Query Form Submission
  el.textQueryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = el.inputQueryText.value.trim();
    if (!query || isProcessing) return;
    el.inputQueryText.value = '';
    processUserQuestion(query);
  });

  // Sample Question Cards
  el.questionCards.forEach(card => {
    card.addEventListener('click', () => {
      const question = card.getAttribute('data-question');
      if (question) {
        processUserQuestion(question);
      }
    });
  });

  // Spontaneous Question Generator
  el.btnSpontaneousQ.addEventListener('click', () => {
    const list = personaManager.getPersona().spontaneousPrompts || [];
    if (list.length > 0) {
      const randomQ = list[Math.floor(Math.random() * list.length)];
      processUserQuestion(randomQ);
    }
  });

  // Speech Recognition Callbacks
  speechManager.onStart = () => {
    audioManager.playChime('start');
    setAppState('listening', 'Listening...', '🎙️');
    el.subtitleSpeaker.textContent = 'You (Listening...)';
    el.subtitleContent.textContent = 'Listening to your voice...';
  };

  speechManager.onInterim = (interimText) => {
    el.subtitleSpeaker.textContent = 'You (Speaking...)';
    el.subtitleContent.textContent = `"${interimText}"`;
  };

  speechManager.onResult = (finalTranscript) => {
    audioManager.playChime('stop');
    if (finalTranscript) {
      processUserQuestion(finalTranscript);
    } else {
      setAppState('idle', 'Ready to Talk', '⚡');
    }
  };

  speechManager.onError = (err) => {
    console.warn('Speech manager reported:', err);
    setAppState('idle', 'Ready to Talk', '⚡');
    if (err !== 'no-speech') {
      showToast(`Microphone notice: ${err}`);
    }
  };

  speechManager.onEnd = () => {
    if (!isProcessing && el.stateText.textContent === 'Listening...') {
      setAppState('idle', 'Ready to Talk', '⚡');
    }
  };

  // Transcript Actions
  el.btnCopyTranscript.addEventListener('click', copyTranscript);
  el.btnClearTranscript.addEventListener('click', clearTranscript);

  // Modals Wiring
  wireModals();
}

/**
 * Toggle Microphone Listening
 */
function toggleMicrophone() {
  if (speechManager.isListening) {
    speechManager.stopListening();
  } else {
    // If speaking, stop playback first
    if (audioManager.isSpeaking) {
      audioManager.cancel();
    }
    speechManager.startListening();
  }
}

/**
 * Core Dialogue Pipeline: Receives user question, updates transcript,
 * invokes zero-key AI, and speaks back response.
 */
async function processUserQuestion(questionText) {
  if (isProcessing) return;
  isProcessing = true;

  // Stop any ongoing voice listening/playback
  speechManager.stopListening();
  audioManager.cancel();

  // 1. Render User Message
  appendMessage('user', questionText);
  el.subtitleSpeaker.textContent = 'You';
  el.subtitleContent.textContent = `"${questionText}"`;

  // 2. Set State to Thinking
  setAppState('thinking', 'Formulating response...', '🧠');

  // Insert temporary typing indicator in transcript
  const typingBubble = appendTypingIndicator();

  try {
    // 3. Call Zero-Key AI Engine
    const { text, provider } = await aiEngine.generateResponse(questionText);

    // Remove typing bubble
    if (typingBubble && typingBubble.parentNode) {
      typingBubble.parentNode.removeChild(typingBubble);
    }

    // 4. Render Bot Response
    appendMessage('bot', text, provider);
    el.subtitleSpeaker.textContent = `${personaManager.getPersona().name} (AI Twin)`;
    el.subtitleContent.textContent = `"${text}"`;

    // 5. Speak Audio if Enabled
    if (autoSpeak) {
      speakBotAnswer(text);
    } else {
      setAppState('idle', 'Ready to Talk', '⚡');
    }
  } catch (error) {
    console.error('Failed to process query:', error);
    if (typingBubble && typingBubble.parentNode) {
      typingBubble.parentNode.removeChild(typingBubble);
    }

    const fallback = personaManager.getOfflineAnswer(questionText);
    appendMessage('bot', fallback, 'Offline Resilience Engine');
    
    if (autoSpeak) {
      speakBotAnswer(fallback);
    } else {
      setAppState('idle', 'Ready to Talk', '⚡');
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Text-to-Speech Playback with dynamic visualizer integration
 */
function speakBotAnswer(text) {
  audioManager.playChime('response');

  audioManager.speak(text, {
    onStart: () => {
      setAppState('speaking', 'Speaking...', '🔊');
    },
    onEnd: () => {
      setAppState('idle', 'Ready to Talk', '⚡');
    },
    onError: (err) => {
      console.warn('TTS playback error:', err);
      setAppState('idle', 'Ready to Talk', '⚡');
    }
  });
}

/**
 * Append message bubble to transcript
 */
function appendMessage(sender, text, metaInfo = '') {
  const p = personaManager.getPersona();
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const msgDiv = document.createElement('div');
  msgDiv.className = `message-bubble msg-${sender}`;

  const avatar = sender === 'user' ? '👤' : '🎙️';
  const senderLabel = sender === 'user' ? 'Evaluator / Reviewer' : `${p.name} (AI Twin)`;

  let actionButtons = '';
  if (sender === 'bot') {
    actionButtons = `
      <div class="msg-actions-inline">
        <button class="btn-inline-voice btn-listen-again" title="Listen to this response aloud">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          <span>Listen</span>
        </button>
      </div>
    `;
  }

  msgDiv.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-meta">
        <span class="msg-sender">${senderLabel}</span>
        <span class="msg-time">${now}</span>
        ${metaInfo ? `<span class="badge badge-accent" style="font-size:10px;">${metaInfo}</span>` : ''}
      </div>
      <div class="msg-bubble-content">${escapeHTML(text)}</div>
      ${actionButtons}
    </div>
  `;

  // Attach listen again listener
  const listenBtn = msgDiv.querySelector('.btn-listen-again');
  if (listenBtn) {
    listenBtn.addEventListener('click', () => {
      speakBotAnswer(text);
    });
  }

  el.transcriptMessages.appendChild(msgDiv);
  el.transcriptMessages.scrollTop = el.transcriptMessages.scrollHeight;

  updateMessageBadge();
  return msgDiv;
}

function appendTypingIndicator() {
  const msgDiv = document.createElement('div');
  msgDiv.className = 'message-bubble msg-bot';
  msgDiv.innerHTML = `
    <div class="msg-avatar">🎙️</div>
    <div class="msg-body">
      <div class="msg-bubble-content typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `;
  el.transcriptMessages.appendChild(msgDiv);
  el.transcriptMessages.scrollTop = el.transcriptMessages.scrollHeight;
  return msgDiv;
}

function updateMessageBadge() {
  const count = el.transcriptMessages.querySelectorAll('.message-bubble').length;
  el.messageCountBadge.textContent = `${count} message${count === 1 ? '' : 's'}`;
}

function copyTranscript() {
  const bubbles = el.transcriptMessages.querySelectorAll('.message-bubble');
  if (bubbles.length === 0) {
    showToast('Transcript is empty.');
    return;
  }

  let fullText = '=== Voice Bot Interview Transcript ===\n\n';
  bubbles.forEach(b => {
    const sender = b.querySelector('.msg-sender')?.textContent || 'Message';
    const time = b.querySelector('.msg-time')?.textContent || '';
    const content = b.querySelector('.msg-bubble-content')?.textContent || '';
    fullText += `[${time}] ${sender}:\n${content}\n\n`;
  });

  navigator.clipboard.writeText(fullText)
    .then(() => showToast('Transcript copied to clipboard!'))
    .catch(() => showToast('Could not copy transcript.'));
}

function clearTranscript() {
  el.transcriptMessages.innerHTML = '';
  aiEngine.clearHistory();
  addInitialGreeting();
  showToast('Transcript cleared.');
}

/**
 * Modals & Settings Management
 */
function wireModals() {
  // Persona Modal
  el.btnPersonaEditor.addEventListener('click', () => {
    syncPersonaUI();
    openModal(el.personaModal);
  });
  el.btnClosePersonaModal.addEventListener('click', () => closeModal(el.personaModal));

  el.btnSavePersona.addEventListener('click', () => {
    const updated = {
      name: el.personaNameInput.value.trim() || 'Candidate',
      title: el.personaTitleInput.value.trim() || 'Engineer',
      tone: el.personaToneSelect.value,
      lifeStory: el.personaStoryInput.value.trim(),
      superpower: el.personaSuperpowerInput.value.trim(),
      growthAreas: el.personaGrowthInput.value.trim(),
      coworkerMisconceptions: el.personaMisconceptionInput.value.trim(),
      pushingLimits: el.personaLimitsInput.value.trim(),
      customPrompt: el.personaCustomPrompt.value.trim()
    };

    personaManager.savePersona(updated);
    syncPersonaUI();
    closeModal(el.personaModal);
    showToast('Persona updated successfully!');
  });

  el.btnResetPersona.addEventListener('click', () => {
    if (confirm('Reset persona answers back to recommended defaults?')) {
      personaManager.resetToDefault();
      syncPersonaUI();
      showToast('Persona reset to defaults.');
    }
  });

  el.btnExportPersona.addEventListener('click', () => {
    const json = personaManager.exportJSON();
    navigator.clipboard.writeText(json)
      .then(() => showToast('Persona JSON copied to clipboard!'))
      .catch(() => showToast('Could not export JSON.'));
  });

  // Voice Settings Modal
  el.btnVoiceSettings.addEventListener('click', () => {
    openModal(el.voiceModal);
  });
  el.btnCloseVoiceModal.addEventListener('click', () => closeModal(el.voiceModal));

  el.voiceSelect.addEventListener('change', (e) => {
    audioManager.setVoice(e.target.value);
  });

  el.rateSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    el.rateVal.textContent = `${val}x`;
    audioManager.setRate(val);
  });

  el.pitchSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    el.pitchVal.textContent = `${val}`;
    audioManager.setPitch(val);
  });

  el.aiModelSelect.addEventListener('change', (e) => {
    aiEngine.setModel(e.target.value);
  });

  el.chkSoundFx.addEventListener('change', (e) => {
    audioManager.setSoundFx(e.target.checked);
  });

  el.btnTestVoice.addEventListener('click', () => {
    audioManager.speak(`Hello! This is how my voice sounds at ${audioManager.rate}x speed.`);
  });

  el.btnSaveVoiceSettings.addEventListener('click', () => {
    closeModal(el.voiceModal);
    showToast('Voice settings applied!');
  });

  // Info Modal
  el.btnInfoModal.addEventListener('click', () => openModal(el.infoModal));
  el.btnCloseInfoModal.addEventListener('click', () => closeModal(el.infoModal));
  el.btnCloseInfoModalBtn.addEventListener('click', () => closeModal(el.infoModal));

  // Close modals on clicking backdrop
  [el.personaModal, el.voiceModal, el.infoModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
}

function openModal(modal) {
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(modal) {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  const existing = document.querySelector('.toast-notice');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notice';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(15px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2600);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[tag] || tag)
  );
}
