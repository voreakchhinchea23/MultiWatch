const https = require('https');
const http = require('http');

// In-memory cache with 30-second TTL
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

// Known default channel ID mapping for instant resolution
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
 * Fetch a URL following redirects with browser headers
 */
function fetchUrl(url, redirectCount = 0) {
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
        'Accept-Language': 'en-US,en;q=0.9',
        'Cookie': 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2OTQ0NTQ5ODQaAmVuIAEaBgiA_pauBg'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = (isHttps ? 'https://www.youtube.com' : 'http://www.youtube.com') + redirectUrl;
        }
        return fetchUrl(redirectUrl, redirectCount + 1).then(resolve).catch(reject);
      }

      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => resolve({ url, status: res.statusCode, body: data }));
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
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

  // If full youtube URL with watch?v=
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
 * Resolve channel ID from handle
 */
async function resolveChannelId(identifier) {
  if (identifier.startsWith('UC') && identifier.length === 24) {
    return identifier;
  }

  const normalized = identifier.toLowerCase();
  if (KNOWN_CHANNEL_IDS[normalized]) {
    return KNOWN_CHANNEL_IDS[normalized];
  }

  try {
    const res = await fetchUrl(`https://www.youtube.com/${identifier}`);
    const chMatch = res.body.match(/<meta itemprop="channelId" content="(UC[a-zA-Z0-9_-]{22})">/) ||
                    res.body.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
                    res.body.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/);
    if (chMatch) {
      KNOWN_CHANNEL_IDS[normalized] = chMatch[1];
      return chMatch[1];
    }
  } catch (e) {
    console.warn(`Could not resolve channelId for ${identifier}:`, e.message);
  }

  return null;
}

/**
 * Fetch metadata for a specific YouTube channel/handle
 */
async function getChannelLiveInfo(rawIdentifier) {
  const identifier = normalizeIdentifier(rawIdentifier);
  if (!identifier) {
    throw new Error('Invalid YouTube identifier provided');
  }

  // Check cache
  const cached = cache.get(identifier);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    let isLive = false;
    let liveVideoId = null;
    let liveTitle = '';
    let channelName = identifier.replace(/^@/, '');
    let channelAvatar = '';
    let viewerCount = null;
    const channelId = await resolveChannelId(identifier);

    // Fetch the /live endpoint
    const liveRes = await fetchUrl(`https://www.youtube.com/${identifier}/live`);
    const html = liveRes.body;

    const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s+meta|<\/script>)/s) ||
                        html.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);

    if (playerMatch) {
      try {
        const playerResp = JSON.parse(playerMatch[1]);
        const details = playerResp.videoDetails;
        const microformat = playerResp.microformat?.playerMicroformatRenderer;

        const isLiveNow = microformat?.liveBroadcastDetails?.isLiveNow === true;
        const isLiveDetails = details?.isLive === true;
        const hasEndTimestamp = !!microformat?.liveBroadcastDetails?.endTimestamp;

        // ACCURATE LIVE CHECK: Only true if actively broadcasting right now and not ended
        if ((isLiveNow || isLiveDetails) && !hasEndTimestamp) {
          isLive = true;
          liveVideoId = details.videoId;
          liveTitle = details.title || '';
          if (details.author) channelName = details.author;
          viewerCount = microformat?.liveBroadcastDetails?.viewerCount || details.viewCount || null;
        }
      } catch (e) {
        console.warn('Error parsing live player response:', e.message);
      }
    }

    // Extract avatar
    const avatarMatch = html.match(/<link rel="image_src" href="([^"]+)">/) ||
                        html.match(/"thumbnails":\[\{"url":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/);
    if (avatarMatch) {
      channelAvatar = avatarMatch[1].replace(/\\u0026/g, '&');
    }

    const result = {
      identifier,
      isLive,
      videoId: isLive ? liveVideoId : null,
      title: isLive ? liveTitle : channelName,
      channelName,
      channelAvatar: channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
      channelId: channelId || '',
      viewerCount: isLive ? viewerCount : null,
      thumbnail: (isLive && liveVideoId) ? `https://i.ytimg.com/vi/${liveVideoId}/hqdefault.jpg` : '',
      liveUrl: (isLive && liveVideoId) ? `https://www.youtube.com/watch?v=${liveVideoId}` : `https://www.youtube.com/${identifier}`,
      chatUrl: (isLive && liveVideoId) ? `https://www.youtube.com/live_chat?v=${liveVideoId}` : '',
      updatedAt: new Date().toISOString()
    };

    cache.set(identifier, { timestamp: Date.now(), data: result });
    return result;

  } catch (error) {
    console.error(`Error in getChannelLiveInfo for ${identifier}:`, error.message);
    if (cached) return cached.data;

    return {
      identifier,
      isLive: false,
      videoId: null,
      title: identifier,
      channelName: identifier.replace(/^@/, ''),
      channelAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
      channelId: '',
      viewerCount: null,
      thumbnail: '',
      liveUrl: `https://www.youtube.com/${identifier}`,
      chatUrl: '',
      error: error.message,
      updatedAt: new Date().toISOString()
    };
  }
}

/**
 * Batch resolve multiple channels
 */
async function getBatchChannelsLiveInfo(identifiers) {
  const promises = identifiers.map(id => getChannelLiveInfo(id));
  return Promise.all(promises);
}

module.exports = {
  getChannelLiveInfo,
  getBatchChannelsLiveInfo,
  normalizeIdentifier
};
