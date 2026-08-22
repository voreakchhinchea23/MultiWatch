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
    name: "TK KalongBek",
    category: "Khmer Streamer",
    description: "7 Days to Die & gaming",
    isDefault: true,
    channelId: "UC6Qvs3rKLF2IA1TVEeHn08Q"
  },
  {
    id: "@MrKmav",
    handle: "@MrKmav",
    name: "ds - ឌីអេស",
    category: "Khmer Streamer",
    description: "Gaming & automotive entertainment",
    isDefault: true,
    channelId: "UCsvVMHo3kb3zC_gYLn_IpkQ"
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
    name: "បងធីខេ Bong TK",
    category: "Khmer Streamer",
    description: "Magic Chess & live gaming",
    isDefault: true,
    channelId: "UCoM0QAYjxSNcDR-2TnnYvkA"
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
      const map = new Map();
      INITIAL_DEFAULT_CHANNELS.forEach(ch => map.set(ch.handle.toLowerCase(), ch));
      parsed.forEach(ch => map.set(ch.handle.toLowerCase(), ch));
      return Array.from(map.values());
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
  if (!count) return null;
  const num = typeof count === 'string' ? parseInt(count.replace(/,/g, ''), 10) : count;
  if (isNaN(num)) return count;
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}
