/**
 * ai.js — Zero-Key AI Engine
 * Orchestrates responses using Puter.js (free in-browser GPT-4o/Claude),
 * high-speed serverless fallback (Pollinations AI), and offline persona semantic matcher.
 */

import { personaManager } from './persona.js';

class AIEngine {
  constructor() {
    this.conversationHistory = [];
    this.selectedModel = 'auto'; // 'auto' | 'puter-gpt' | 'puter-claude' | 'pollinations' | 'offline'
  }

  setModel(model) {
    this.selectedModel = model;
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Generates a spoken/textual response to user prompt
   */
  async generateResponse(userPrompt) {
    const systemPrompt = personaManager.generateSystemPrompt();
    
    // Add user query to conversation history
    this.conversationHistory.push({ role: 'user', content: userPrompt });

    // Prepare full messages array
    const messages = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory.slice(-6) // Keep last 6 turns for context
    ];

    let answer = null;
    let providerUsed = '';

    // If user explicitly chose offline mode:
    if (this.selectedModel === 'offline') {
      answer = personaManager.getOfflineAnswer(userPrompt);
      providerUsed = 'Offline Persona Engine';
    } 
    // If user explicitly chose Pollinations:
    else if (this.selectedModel === 'pollinations') {
      try {
        answer = await this.callPollinations(messages);
        providerUsed = 'Pollinations Serverless AI';
      } catch (err) {
        console.warn('Pollinations failed, falling back:', err);
        answer = personaManager.getOfflineAnswer(userPrompt);
        providerUsed = 'Offline Persona Fallback';
      }
    } 
    // Auto or Puter modes:
    else {
      // 1. Try Puter.js first if available
      if (window.puter && window.puter.ai && this.selectedModel !== 'pollinations') {
        try {
          const puterModel = this.selectedModel === 'puter-claude' ? 'claude-3-5-sonnet' : 'gpt-4o-mini';
          answer = await this.callPuter(messages, puterModel);
          providerUsed = `Puter.js (${puterModel})`;
        } catch (puterError) {
          console.warn('Puter.js request failed or blocked, attempting serverless fallback:', puterError);
        }
      }

      // 2. If Puter didn't produce an answer, try Pollinations serverless endpoint
      if (!answer) {
        try {
          answer = await this.callPollinations(messages);
          providerUsed = 'Pollinations AI (Zero-Key Backup)';
        } catch (pollinationsError) {
          console.warn('Pollinations endpoint failed, using offline persona fallback:', pollinationsError);
        }
      }

      // 3. Fallback to offline persona engine if all network requests fail
      if (!answer) {
        answer = personaManager.getOfflineAnswer(userPrompt);
        providerUsed = 'Offline Persona Knowledge Engine';
      }
    }

    // Clean up answer if enclosed in quotes or leading prefixes
    answer = this.cleanResponse(answer);

    // Save assistant reply into history
    this.conversationHistory.push({ role: 'assistant', content: answer });

    return {
      text: answer,
      provider: providerUsed
    };
  }

  /**
   * Puter.js browser-native AI caller (zero API key)
   */
  async callPuter(messages, modelName = 'gpt-4o-mini') {
    // Puter expects messages array or prompt string
    const response = await window.puter.ai.chat(messages, {
      model: modelName
    });

    if (typeof response === 'string') return response;
    if (response?.message?.content) return response.message.content;
    if (response?.text) return response.text;
    if (Array.isArray(response) && response[0]?.text) return response[0].text;
    return JSON.stringify(response);
  }

  /**
   * Free Serverless fallback caller (zero API key, CORS supported)
   */
  async callPollinations(messages) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    try {
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages,
          model: 'openai',
          seed: Math.floor(Math.random() * 100000)
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const text = await res.text();
      return text;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  cleanResponse(text) {
    if (!text) return '';
    let cleaned = text.trim();
    // Remove wrapping quotes if model returned "..."
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith('“') && cleaned.endsWith('”'))) {
      cleaned = cleaned.slice(1, -1).trim();
    }
    // Remove "Candidate:" or "Anurag:" prefix if LLM hallucinated a label
    cleaned = cleaned.replace(/^(Candidate|Anurag|AI Twin|Response):\s*/i, '');
    return cleaned;
  }
}

export const aiEngine = new AIEngine();
