# PersonaVoice — AI Voice Bot & Digital Twin 🎙️⚡

> An interactive, universally user-friendly voicebot built for the **100x Engineers** evaluation. Responds naturally in the first person ("I") to questions about life story, superpowers, growth areas, coworker misconceptions, and pushing limits—**with zero API key configuration or complex installations**.

---

## 🌟 Submission Highlights & Features

- **✅ Universal Zero-Setup for Reviewers**: Evaluators can open the deployed URL and immediately start talking or testing. **Zero manual entry of API keys, zero signups, and zero credit cards required.**
- **🎙️ Real-Time Voice Input & Output**:
  - **Speech-to-Text (STT)**: Browser-native `SpeechRecognition` / `webkitSpeechRecognition` with live audio stream level analysis.
  - **Text-to-Speech (TTS)**: High-fidelity natural voice synthesis with selectable accents, adjustable speed, and pitch.
- **🔮 Reactive Canvas Audio Orb**:
  - Central 2D Canvas visualizer with state-driven particle waves (`Idle`, `Listening`, `Thinking`, `Speaking`).
  - Interactive: Click the orb to toggle voice listening.
- **🎯 1-Click Assignment Question Cards**:
  - Pre-configured with the exact evaluation questions:
    1. *"What should we know about your life story in a few sentences?"*
    2. *"What’s your #1 superpower?"*
    3. *"What are the top 3 areas you’d like to grow in?"*
    4. *"What misconception do your coworkers have about you?"*
    5. *"How do you push your boundaries and limits?"*
  - Plus a *"Random Test"* generator for spontaneous situational reasoning.
- **👤 Live Candidate Persona Editor**:
  - Click **"Persona Settings"** in the top bar to inspect or customize answers, speaking tone, and custom instructions on the fly.
  - Automatically persists to `localStorage`, with one-click export to JSON and reset options.
- **🛡️ Multi-Tier AI Brain (Zero-Failure Guarantee)**:
  1. **Primary**: Puter.js client-side AI (`gpt-4o-mini` / `claude-3-5-sonnet`) without requiring user keys.
  2. **Secondary Fallback**: High-speed serverless AI endpoint (`Pollinations.ai`) with CORS support.
  3. **Tertiary Fallback**: Offline semantic persona knowledge engine if offline or firewall-restricted.

---

## 🚀 Live Deployment Guide (Get your URL for submission)

You can deploy this web app in under 2 minutes for free:

### Option 1: Vercel (Recommended — 60 Seconds)
1. Push this folder to a GitHub repository.
2. Visit [vercel.com/new](https://vercel.com/new) and select the repository.
3. Click **Deploy** (Vercel automatically detects `vite` via `vercel.json`).
4. **Copy your generated production URL** (e.g., `https://your-voice-bot.vercel.app`) and submit it!

Alternatively, using the Vercel CLI:
```bash
npx -y vercel
```

### Option 2: Netlify
1. Run `npm run build`.
2. Drag and drop the `dist/` folder into [Netlify Drop](https://app.netlify.com/drop).
3. Copy your live `.netlify.app` URL.

---

## 💻 Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:5173/` in Google Chrome, Microsoft Edge, or Safari.

4. To create an optimized production build:
   ```bash
   npm run build
   ```

---

## 📂 Project Structure

```
d:\100x_Assignment\
├── index.html          # Semantic HTML5 layout, visualizer canvas, modals
├── style.css           # Glassmorphic dark design system & micro-animations
├── vercel.json         # Zero-config Vercel deployment settings
├── package.json        # Project metadata and Vite scripts
├── src/
│   ├── main.js         # Core controller, event wiring, and state coordination
│   ├── ai.js           # Multi-tier zero-key AI brain (Puter.js + Pollinations)
│   ├── audio.js        # Web Audio chime synthesis & Web Speech TTS manager
│   ├── speech.js       # Web Speech STT recognition & live mic frequency analyzer
│   ├── persona.js      # Persona defaults, system prompt generator, and storage
│   └── visualizer.js   # 2D canvas particle audio orb with dynamic state rings
└── dist/               # Production-ready compiled bundle
```

---

## 🧪 Evaluator Testing Instructions

1. Open the application URL in a modern browser (Chrome, Edge, or Safari).
2. **Option A (Voice)**: Click the glowing microphone button, allow microphone permission, and ask any question aloud.
3. **Option B (1-Click Cards)**: Click on any of the 5 test question cards on the right.
4. **Option C (Type)**: Type any question into the input bar at the bottom and press Enter.
5. Review the spoken audio answer, live subtitles, and the full transcript history.
