const https = require('https');
const http = require('http');

// In-memory cache with 25-second TTL
const cache = new Map();
const CACHE_TTL = 25 * 1000;

// Known default channel ID mapping
const KNOWN_CHANNEL_IDS = {
  '@yaboiaddi': 'UCGXgBHuodxLPeB_ZMFjSuNg',
  '@mmegamind': 'UC4HYzwoCrQnisp76SfKK_bQ',
  '@lyvisss': 'UCymNvh7IQDkL1TLi3FdgIUQ',
  '@pechannie': 'UC8gLykz6r56Pk-buHS48S-w',
  '@knoy95tv': 'UC-9oxn3YNVIpHABvt_eaXrA',
  '@khmergamer': 'UC6Qvs3rKLF2IA1TVEeHn08Q',
  '@mrkmav': 'UCsvVMHo3kb3zC_gYLn_IpkQ',
  '@noobiegmk': 'UCIw1B8cZ1o3PP1QMvSRG4_w',
  '@dsdsds19': 'UCoM0QAYjxSNcDR-2TnnYvkA',
  '@ravenblaze99': 'UCnFLGRAn6jXrGDksCO1jEkA',
  '@kaka42official': 'UC--FHdN6cMHEYLjrYkvY8dQ',
  '@lofigirl': 'UCSJ4gkVC6NrvII8umztf0Ow'
};

/**
 * Fetch a URL following redirects with browser headers and configurable timeout
 */
function fetchUrl(url, timeoutMs = 6000, redirectCount = 0) {
  if (redirectCount > 5) {
    return Promise.reject(new Error('Too many redirects'));
  }

  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;

    const req = client.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
        'Cookie': 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2OTQ0NTQ5ODQaAmVuIAEaBgiA_pauBg'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = (isHttps ? 'https://www.youtube.com' : 'http://www.youtube.com') + redirectUrl;
        }
        return fetchUrl(redirectUrl, timeoutMs, redirectCount + 1).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ url: res.headers.location || url, status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Request timeout (${timeoutMs}ms)`));
    });
  });
}

/**
 * Clean & normalize a YouTube identifier
 */
function normalizeIdentifier(input) {
  if (!input) return '';
  let str = input.trim();

  // If full youtube URL with @handle
  const handleMatch = str.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/i);
  if (handleMatch) return handleMatch[1];

  // If full youtube URL with channel/ID
  const channelMatch = str.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{22})/i);
  if (channelMatch) return channelMatch[1];

  // If full youtube URL with watch?v= or youtu.be/
  const videoMatch = str.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/i);
  if (videoMatch) return `video:${videoMatch[1]}`;

  // If starts with @
  if (str.startsWith('@')) return str;

  // If channel ID
  if (str.startsWith('UC') && str.length === 24) return str;

  // If plain username without @
  if (/^[a-zA-Z0-9_.-]+$/.test(str) && !str.startsWith('http')) {
    return `@${str}`;
  }

  return str;
}

/**
 * Extract the exact `ytInitialPlayerResponse` JSON object from HTML
 */
function extractPlayerResponse(html) {
  const pIdx = html.indexOf('ytInitialPlayerResponse =');
  if (pIdx === -1) return null;

  const braceIdx = html.indexOf('{', pIdx);
  if (braceIdx === -1) return null;

  let depth = 0;
  let inStr = false;
  let esc = false;
  let jsonEnd = -1;

  for (let i = braceIdx; i < html.length; i++) {
    const c = html[i];
    if (!inStr) {
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i;
          break;
        }
      } else if (c === '"') inStr = true;
    } else {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
    }
  }

  if (jsonEnd === -1) return null;
  try {
    return JSON.parse(html.substring(braceIdx, jsonEnd + 1));
  } catch (e) {
    return null;
  }
}

/**
 * Parse YouTube HTML response and extract authoritative live stream status & video ID
 */
function parseLiveStatusFromHtml(html, identifier) {
  let isLive = false;
  let liveVideoId = null;
  let liveTitle = '';
  let channelName = identifier.replace(/^@/, '');
  let channelAvatar = '';
  let channelId = KNOWN_CHANNEL_IDS[identifier.toLowerCase()] || '';
  let viewerCount = null;

  // 1. Extract Channel ID from page if present
  const chMatch = html.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/) ||
                  html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
                  html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/);
  if (chMatch) {
    channelId = chMatch[1];
    const norm = identifier.toLowerCase();
    if (norm.startsWith('@') && !KNOWN_CHANNEL_IDS[norm]) {
      KNOWN_CHANNEL_IDS[norm] = channelId;
    }
  }

  // 2. Extract Avatar
  const avatarMatch = html.match(/<link rel="image_src" href="([^"]+)">/) ||
                      html.match(/"thumbnails":\[\{"url":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/);
  if (avatarMatch) {
    channelAvatar = avatarMatch[1].replace(/\\u0026/g, '&');
  }

  // 3. Extract Channel Name from Title or Metadata
  const titleTagMatch = html.match(/<title>([^<]+)<\/title>/);
  if (titleTagMatch) {
    const cleanTitle = titleTagMatch[1].replace(/ - YouTube$/, '').trim();
    if (cleanTitle && !cleanTitle.includes('404 Not Found')) {
      channelName = cleanTitle;
    }
  }

  // 4. Primary Authoritative Detection: ytInitialPlayerResponse
  const playerObj = extractPlayerResponse(html);
  if (playerObj) {
    const details = playerObj.videoDetails;
    const micro = playerObj.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;

    const isLiveNow = micro?.isLiveNow === true;
    const isLiveDetails = details?.isLive === true || details?.isLiveContent === true;
    const hasEnd = !!micro?.endTimestamp;

    // Verify channel ownership: channelId or author matches
    const norm = identifier.toLowerCase();
    const expectedChannelId = KNOWN_CHANNEL_IDS[norm] || channelId;
    const channelMatches = expectedChannelId ? (details?.channelId === expectedChannelId) : true;

    if (channelMatches && (isLiveNow || isLiveDetails) && !hasEnd && details?.videoId) {
      isLive = true;
      liveVideoId = details.videoId;
      liveTitle = details.title || '';
      if (details.author) channelName = details.author;
      if (details.channelId) channelId = details.channelId;
      viewerCount = micro?.viewerCount || details.viewCount || null;
    }
  }

  // 5. Fallback: Check canonical / og:url if watch?v= is explicitly present
  if (!isLive) {
    const canonMatch = html.match(/href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    const ogUrlMatch = html.match(/content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/);
    const vMatch = canonMatch || ogUrlMatch;
    if (vMatch && !html.includes('"endTimestamp"')) {
      isLive = true;
      liveVideoId = vMatch[1];
    }
  }

  return {
    identifier,
    isLive,
    videoId: isLive ? liveVideoId : null,
    title: isLive ? liveTitle : (channelName || identifier),
    channelName: channelName || identifier.replace(/^@/, ''),
    channelAvatar: channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
    channelId: channelId || KNOWN_CHANNEL_IDS[identifier.toLowerCase()] || '',
    viewerCount: isLive ? viewerCount : null,
    thumbnail: (isLive && liveVideoId) ? `https://i.ytimg.com/vi/${liveVideoId}/hqdefault.jpg` : '',
    liveUrl: (isLive && liveVideoId) ? `https://www.youtube.com/watch?v=${liveVideoId}` : `https://www.youtube.com/${identifier}`,
    chatUrl: (isLive && liveVideoId) ? `https://www.youtube.com/live_chat?v=${liveVideoId}` : '',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fetch metadata and live status for a specific YouTube channel/handle
 */
