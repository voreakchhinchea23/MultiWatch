// Local storage keys
const STORAGE_KEY_CHANNELS = 'multiwatch_custom_channels';
const STORAGE_KEY_WATCH_LAYOUT = 'multiwatch_layout';
const STORAGE_KEY_PINNED = 'multiwatch_pinned';

export const INITIAL_DEFAULT_CHANNELS = [
  {
    id: '@yaboiaddi',
    handle: '@yaboiaddi',
    name: 'YaBoi Addi',
    category: 'Gaming / Streamer',
    description: 'Popular Khmer gaming live streamer',
    isDefault: true
  },
  {
    id: '@MMegamind',
    handle: '@MMegamind',
    name: 'M.Megamind',
    category: 'Gaming & Entertainment',
    description: 'Popular Khmer YouTuber & live entertainer',
    isDefault: true
  },
  {
    id: '@LofiGirl',
    handle: '@LofiGirl',
    name: 'Lofi Girl',
    category: '24/7 Music Beats',
    description: 'Lofi hip hop beats to relax/study to',
    isDefault: true
  }
];

export function getSavedChannels() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CHANNELS);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure defaults are present
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
