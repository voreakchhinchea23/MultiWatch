const https = require('https');
const http = require('http');

// In-memory cache with 30-second TTL
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Fetch a URL following redirects with headers mimicking Chrome
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"'
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

/**
 * Clean & normalize a YouTube identifier (handle, channel URL, video URL, etc.)
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
 * Parse YouTube HTML response to extract live metadata
 */
function parseLiveHtml(html, identifier) {
  let isLive = false;
  let videoId = null;
  let title = '';
  let channelName = '';
  let channelAvatar = '';
  let channelId = '';
  let viewerCount = null;
  let description = '';

  // Check live indicators
  const liveIndicators = [
    '"isLive":true',
    '"isLiveContent":true',
    '"style":"LIVE"',
    '{"status":"LIVE"}',
    'BADGE_STYLE_TYPE_LIVE_NOW',
    '"text":"LIVE"'
  ];

  for (const indicator of liveIndicators) {
    if (html.includes(indicator)) {
      isLive = true;
      break;
    }
  }

  // Canonical video ID
  const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
  if (canonicalMatch) {
    videoId = canonicalMatch[1];
  }

  if (!videoId) {
    // Search in ytInitialPlayerResponse or ytInitialData
    const vidMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
    if (vidMatch) videoId = vidMatch[1];
  }

  // Title extraction
  const titleMatch = html.match(/<meta name="title" content="([^"]+)">/) ||
                     html.match(/<title>([^<]+)<\/title>/) ||
                     html.match(/"title":"([^"]+)"/);
  if (titleMatch) {
    title = titleMatch[1].replace(/ - YouTube$/, '').trim();
  }

  // Channel Name extraction
  const authorMatch = html.match(/<link rel="author" href="[^"]*" content="([^"]+)">/) ||
                      html.match(/"author":"([^"]+)"/) ||
                      html.match(/"ownerChannelName":"([^"]+)"/) ||
                      html.match(/"channelTitle":"([^"]+)"/);
  if (authorMatch) {
    channelName = authorMatch[1];
  }

  // Channel ID extraction
  const chMatch = html.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/) ||
                  html.match(/"browseId":"(UC[a-zA-Z0-9_-]{22})"/);
  if (chMatch) {
    channelId = chMatch[1];
  }

  // Avatar extraction
  const avatarMatch = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/) ||
                      html.match(/<link rel="image_src" href="([^"]+)">/) ||
                      html.match(/"thumbnails":\[\{"url":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/);
  if (avatarMatch) {
    channelAvatar = avatarMatch[1].replace(/\\u0026/g, '&');
  }

  // Viewers count extraction
  const viewersMatch = html.match(/"viewCount":\{"runs":\[\{"text":"([0-9,]+)"\}\]/) ||
                       html.match(/"runs":\[\{"text":"([0-9,]+)"\},\{"text":" watching"/) ||
                       html.match(/"shortViewCount":\{"runs":\[\{"text":"([^"]+)"\}\]/);
  if (viewersMatch) {
    viewerCount = viewersMatch[1];
  }

  // If channel name is still blank, derive from handle or title
  if (!channelName) {
    if (identifier.startsWith('@')) {
      channelName = identifier.substring(1);
    } else {
      channelName = title.split('-')[0].trim() || identifier;
    }
  }

  // Thumbnail URL
  const thumbnail = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

  return {
    identifier,
    isLive,
    videoId,
    title: title || (isLive ? `${channelName} Live Stream` : `${channelName}`),
    channelName,
    channelAvatar: channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
    channelId,
    viewerCount,
    thumbnail,
    liveUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : (identifier.startsWith('@') ? `https://www.youtube.com/${identifier}/live` : ''),
    chatUrl: videoId ? `https://www.youtube.com/live_chat?v=${videoId}` : '',
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fetch metadata for a specific YouTube channel/handle/identifier
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
    let targetUrl = '';
    if (identifier.startsWith('video:')) {
      const vid = identifier.split(':')[1];
      targetUrl = `https://www.youtube.com/watch?v=${vid}`;
    } else if (identifier.startsWith('UC')) {
      targetUrl = `https://www.youtube.com/channel/${identifier}/live`;
    } else if (identifier.startsWith('@')) {
      targetUrl = `https://www.youtube.com/${identifier}/live`;
    } else {
      targetUrl = `https://www.youtube.com/@${identifier}/live`;
    }

    const res = await fetchUrl(targetUrl);
    const result = parseLiveHtml(res.body, identifier);

    // Save to cache
    cache.set(identifier, {
      timestamp: Date.now(),
      data: result
    });

    return result;
  } catch (error) {
    console.error(`Error fetching channel info for ${identifier}:`, error.message);
    
    // Return graceful fallback data if cached exists (even stale)
    if (cached) {
      return cached.data;
    }

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
      liveUrl: identifier.startsWith('@') ? `https://www.youtube.com/${identifier}` : '',
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
