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
 * Fetch a URL with GET
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
        'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
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
 * Post JSON request to YouTube InnerTube API
 */
function postJson(url, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          resolve({});
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('InnerTube timeout'));
    });
    req.write(data);
    req.end();
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
 * Check if a specific video ID is actively streaming live via YouTube InnerTube API
 */
async function checkVideoLiveViaInnerTube(videoId) {
  if (!videoId) return { isLive: false };

  try {
    const data = await postJson('https://www.youtube.com/youtubei/v1/player', {
      videoId: videoId,
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20240410.01.00',
          hl: 'en',
          gl: 'US'
        }
      }
    });

    const details = data.videoDetails;
    const isLive = details?.isLive === true;

    let viewerCount = null;
    if (isLive) {
      viewerCount = details?.viewCount || null;
    }

    let thumbnail = '';
    if (details?.thumbnail?.thumbnails?.length > 0) {
      thumbnail = details.thumbnail.thumbnails[details.thumbnail.thumbnails.length - 1].url;
    }

    return {
      isLive,
      videoId: isLive ? videoId : null,
      title: details?.title || '',
      channelName: details?.author || '',
      channelId: details?.channelId || '',
      viewerCount,
      thumbnail: thumbnail || (isLive ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '')
    };
  } catch (err) {
    console.warn(`InnerTube check failed for ${videoId}:`, err.message);
    return { isLive: false };
  }
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
    // If direct video query
    if (identifier.startsWith('video:')) {
      const vid = identifier.split(':')[1];
      const videoStatus = await checkVideoLiveViaInnerTube(vid);
      const result = {
        identifier,
        isLive: videoStatus.isLive,
        videoId: videoStatus.isLive ? vid : null,
        title: videoStatus.title || identifier,
        channelName: videoStatus.channelName || identifier,
        channelAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
        channelId: videoStatus.channelId || '',
        viewerCount: videoStatus.viewerCount,
        thumbnail: videoStatus.thumbnail,
        liveUrl: videoStatus.isLive ? `https://www.youtube.com/watch?v=${vid}` : `https://www.youtube.com/watch?v=${vid}`,
        chatUrl: videoStatus.isLive ? `https://www.youtube.com/live_chat?v=${vid}` : '',
        updatedAt: new Date().toISOString()
      };
      cache.set(identifier, { timestamp: Date.now(), data: result });
      return result;
    }

    // Step 1: Resolve Channel ID
    const channelId = await resolveChannelId(identifier);

    // Step 2: Query YouTube RSS Feed to get the latest video ID
    let latestVideoId = null;
    let channelTitle = identifier.replace(/^@/, '');

    if (channelId) {
      try {
        const rssRes = await fetchUrl(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
        const xml = rssRes.body;
        const authorMatch = xml.match(/<name>([^<]+)<\/name>/);
        if (authorMatch) channelTitle = authorMatch[1].trim();

        const videoIdMatch = xml.match(/<yt:videoId>([a-zA-Z0-9_-]{11})<\/yt:videoId>/);
        if (videoIdMatch) {
          latestVideoId = videoIdMatch[1];
        }
      } catch (rssErr) {}
    }

    // Step 3: Check live status of latest video with InnerTube API
    let isLive = false;
    let liveVideoId = null;
    let liveTitle = '';
    let viewerCount = null;
    let thumbnail = '';

    if (latestVideoId) {
      const status = await checkVideoLiveViaInnerTube(latestVideoId);
      if (status.isLive) {
        isLive = true;
        liveVideoId = latestVideoId;
        liveTitle = status.title;
        if (status.channelName) channelTitle = status.channelName;
        viewerCount = status.viewerCount;
        thumbnail = status.thumbnail;
      }
    }

    const result = {
      identifier,
      isLive,
      videoId: isLive ? liveVideoId : null,
      title: isLive ? liveTitle : channelTitle,
      channelName: channelTitle,
      channelAvatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
      channelId: channelId || '',
      viewerCount: isLive ? viewerCount : null,
      thumbnail: thumbnail || (isLive ? `https://i.ytimg.com/vi/${liveVideoId}/hqdefault.jpg` : ''),
      liveUrl: isLive ? `https://www.youtube.com/watch?v=${liveVideoId}` : `https://www.youtube.com/${identifier}`,
      chatUrl: isLive ? `https://www.youtube.com/live_chat?v=${liveVideoId}` : '',
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
