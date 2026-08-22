# 🎮 MultiWatch - Real-Time YouTube Multi-Stream Viewer

<div align="center">

![MultiWatch Banner](https://img.shields.io/badge/MultiWatch-Live%20Streaming-red?style=for-the-badge&logo=youtube)
![React](https://img.shields.io/badge/React%2018-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

**Watch multiple YouTube live streams concurrently in customizable split-screen layouts with synchronized dark live chat, real-time live detection, and an integrated multi-stream audio mixer.**

🌐 **Live Demo:** [https://multi-watches.vercel.app](https://multi-watches.vercel.app)

</div>

---

## ✨ Features

- 🔴 **Real-Time Live Stream Auto-Detection**: Instant live broadcast status resolution without requiring YouTube API keys or quota limits.
- 🎚️ **Individual Stream Volume Sliders & Audio Mixer**:
  - Fine-tune volume levels (0% – 100%) for each stream independently.
  - **"Chill Mode" Preset**: Automatically sets your primary gaming stream to 100% and softens background music/lofi streams to 20%.
  - Global Mute / Unmute and Audio Focus.
- 🖥️ **Loffy Store-style Stage Layout**:
  - **Stage View**: 1 Big primary main screen on top with sub-screens in a bottom row.
  - **Grid View**: Equal split responsive multi-stream layout.
  - **1-Click "Make Main"**: Swap any background stream into the primary stage instantly.
- 💬 **Dark Mode Embedded Live Chat**:
  - Native YouTube dark live chat side-panel with channel switcher pills.
  - 1-click popout window mode.
- ➕ **Dynamic Channel Manager**:
  - Add any YouTube channel by URL, `@handle`, or Channel ID.
  - Persistent storage in both browser `localStorage` and `channels.json`.
- 🎨 **Modern Dark Cyberpunk Aesthetic**: Glassmorphism cards, glowing pulse indicators, smooth hover animations, and responsive mobile-to-desktop design.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or later
- **NPM**: v9.0.0 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/voreakchhinchea23/MultiWatch.git

# Navigate into project directory
cd MultiWatch

# Install all dependencies (root and client workspaces)
npm install
```

### Running Locally

```bash
# Start both backend server (Port 5000) and frontend client (Port 3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 📁 Project Architecture

```
MultiWatch/
├── api/                     # Vercel Serverless Function entry point
│   └── index.js
├── client/                  # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx            # Top branding & global search
│   │   │   ├── ChannelSelector.jsx   # Channel grid & live filters
│   │   │   ├── ChannelCard.jsx       # Stream card with status badge
│   │   │   ├── MultiStreamViewer.jsx # Multi-stream stage & mixer
│   │   │   ├── StreamPlayer.jsx      # Video player with volume controls
│   │   │   ├── LiveChatPanel.jsx     # Dark mode YouTube live chat
│   │   │   ├── AddChannelModal.jsx   # Add custom channels modal
│   │   │   └── Footer.jsx            # Footer
│   │   ├── utils/
│   │   │   └── storage.js            # Storage & channel defaults
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                  # Express Backend & YouTube Scraper
│   ├── index.js             # Express API Server
│   ├── youtubeService.js    # Strict YouTube Live Scraper Engine
│   └── channels.json        # Saved channels database
├── package.json             # Root NPM workspaces config
├── vercel.json              # Vercel deployment routing config
└── README.md
```

---

## 📡 API Reference

### 1. Check Channel Live Status
```http
GET /api/live/check?handle=@yaboiaddi
```
**Response:**
```json
{
  "identifier": "@yaboiaddi",
  "isLive": true,
  "videoId": "UrXjI1k9UFk",
  "title": "គ្នាលេងៗ",
  "channelName": "YaBoi Addi",
  "viewerCount": "2042",
  "thumbnail": "https://i.ytimg.com/vi/UrXjI1k9UFk/hqdefault.jpg",
  "liveUrl": "https://www.youtube.com/watch?v=UrXjI1k9UFk",
  "chatUrl": "https://www.youtube.com/live_chat?v=UrXjI1k9UFk"
}
```

### 2. Batch Check Multiple Channels
```http
POST /api/live/batch
Content-Type: application/json

{
  "handles": ["@yaboiaddi", "@MMegamind", "@ravenblaze99"]
}
```

### 3. Manage Saved Channels
- `GET /api/channels` - List all saved channels
- `POST /api/channels` - Add a new channel
- `DELETE /api/channels/:handle` - Remove a channel

---

## 🚢 Deploy to Vercel

MultiWatch is pre-configured with `vercel.json` and NPM Workspaces for seamless 1-click deployment:

1. Push code to your GitHub repository.
2. Import the repository on [Vercel](https://vercel.com).
3. Click **Deploy**. Vercel will automatically build and deploy the React frontend and serverless live detection API!

---

## 📜 License

MIT License © 2026 MultiWatch Team
