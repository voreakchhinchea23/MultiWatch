const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getChannelLiveInfo, getBatchChannelsLiveInfo, normalizeIdentifier } = require('./youtubeService');

const app = express();
const PORT = process.env.PORT || 5000;
const CHANNELS_FILE = path.join(__dirname, 'channels.json');

const DEFAULT_INITIAL_CHANNELS = [
  {
    id: "@yaboiaddi",
    handle: "@yaboiaddi",
    name: "YaBoi Addi",
    category: "Gaming / Streamer",
    description: "Popular Khmer gaming live streamer",
    isDefault: true,
    channelId: "UCGXgBHuodxLPeB_ZMFjSuNg"
  },
  {
    id: "@MMegamind",
    handle: "@MMegamind",
    name: "M.Megamind",
    category: "Gaming & Entertainment",
    description: "Gaming, entertainment & reactions",
    isDefault: true,
    channelId: "UC4HYzwoCrQnisp76SfKK_bQ"
  },
  {
    id: "@lyvisss",
    handle: "@lyvisss",
    name: "Lyviss",
    category: "Gaming",
    description: "Khmer gaming & entertainment live stream",
    isDefault: true,
    channelId: "UCymNvh7IQDkL1TLi3FdgIUQ"
  },
  {
    id: "@Pechannie",
    handle: "@Pechannie",
    name: "Pechannie",
    category: "Streamer",
    description: "Gaming & lifestyle streams",
    isDefault: true,
    channelId: "UC8gLykz6r56Pk-buHS48S-w"
  },
  {
    id: "@KnoY95Tv",
    handle: "@KnoY95Tv",
    name: "KnoY 95 Tv",
    category: "Entertainment",
    description: "Entertainment & gaming live streamer",
    isDefault: true,
    channelId: "UC-9oxn3YNVIpHABvt_eaXrA"
  },
  {
    id: "@KhmerGamer",
    handle: "@KhmerGamer",
    name: "Khmer Gamer",
    category: "Gaming",
    description: "Survival gaming, 7 Days to Die & adventures",
    isDefault: true,
    channelId: "UC6Qvs3rKLF2IA1TVEeHn08Q"
  },
  {
    id: "@MrKmav",
    handle: "@MrKmav",
    name: "Mr Kmav",
    category: "Entertainment",
    description: "Khmer gaming & lifestyle streamer",
    isDefault: true,
    channelId: "UCsvVMHo3kb3zC_gYLn_IpkQ"
  },
  {
    id: "@noobiegmk",
    handle: "@noobiegmk",
    name: "Noobie GMK",
    category: "Gaming",
    description: "Gaming streamer & entertainment",
    isDefault: true,
    channelId: "UCIw1B8cZ1o3PP1QMvSRG4_w"
  },
  {
    id: "@dsdsds19",
    handle: "@dsdsds19",
    name: "Bong TK (dsdsds19)",
    category: "Gaming",
    description: "Magic Chess, Mobile Legends & live gaming",
    isDefault: true,
    channelId: "UCoM0QAYjxSNcDR-2TnnYvkA"
  },
  {
    id: "@ravenblaze99",
    handle: "@ravenblaze99",
    name: "RavenBlaze",
    category: "MMORPG",
    description: "MMORPG, JX2 & competitive gaming",
    isDefault: true,
    channelId: "UCnFLGRAn6jXrGDksCO1jEkA"
  },
  {
    id: "@KaKa42official",
    handle: "@KaKa42official",
    name: "KaKa 42",
    category: "Entertainment",
    description: "Gaming & fun community streams",
    isDefault: true,
    channelId: "UC--FHdN6cMHEYLjrYkvY8dQ"
  }
];

let inMemoryChannels = [...DEFAULT_INITIAL_CHANNELS];

// Helper to read channels from JSON file on disk (with fallback)
function readChannelsFromFile() {
  try {
    if (fs.existsSync(CHANNELS_FILE)) {
      const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryChannels = parsed;
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Reading channels.json (using in-memory fallback):', err.message);
  }
  return inMemoryChannels;
}

// Helper to write channels to JSON file on disk
function writeChannelsToFile(channels) {
  inMemoryChannels = channels;
  try {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2), 'utf8');
  } catch (err) {
    console.warn('Writing channels.json (serverless read-only filesystem):', err.message);
  }
}

