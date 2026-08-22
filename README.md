<<<<<<< HEAD
# MultiWatch 🔴 Live - YouTube Stream & Multi-Viewer

A modern, high-performance web application built with **ReactJS**, **Tailwind CSS**, and **Express** to watch real-time YouTube live streams with synchronized live chat across multiple channels simultaneously.

Inspired by [loffystore.com/live](https://loffystore.com/live).

---

## ✨ Features

- **Live Stream Auto-Detection**: Real-time status detection for YouTube handles (`@username`), channel URLs, or live broadcast links.
- **Pre-configured Channels**:
  - **@yaboiaddi** (YaBoi Addi) - Live gaming & entertainment
  - **@MMegamind** (M.Megamind) - Community gaming & entertainment
  - **@LofiGirl** - 24/7 Lofi hip hop radio
- **Multi-Stream Watch Room**:
  - Flexible layout modes: **1x1 Single Focus**, **Split Screen (2x1)**, **Quad Grid (2x2)**, and **Dynamic Multi-Grid**
  - Audio focus controller (Focus/Unfocus single stream, swap streams)
  - Quick reload & full screen
- **Real-Time Live Chat Embed**:
  - Synchronized YouTube Live Chat iframe for any active livestream
  - Multi-chat tabs to switch between channel discussions
  - One-click pop-out chat window
- **Dynamic Channel Management**:
  - Add any YouTube channel by `@handle`, channel link, or video URL
  - Instant live validation preview with channel avatar and stream title
  - Persistent custom channels saved in `localStorage`
- **Modern Cyberpunk/Gaming UI**:
  - Dark glassmorphism panels, glowing neon accents, pulsating live indicators
  - Fully responsive across desktop, tablet, and mobile devices

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# In project root:
npm install
npm --prefix client install
```

### 2. Run in Development Mode
Starts both backend API (`port 5000`) and Vite dev server (`port 3000`) concurrently:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Run in Production Mode
```bash
npm run build
npm start
```
Open **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## 📡 API Endpoints

- `GET /api/featured` - Get preconfigured featured channels
- `GET /api/live/check?handle=@yaboiaddi` - Check live status & get metadata for a channel
- `POST /api/live/batch` - Batch check live status for multiple handles with 30s cache

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, HTTPS metadata scraper & in-memory cache
- **Embedding**: Official YouTube Iframe Player & Live Chat API
=======
# MultiWatch
A project create in order to watch multiple streams from YouTube at the same time.
>>>>>>> 1d7c4d37ea969bb419dbefe97d72970b0d24124a
