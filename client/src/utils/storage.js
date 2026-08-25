// Local storage keys
const STORAGE_KEY_CHANNELS = 'multiwatch_custom_channels';
const STORAGE_KEY_WATCH_LAYOUT = 'multiwatch_layout';
const STORAGE_KEY_PINNED = 'multiwatch_pinned';

export const INITIAL_DEFAULT_CHANNELS = [
  {
    id: "@yaboiaddi",
    handle: "@yaboiaddi",
    name: "Addi - អែតឌី",
    category: "Khmer Streamer",
    description: "Popular Khmer gaming live streamer",
    isDefault: true,
    channelId: "UCGXgBHuodxLPeB_ZMFjSuNg"
  },
  {
    id: "@MMegamind",
    handle: "@MMegamind",
    name: "M.Megamind",
    category: "Khmer Streamer",
    description: "Gaming, entertainment & reactions",
    isDefault: true,
    channelId: "UC4HYzwoCrQnisp76SfKK_bQ"
  },
  {
    id: "@lyvisss",
    handle: "@lyvisss",
    name: "LyVisss",
    category: "Khmer Streamer",
    description: "Gaming live stream",
    isDefault: true,
    channelId: "UCymNvh7IQDkL1TLi3FdgIUQ"
  },
  {
    id: "@Pechannie",
    handle: "@Pechannie",
    name: "Annie",
    category: "Khmer Streamer",
    description: "Live gaming & chill",
    isDefault: true,
    channelId: "UC8gLykz6r56Pk-buHS48S-w"
  },
  {
    id: "@KnoY95Tv",
    handle: "@KnoY95Tv",
    name: "KnoY95 Tv",
    category: "Khmer Streamer",
    description: "Entertainment & stream",
    isDefault: true,
    channelId: "UC-9oxn3YNVIpHABvt_eaXrA"
  },
  {
    id: "@KhmerGamer",
    handle: "@KhmerGamer",
    name: "បងធីខេ Bong TK",
    category: "Khmer Streamer",
    description: "Magic Chess & live gaming",
    isDefault: true,
    channelId: "UCoM0QAYjxSNcDR-2TnnYvkA"
  },
  {
    id: "@MrKmav",
    handle: "@MrKmav",
    name: "Mr Kmav",
    category: "Khmer Streamer",
    description: "Khmer gaming & lifestyle streamer",
    isDefault: true,
    channelId: "UCDRfljH48C4vwCPF8N8V8Hg"
  },
  {
    id: "@noobiegmk",
    handle: "@noobiegmk",
    name: "Noobie GMK",
    category: "Khmer Streamer",
    description: "Gaming streams",
    isDefault: true,
    channelId: "UCIw1B8cZ1o3PP1QMvSRG4_w"
  },
  {
    id: "@dsdsds19",
    handle: "@dsdsds19",
    name: "ds - ឌីអេស",
    category: "Khmer Streamer",
    description: "Live gaming & entertainment streams",
    isDefault: true,
    channelId: "UCsvVMHo3kb3zC_gYLn_IpkQ"
  },
  {
    id: "@ravenblaze99",
    handle: "@ravenblaze99",
    name: "RavenBlaze",
    category: "Khmer Streamer",
    description: "MMORPG & gaming events",
    isDefault: true,
    channelId: "UCnFLGRAn6jXrGDksCO1jEkA"
  },
  {
    id: "@KaKa42official",
    handle: "@KaKa42official",
    name: "HeyItzPuppies",
    category: "Khmer Streamer",
    description: "Fun gaming & lifestyle entertainment",
    isDefault: true,
    channelId: "UC--FHdN6cMHEYLjrYkvY8dQ"
  }
];

export function getSavedChannels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (saved) {
      const parsed = JSON.parse(saved);
      const seen = new Set();
      const result = [];

      // Keep default channels synced with latest default configuration
      INITIAL_DEFAULT_CHANNELS.forEach(def => {
        seen.add(def.handle.toLowerCase());
        result.push({ ...def });
      });

      // Preserve any custom user-added channels
      if (Array.isArray(parsed)) {
        parsed.forEach(ch => {
          const handleLower = (ch.handle || ch.id || '').toLowerCase();
          if (handleLower && !seen.has(handleLower)) {
            seen.add(handleLower);
            result.push(ch);
          }
        });
      }

      return result;
    }
  } catch (e) {
    console.error('Error loading channels from storage', e);
  }
  return INITIAL_DEFAULT_CHANNELS;
}

export function saveChannels(channels) {
  try {
    localStorage.setItem(STORAGE_KEY_CHANNELS, JSON.stringify(channels));
  } catch (e) {
    console.error('Error saving channels to storage', e);
  }
}

export function formatViewerCount(count) {
  if (count === null || count === undefined || count === '') return null;

  // If number
  if (typeof count === 'number') {
    if (isNaN(count) || count < 0) return null;
    if (count >= 1000000000) {
      return (count / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toLocaleString();
  }

  const str = String(count).trim();
  if (!str) return null;

  // If string already formatted with K, M, B (e.g., "1K", "1.1K", "10.5K", "1.2M", "1.5B", "1.1K watching")
  const unitMatch = str.match(/^([\d.,]+)\s*([kmbKMB])(?:\s*(?:watching|viewers|concurrent|listening))?$/i) ||
                    str.match(/([\d.,]+)\s*([kmbKMB])/i);
  if (unitMatch) {
    const rawNum = parseFloat(unitMatch[1].replace(/,/g, ''));
    const unit = unitMatch[2].toUpperCase();
    if (!isNaN(rawNum)) {
      let multiplier = 1;
      if (unit === 'K') multiplier = 1000;
      else if (unit === 'M') multiplier = 1000000;
      else if (unit === 'B') multiplier = 1000000000;

      const total = rawNum * multiplier;
      if (total >= 1000000000) {
        return (total / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
      }
      if (total >= 1000000) {
        return (total / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (total >= 1000) {
        return (total / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return Math.round(total).toLocaleString();
    }
  }

  // Pure numeric or comma-separated string, e.g. "1,200", "1000", "500", "1234 watching"
  const numericMatch = str.match(/^([\d.,]+)/);
  if (numericMatch) {
    const num = parseFloat(numericMatch[1].replace(/,/g, ''));
    if (!isNaN(num)) {
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
      }
      if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
      }
      if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
      }
      return Math.round(num).toLocaleString();
    }
  }

  return str;
}
