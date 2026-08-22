const https = require('https');
const http = require('http');

// In-memory cache with 30-second TTL
const cache = new Map();
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Fetch a URL following redirects with headers and cookies mimicking browser
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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,km;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Cookie': 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2OTQ0NTQ5ODQaAmVuIAEaBgiA_pauBg; YSC=dw-r7n_9410'
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
 * Parse YouTube HTML response with strict JSON extraction to prevent random video matching
 */
function parseLiveHtml(html, identifier) {
  let isLive = false;
  let videoId = null;
  let title = '';
  let channelName = '';
  let channelAvatar = '';
  let channelId = '';
  let viewerCount = null;

  // 1. Primary extraction: ytInitialPlayerResponse JSON
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var\s+meta|<\/script>)/s) ||
                      html.match(/var\s+ytInitialPlayerResponse\s*=\s*({.+?});/);

  if (playerMatch) {
    try {
      const playerResp = JSON.parse(playerMatch[1]);
      const details = playerResp.videoDetails;
      const microformat = playerResp.microformat?.playerMicroformatRenderer;
      
      if (details) {
        // Verify genuine live broadcast
        if (details.isLive || details.isLiveContent || microformat?.liveBroadcastDetails?.isLiveNow) {
          isLive = true;
          videoId = details.videoId;
          title = details.title;
          channelName = details.author;
          channelId = details.channelId;
          viewerCount = details.viewCount || microformat?.liveBroadcastDetails?.viewerCount;
        } else if (!videoId) {
          // Keep videoId if it's the specific channel video
          videoId = details.videoId;
          title = details.title;
          channelName = details.author;
          channelId = details.channelId;
        }
      }
    } catch (e) {
      console.warn('Error parsing ytInitialPlayerResponse:', e.message);
    }
  }

  // 2. Secondary extraction: ytInitialData JSON for live badge detection
  if (!isLive) {
    const dataMatch = html.match(/ytInitialData\s*=\s*({.+?});(?:var\s+meta|<\/script>)/s) ||
                      html.match(/var\s+ytInitialData\s*=\s*({.+?});/);
    if (dataMatch) {
      try {
        const initialDataStr = dataMatch[1];
        // Check if there is an active live badge inside the channel's actual contents
        if (initialDataStr.includes('"style":"LIVE"') || initialDataStr.includes('BADGE_STYLE_TYPE_LIVE_NOW')) {
          isLive = true;
          const liveWatchMatch = initialDataStr.match(/"style":"LIVE"[^}]+}.*?"watchEndpoint":{"videoId":"([a-zA-Z0-9_-]{11})"/s) ||
                                 initialDataStr.match(/"watchEndpoint":{"videoId":"([a-zA-Z0-9_-]{11})"[^}]+}.*?"style":"LIVE"/s) ||
                                 initialDataStr.match(/BADGE_STYLE_TYPE_LIVE_NOW.*?videoId":"([a-zA-Z0-9_-]{11})"/s);
          if (liveWatchMatch) {
            videoId = liveWatchMatch[1];
          }
        }
      } catch (e) {
        console.warn('Error parsing ytInitialData:', e.message);
      }
    }
  }

  // 3. Check canonical link on watch page (only if canonical matches a watch URL)
  if (!videoId) {
    const canonical = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
    if (canonical) {
      videoId = canonical[1];
      if (html.includes('"isLive":true') || html.includes('"isLiveContent":true') || html.includes('BADGE_STYLE_TYPE_LIVE_NOW')) {
        isLive = true;
      }
    }
  }

  // Extract avatar & channel name fallbacks
  const avatarMatch = html.match(/<link rel="image_src" href="([^"]+)">/) ||
                      html.match(/<meta property="og:image" content="([^"]+)">/) ||
                      html.match(/"thumbnails":\[\{"url":"(https:\/\/yt3\.googleusercontent\.com\/[^"]+)"/);
  if (avatarMatch) {
    channelAvatar = avatarMatch[1].replace(/\\u0026/g, '&');
  }

  const titleMatch = html.match(/<meta name="title" content="([^"]+)">/) ||
                     html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch && !title) {
    title = titleMatch[1].replace(/ - YouTube$/, '').trim();
  }

  if (!channelName) {
    if (identifier.startsWith('@')) {
      channelName = identifier.substring(1);
    } else {
      channelName = title.split('-')[0].trim() || identifier;
    }
  }

  const thumbnail = (isLive && videoId) ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '';

  return {
    identifier,
    isLive,
    videoId: isLive ? videoId : (identifier.startsWith('video:') ? videoId : null),
    title: title || (isLive ? `${channelName} Live Stream` : channelName),
    channelName,
    channelAvatar: channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(identifier)}`,
    channelId,
    viewerCount: isLive ? viewerCount : null,
    thumbnail,
    liveUrl: (isLive && videoId) ? `https://www.youtube.com/watch?v=${videoId}` : (identifier.startsWith('@') ? `https://www.youtube.com/${identifier}` : ''),
    chatUrl: (isLive && videoId) ? `https://www.youtube.com/live_chat?v=${videoId}` : '',
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