async function getChannelLiveInfo(rawIdentifier) {
  const identifier = normalizeIdentifier(rawIdentifier);
  if (!identifier) {
    throw new Error('Invalid YouTube identifier provided');
  }

  // Handle direct video: identifier
  if (identifier.startsWith('video:')) {
    const videoId = identifier.replace('video:', '');
    return {
      identifier,
      isLive: true,
      videoId,
      title: `Live Stream (${videoId})`,
      channelName: 'Live Video',
      channelAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(videoId)}`,
      channelId: '',
      viewerCount: null,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      liveUrl: `https://www.youtube.com/watch?v=${videoId}`,
      chatUrl: `https://www.youtube.com/live_chat?v=${videoId}`,
      updatedAt: new Date().toISOString()
    };
  }

  // Check cache
  const cached = cache.get(identifier);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    const targetUrl = identifier.startsWith('UC')
      ? `https://www.youtube.com/channel/${identifier}/live`
      : `https://www.youtube.com/${identifier}/live`;

    const res = await fetchUrl(targetUrl, 6000);
    const parsed = parseLiveStatusFromHtml(res.body, identifier);

    cache.set(identifier, { timestamp: Date.now(), data: parsed });
    return parsed;

  } catch (error) {
    console.warn(`Error checking live info for ${identifier}:`, error.message);
    if (cached) return cached.data;

    const fallbackResult = {
      identifier,
      isLive: false,
      videoId: null,
      title: identifier,
      channelName: identifier.replace(/^@/, ''),
      channelAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
      channelId: KNOWN_CHANNEL_IDS[identifier.toLowerCase()] || '',
      viewerCount: null,
      thumbnail: '',
      liveUrl: `https://www.youtube.com/${identifier}`,
      chatUrl: '',
      error: error.message,
      updatedAt: new Date().toISOString()
    };
    cache.set(identifier, { timestamp: Date.now(), data: fallbackResult });
    return fallbackResult;
  }
}

/**
 * Batch resolve multiple channels in parallel
 */
async function getBatchChannelsLiveInfo(identifiers) {
  const promises = identifiers.map(id => getChannelLiveInfo(id));
  return Promise.all(promises);
}

module.exports = {
  getChannelLiveInfo,
  getBatchChannelsLiveInfo,
  normalizeIdentifier,
  fetchUrl
};
