const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { getChannelLiveInfo, getBatchChannelsLiveInfo, normalizeIdentifier } = require('./youtubeService');

const app = express();
const PORT = process.env.PORT || 5000;
const CHANNELS_FILE = path.join(__dirname, 'channels.json');

// Helper to read channels from JSON file on disk
function readChannelsFromFile() {
  try {
    if (fs.existsSync(CHANNELS_FILE)) {
      const data = fs.readFileSync(CHANNELS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading channels.json:', err);
  }
  return [];
}

// Helper to write channels to JSON file on disk
function writeChannelsToFile(channels) {
  try {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(channels, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing channels.json:', err);
  }
}

app.use(cors());
app.use(express.json());

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API: Get all saved channels (stored on disk in server/channels.json)
app.get('/api/channels', (req, res) => {
  const channels = readChannelsFromFile();
  res.json(channels);
});

// API: Add a new channel to disk
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

// API: Delete a channel from disk
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
