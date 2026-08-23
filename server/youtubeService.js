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
 * Extract a balanced JSON object from a string starting at a given keyword
 */
function extractJsonObject(str, searchKeyword) {
  const kwIdx = typeof searchKeyword === 'number' ? searchKeyword : str.indexOf(searchKeyword);
  if (kwIdx === -1) return null;

  let openBraces = 0;
  let inString = false;
  let escape = false;
  let start = -1;

  for (let i = kwIdx; i < str.length; i++) {
    const char = str[i];
    if (!inString) {
      if (char === '{') {
        if (openBraces === 0) start = i;
        openBraces++;
      } else if (char === '}') {
        openBraces--;
        if (openBraces === 0 && start !== -1) {
          return str.substring(start, i + 1);
        }
      } else if (char === '"') {
        inString = true;
      }
    } else {
      if (escape) {
        escape = false;
      } else if (char === '\\') {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
    }
  }
  return null;
}

/**
 * Parse YouTube HTML response and extract live stream status & metadata
 */
function parseLiveStatusFromHtml(html, identifier) {
  let isLive = false;
  let liveVideoId = null;
  let liveTitle = '';
  let channelName = identifier.replace(/^@/, '');
  let channelAvatar = '';
  let channelId = '';
  let viewerCount = null;

  // 1. Extract Channel ID
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

  // 4. Primary Detection: ytInitialPlayerResponse
  const playerJson = extractJsonObject(html, 'ytInitialPlayerResponse');
  if (playerJson) {
    try {
      const data = JSON.parse(playerJson);
      const details = data.videoDetails;
      const micro = data.microformat?.playerMicroformatRenderer?.liveBroadcastDetails;

      const isLiveNow = micro?.isLiveNow === true;
      const isLiveDetails = details?.isLive === true;
      const isLiveContent = details?.isLiveContent === true;
      const hasEnd = !!micro?.endTimestamp;

      if ((isLiveNow || isLiveDetails || isLiveContent) && !hasEnd && details?.videoId) {
        isLive = true;
        liveVideoId = details.videoId;
        liveTitle = details.title || '';
        if (details.author) channelName = details.author;
        viewerCount = micro?.viewerCount || details.viewCount || null;
      }
    } catch (e) {}
  }

  // 5. Secondary Detection: ytInitialData (channel page / streams tab with LIVE badge)
  if (!isLive) {
    const dataJson = extractJsonObject(html, 'ytInitialData');
    if (dataJson) {
      try {
        const strData = dataJson;
        if (strData.includes('BADGE_STYLE_TYPE_LIVE_NOW') || strData.includes('"style":"BADGE_STYLE_TYPE_LIVE_NOW"')) {
          const vMatch = strData.match(/"videoId":"([a-zA-Z0-9_-]{11})"[^}]+?"style":"BADGE_STYLE_TYPE_LIVE_NOW"/) ||
                         strData.match(/"style":"BADGE_STYLE_TYPE_LIVE_NOW"[^}]+?"videoId":"([a-zA-Z0-9_-]{11})"/);
          if (vMatch) {
            isLive = true;
            liveVideoId = vMatch[1];
            const tMatch = strData.match(new RegExp(`"videoId":"${liveVideoId}"[\\s\\S]*?"title":\\{"runs":\\[\\{"text":"([^"]+)"`));
            if (tMatch) liveTitle = tMatch[1];
          }
        }
      } catch (e) {}
    }
  }

  // 6. Tertiary Fallback: Regex on raw HTML
  if (!isLive) {
    if (html.includes('"isLive":true') || html.includes('"isLiveNow":true') || html.includes('BADGE_STYLE_TYPE_LIVE_NOW')) {
      const vMatch = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      const titleMatch = html.match(/"title":{"runs":\[{"text":"([^"]+)"/) || html.match(/"title":"([^"]+)"/);
      if (vMatch && !html.includes('"endTimestamp"')) {
        isLive = true;
        liveVideoId = vMatch[1];
        if (titleMatch) liveTitle = titleMatch[1];
      }
    }
  }

  return {
    identifier,
    isLive,
    videoId: isLive ? liveVideoId : null,
    title: isLive ? liveTitle : channelName,
    channelName,
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

    // If /live did not detect live, check /streams tab as a fast fallback
    if (!parsed.isLive) {
      try {
        const streamsUrl = identifier.startsWith('UC')
          ? `https://www.youtube.com/channel/${identifier}/streams`
          : `https://www.youtube.com/${identifier}/streams`;
        const streamsRes = await fetchUrl(streamsUrl, 4000);
        const streamsParsed = parseLiveStatusFromHtml(streamsRes.body, identifier);
        if (streamsParsed.isLive) {
          parsed.isLive = true;
          parsed.videoId = streamsParsed.videoId;
          parsed.title = streamsParsed.title || parsed.title;
          parsed.viewerCount = streamsParsed.viewerCount;
          parsed.thumbnail = `https://i.ytimg.com/vi/${streamsParsed.videoId}/hqdefault.jpg`;
          parsed.liveUrl = `https://www.youtube.com/watch?v=${streamsParsed.videoId}`;
          parsed.chatUrl = `https://www.youtube.com/live_chat?v=${streamsParsed.videoId}`;
        }
      } catch (streamErr) {}
    }

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
