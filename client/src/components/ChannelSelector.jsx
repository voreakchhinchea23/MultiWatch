import React, { useState } from 'react';
import { 
  Radio, 
  Tv, 
  Sparkles, 
  Plus, 
  RefreshCw, 
  CheckSquare, 
  Square, 
  Filter, 
  AlertCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import ChannelCard from './ChannelCard';

export default function ChannelSelector({
  channels,
  channelsInfo,
  selectedHandles,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onStartWatch,
  onQuickWatch,
  onDeleteChannel,
  onOpenAddModal,
  onRefresh,
  isRefreshing,
  searchQuery
}) {
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'live' | 'featured'

  // Calculate live channels count
  const liveCount = channels.filter(ch => channelsInfo[ch.handle]?.isLive).length;

  // Filter channels based on search and tab filter
  const filteredChannels = channels.filter(ch => {
    const info = channelsInfo[ch.handle];
    const matchesSearch = searchQuery === '' || 
      ch.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ch.name && ch.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (info?.title && info.title.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterMode === 'live') {
      return info?.isLive;
    }
    if (filterMode === 'featured') {
      return ch.isDefault;
    }
    return true;
  });

  // Sort channels: Live streams at the moment ALWAYS to the top, offline channels to the bottom.
  // Among live streams: sort by highest viewer count first.
  const sortedChannels = [...filteredChannels].sort((a, b) => {
    const infoA = channelsInfo[a.handle];
    const infoB = channelsInfo[b.handle];

    const isLiveA = !!infoA?.isLive;
    const isLiveB = !!infoB?.isLive;

    // 1. Live channels come first
    if (isLiveA && !isLiveB) return -1;
    if (!isLiveA && isLiveB) return 1;

    // 2. If both are live, sort by highest viewer count descending
    if (isLiveA && isLiveB) {
      const viewersA = typeof infoA?.viewerCount === 'number' ? infoA.viewerCount : 0;
      const viewersB = typeof infoB?.viewerCount === 'number' ? infoB.viewerCount : 0;
      if (viewersB !== viewersA) {
        return viewersB - viewersA;
      }
    }

    // 3. Keep featured/default preference for offline channels
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;

    return 0;
  });

  const liveChannels = filteredChannels.filter(ch => channelsInfo[ch.handle]?.isLive);
  const allLiveSelected = liveChannels.length > 0 && 
    liveChannels.every(ch => selectedHandles.includes(ch.handle));

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-extrabold tracking-wider flex items-center gap-1.5">
                <Radio className="h-3 w-3 animate-pulse" />
                MULTI-WATCH LIVE
              </span>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                {liveCount} {liveCount === 1 ? 'channel' : 'channels'} streaming now
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight font-display">
              Multi-Watch <span className="text-gradient">YouTube Live</span>
            </h1>
            <p className="text-sm sm:text-base text-white/60 mt-2 max-w-2xl leading-relaxed">
              Watch multiple live streams concurrently with real-time live chat. Select live channels below to stream together in split screens.
            </p>
          </div>

          {/* Quick Action Button on Top */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.12] text-sm font-semibold text-white transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 text-blue-400" />
              <span>Add Any Channel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Action Bar (Inspired by Loffy Store) */}
      <div className="rounded-2xl border border-white/[0.1] bg-[#0c1424]/80 p-4 sm:p-5 shadow-2xl backdrop-blur-xl mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Left: Filter Tabs & Live Status */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Pills */}
            <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/[0.08]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'all' 
                    ? 'bg-white/15 text-white shadow-sm' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                All ({channels.length})
              </button>
              <button
                onClick={() => setFilterMode('live')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'live' 
                    ? 'bg-red-600 text-white shadow-md shadow-red-600/30' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"></span>
                Live Now ({liveCount})
              </button>
              <button
                onClick={() => setFilterMode('featured')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filterMode === 'featured' 
                    ? 'bg-white/15 text-white shadow-sm' 
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Featured
              </button>
            </div>

            {/* Quick Select All Live Toggle */}
            <button
              onClick={() => {
                if (allLiveSelected) {
                  onClearSelection();
                } else {
                  onSelectAll(liveChannels.map(c => c.handle));
                }
              }}
              disabled={liveChannels.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white/70 hover:text-white border border-white/[0.08] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {allLiveSelected ? (
                <>
                  <CheckSquare className="h-3.5 w-3.5 text-blue-400" />
                  <span>Deselect Live</span>
                </>
              ) : (
                <>
                  <Square className="h-3.5 w-3.5 text-white/40" />
                  <span>Select Live ({liveChannels.length})</span>
                </>
              )}
            </button>

            {/* Refresh Status Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh live status"
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-white/70 hover:text-white border border-white/[0.08] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>

          {/* Right: Selected Counter & Start Multi-Watch Button */}
          <div className="flex items-center gap-3 self-end lg:self-auto">
            <span className="px-3.5 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-xs font-bold text-white/80 font-mono">
              {selectedHandles.length} <span className="text-white/40 font-normal">selected</span>
            </span>

            <button
              onClick={onStartWatch}
              disabled={selectedHandles.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 ${
                selectedHandles.length > 0
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-red-600/30 cursor-pointer'
                  : 'bg-white/10 text-white/30 cursor-not-allowed border border-white/[0.05]'
              }`}
            >
              <Tv className="h-4 w-4" />
              <span>Start Multi-Watch {selectedHandles.length > 0 ? `(${selectedHandles.length})` : ''}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Channel Grid */}
      {sortedChannels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {sortedChannels.map((channel) => (
            <ChannelCard
              key={channel.handle}
              channel={channel}
              info={channelsInfo[channel.handle]}
              isSelected={selectedHandles.includes(channel.handle)}
              onToggleSelect={onToggleSelect}
              onQuickWatch={onQuickWatch}
              onDelete={onDeleteChannel}
            />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 px-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <AlertCircle className="h-12 w-12 text-white/30 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No channels found</h3>
          <p className="text-sm text-white/50 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery 
              ? `No channels matching "${searchQuery}". Try a different keyword or add a new channel.` 
              : 'No channels match the active filter.'}
          </p>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Add YouTube Channel
          </button>
        </div>
      )}
    </section>
  );
}