app.use(cors());
app.use(express.json());

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: process.env.VERCEL ? 'vercel' : 'local' });
});

// API: Get all saved channels
app.get('/api/channels', (req, res) => {
  const channels = readChannelsFromFile();
  res.json(channels);
});

// API: Add a new channel
app.post('/api/channels', (req, res) => {
  const newChannel = req.body;
  if (!newChannel || !newChannel.handle) {
    return res.status(400).json({ error: 'Channel object with handle is required' });
  }

  const channels = readChannelsFromFile();
  const exists = channels.some(c => c.handle.toLowerCase() === newChannel.handle.toLowerCase());
  
  if (!exists) {
    channels.push(newChannel);
    writeChannelsToFile(channels);
  }

  res.json({ success: true, channels });
});

// API: Delete a channel
app.delete('/api/channels/:handle', (req, res) => {
  const handle = decodeURIComponent(req.params.handle);
  let channels = readChannelsFromFile();
  channels = channels.filter(c => c.handle.toLowerCase() !== handle.toLowerCase());
  writeChannelsToFile(channels);
  res.json({ success: true, channels });
});

// API: Get default featured channel list
app.get('/api/featured', (req, res) => {
  const channels = readChannelsFromFile();
  res.json(channels);
});

// API: Check single channel live status
app.get('/api/live/check', async (req, res) => {
  try {
    const target = req.query.handle || req.query.channelId || req.query.url || req.query.id;
    if (!target) {
      return res.status(400).json({ error: 'Missing handle or channel parameter' });
    }

    const info = await getChannelLiveInfo(target);
    res.json(info);
  } catch (error) {
    console.error('Error in /api/live/check:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// API: Diagnostic endpoint for live response
app.get('/api/debug/live', async (req, res) => {
  const { fetchUrl } = require('./youtubeService');
  const target = req.query.handle || '@MMegamind';
  try {
    const response = await fetchUrl(`https://www.youtube.com/${target}/live`, 8000);
    const html = response.body;
    res.json({
      url: response.url,
      status: response.status,
      bodyLength: html.length,
      canonical: (html.match(/<link rel="canonical" href="([^"]+)">/) || [])[1] || null,
      ogUrl: (html.match(/<meta property="og:url" content="([^"]+)">/) || [])[1] || null,
      ogVideo: (html.match(/<meta property="og:video:url" content="([^"]+)">/) || [])[1] || null,
      pIdx: html.indexOf('ytInitialPlayerResponse ='),
      hasConsent: html.includes('consent.youtube.com') || html.includes('before you continue'),
      titleMatch: (html.match(/<title>([^<]+)<\/title>/) || [])[1] || null
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// API: Batch check channels
app.post('/api/live/batch', async (req, res) => {
  try {
    const { handles } = req.body;
    if (!Array.isArray(handles) || handles.length === 0) {
      return res.status(400).json({ error: 'handles array is required' });
    }

    const safeHandles = handles.slice(0, 20);
    const results = await getBatchChannelsLiveInfo(safeHandles);
    res.json(results);
  } catch (error) {
    console.error('Error in /api/live/batch:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production if built
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.send(`<h2>MultiWatch API Server is running on port ${PORT}. Run client dev server with <code>npm run dev:client</code></h2>`);
    }
  });
});

// Export app for Vercel serverless functions
module.exports = app;

// Start standalone HTTP server when run directly (local / Node)
if (require.main === module && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`🚀 MultiWatch Server listening on port ${PORT}`);
    console.log(`💾 Storing channels in: ${CHANNELS_FILE}`);
    console.log(`📡 API endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/channels`);
    console.log(`   POST http://localhost:${PORT}/api/channels`);
    console.log(`   GET  http://localhost:${PORT}/api/live/check?handle=@MMegamind`);
    console.log(`   POST http://localhost:${PORT}/api/live/batch`);
    console.log(`===========================================`);
  });
}
