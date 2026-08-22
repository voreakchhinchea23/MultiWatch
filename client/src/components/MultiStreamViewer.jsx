import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  MessageSquare, 
  X, 
  LayoutGrid, 
  MonitorPlay,
  ArrowLeft,
  Eye,
  Radio,
  Sparkles,
  Volume2,
  Volume1,
  VolumeX,
  Headphones,
  Sliders,
  Music
} from 'lucide-react';
import StreamPlayer from './StreamPlayer';
import LiveChatPanel from './LiveChatPanel';

export default function MultiStreamViewer({
  activeHandles,
  channels,
  channelsInfo,
  onBackToChannels,
  onRemoveStream,
  onOpenAddModal
}) {
  // Mode: 'stage' (1 Big Main Screen on Top + Sub-screens on Bottom, like Loffy Store) or 'grid' (equal grid)
  const [viewMode, setViewMode] = useState('stage');
  const [primaryHandle, setPrimaryHandle] = useState(activeHandles[0] || null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeChatHandle, setActiveChatHandle] = useState(activeHandles[0] || null);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  
  // Track mute status for each stream handle: { [handle]: boolean (true = muted, false = unmuted) }
  const [mutedMap, setMutedMap] = useState(() => {
    const initial = {};
    activeHandles.forEach((handle, idx) => {
      initial[handle] = false;
    });
    return initial;
  });

  // Track volume level (0 - 100) for each stream handle
  const [volumeMap, setVolumeMap] = useState(() => {
    const initial = {};
    activeHandles.forEach((handle, idx) => {
      // Primary stream starts at 100%, secondary background streams start at 35%
      initial[handle] = idx === 0 ? 100 : 35;
    });
    return initial;
  });

  // Sync primary, chat, mute, and volume state when active handles change
  useEffect(() => {
    if (activeHandles.length > 0) {
      const first = activeHandles[0];
      if (!activeHandles.includes(primaryHandle)) {
        setPrimaryHandle(first);
      }
      if (!activeHandles.includes(activeChatHandle)) {
        setActiveChatHandle(first);
      }

      setMutedMap(prev => {
        const next = { ...prev };
        activeHandles.forEach(h => {
          if (next[h] === undefined) {
            next[h] = false;
          }
        });
        return next;
      });

      setVolumeMap(prev => {
        const next = { ...prev };
        activeHandles.forEach((h, idx) => {
          if (next[h] === undefined) {
            next[h] = idx === 0 ? 100 : 35;
          }
        });
        return next;
      });
    }
  }, [activeHandles, primaryHandle, activeChatHandle]);

  // Active stream objects
  const activeStreams = activeHandles.map(handle => {
    const found = channels.find(c => c.handle.toLowerCase() === handle.toLowerCase());
    return found || { handle, name: handle, isDefault: false };
  });

  const currentPrimaryHandle = primaryHandle || activeHandles[0];
  const primaryStream = activeStreams.find(s => s.handle === currentPrimaryHandle) || activeStreams[0];
  const secondaryStreams = activeStreams.filter(s => s.handle !== primaryStream?.handle);

  // Toggle mute for a specific stream
  const handleToggleMute = (handle) => {
    setMutedMap(prev => ({
      ...prev,
      [handle]: !prev[handle]
    }));
  };

  // Set volume level for a stream (0 - 100)
  const handleSetVolume = (handle, newVolume) => {
    setVolumeMap(prev => ({
      ...prev,
      [handle]: newVolume
    }));
    // If volume > 0, unmute
    if (newVolume > 0 && mutedMap[handle]) {
      setMutedMap(prev => ({ ...prev, [handle]: false }));
    }
  };

  // Audio Focus: Unmute primary at 100%, mute all other streams
  const handleAudioFocus = useCallback((targetHandle = currentPrimaryHandle) => {
    setMutedMap(() => {
      const next = {};
      activeHandles.forEach(h => {
        next[h] = h !== targetHandle;
      });
      return next;
    });
    setVolumeMap(prev => ({
      ...prev,
      [targetHandle]: 100
    }));
  }, [activeHandles, currentPrimaryHandle]);

  // Chill Mode Preset: Main Game 100%, Background Music / Others 20%
  const handleChillPreset = () => {
    setMutedMap(() => {
      const next = {};
      activeHandles.forEach(h => {
        next[h] = false;
      });
      return next;
    });
    setVolumeMap(() => {
      const next = {};
      activeHandles.forEach(h => {
        next[h] = h === currentPrimaryHandle ? 100 : 20;
      });
      return next;
    });
  };

  // Mute All Streams
  const handleMuteAll = () => {
    setMutedMap(() => {
      const next = {};
      activeHandles.forEach(h => {
        next[h] = true;
      });
      return next;
    });
  };

  // Unmute All Streams
  const handleUnmuteAll = () => {
    setMutedMap(() => {
      const next = {};
      activeHandles.forEach(h => {
        next[h] = false;
      });
      return next;
    });
  };

  const handleMakePrimary = (handle) => {
    setPrimaryHandle(handle);
    setActiveChatHandle(handle);
  };

  const handleToggleChatForStream = (handle) => {
    if (!isChatOpen) {
      setIsChatOpen(true);
      setActiveChatHandle(handle);
    } else if (activeChatHandle === handle) {
      setIsChatOpen(false);
    } else {
      setActiveChatHandle(handle);
    }
  };

  const allMuted = activeHandles.every(h => mutedMap[h]);

  return (
    <div className="flex flex-col h-[calc(100vh-68px)] min-h-[650px] w-full overflow-hidden bg-[#070b14]">
      {/* Top Header matching Loffy Store */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#090e1a] border-b border-white/[0.08] z-30 select-none">
        {/* Left: Stream count & Audio Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight font-display">
              {activeStreams.length} {activeStreams.length === 1 ? 'stream' : 'streams'} live
            </span>
          </div>

          {/* Layout Mode Pill (Stage vs Grid) */}
          {activeStreams.length > 1 && (
            <div className="hidden sm:flex items-center p-1 rounded-xl bg-black/50 border border-white/[0.08]">
              <button
                onClick={() => setViewMode('stage')}
                title="1 Big Screen + Sub-screens (Loffy style)"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'stage'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MonitorPlay className="h-3.5 w-3.5" />
                <span>Stage View</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Equal Grid Split"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid View</span>
              </button>
            </div>
          )}

          {/* Audio Mixer Toggle Button */}
          {activeStreams.length > 1 && (
            <button
              onClick={() => setIsMixerOpen(!isMixerOpen)}
              title="Open Audio Mixer to adjust volume per stream"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                isMixerOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/[0.08]'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden md:inline">Audio Mixer</span>
            </button>
          )}

          {/* Chill Preset Shortcut */}
          {activeStreams.length > 1 && (
            <button
              onClick={handleChillPreset}
              title="Chill Mode: Main Stream 100% volume + Music/Others 20% volume"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all active:scale-95"
            >
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span>Chill Mode (100% / 20%)</span>
            </button>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* + Change Channels Button */}
          <button
            onClick={onBackToChannels}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white border border-white/[0.1] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Change Channels</span>
          </button>

          {/* Hide/Show Chat Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${
              isChatOpen
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1]'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{isChatOpen ? 'Hide Chat' : 'Show Chat'}</span>
          </button>

          {/* Exit / Close Watch Room */}
          <button
            onClick={onBackToChannels}
            title="Exit Watch Room"
            className="p-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Audio Mixer Dropdown Panel */}
      {isMixerOpen && activeStreams.length > 1 && (
        <div className="bg-[#0b1222] border-b border-white/[0.1] px-4 py-3 shadow-2xl animate-fade-in z-20">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Stream Audio Mixer
              </span>
              <span className="text-[11px] text-white/40">
                (Adjust individual stream volumes)
              </span>
            </div>

            {/* Mixer Channel Sliders */}
            <div className="flex flex-wrap items-center gap-4">
              {activeStreams.map(stream => {
                const isStreamMuted = !!mutedMap[stream.handle];
                const vol = volumeMap[stream.handle] ?? 100;
                const info = channelsInfo[stream.handle];
                const name = info?.channelName || stream.name || stream.handle;
                const isMain = stream.handle === currentPrimaryHandle;

                return (
                  <div 
                    key={stream.handle} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                      isMain 
                        ? 'bg-blue-950/40 border-blue-500/50' 
                        : 'bg-white/[0.04] border-white/[0.08]'
                    }`}
                  >
                    <button
                      onClick={() => handleToggleMute(stream.handle)}
                      className="p-1 rounded-lg hover:bg-white/10 text-white/70"
                    >
                      {isStreamMuted || vol === 0 ? (
                        <VolumeX className="h-3.5 w-3.5 text-red-400" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-white truncate max-w-[90px]">
                      {name}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isStreamMuted ? 0 : vol}
                      onChange={(e) => handleSetVolume(stream.handle, parseInt(e.target.value, 10))}
                      className="w-20 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-[11px] font-mono font-bold text-white/80 min-w-[32px] text-right">
                      {isStreamMuted ? '0%' : `${vol}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={handleChillPreset}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-sm transition-all"
              >
                Chill Preset
              </button>
              <button
                onClick={allMuted ? handleUnmuteAll : handleMuteAll}
                className="px-3 py-1 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white text-xs font-bold border border-white/[0.1] transition-all"
              >
                {allMuted ? 'Unmute All' : 'Mute All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Watch Area */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Streams Container */}
        <div className="flex-1 p-2 sm:p-3 overflow-y-auto flex flex-col gap-2.5">
          {activeStreams.length > 0 ? (
            viewMode === 'stage' && secondaryStreams.length > 0 ? (
              /* STAGE MODE: 1 Big Screen on Top + Sub-screens Row on Bottom */
              <div className="flex flex-col h-full gap-2.5">
                {/* 1 Big Primary Screen */}
                <div className="flex-[3] min-h-[300px] sm:min-h-[420px] w-full">
                  <StreamPlayer
                    key={primaryStream.handle}
                    channel={primaryStream}
                    info={channelsInfo[primaryStream.handle]}
                    onRemove={onRemoveStream}
                    onToggleChat={handleToggleChatForStream}
                    isChatOpen={isChatOpen && activeChatHandle === primaryStream.handle}
                    isPrimary={true}
                    isMuted={!!mutedMap[primaryStream.handle]}
                    onToggleMute={handleToggleMute}
                    volume={volumeMap[primaryStream.handle] ?? 100}
                    onSetVolume={handleSetVolume}
                    totalStreams={activeStreams.length}
                  />
                </div>

                {/* Bottom Row of Sub-Screens */}
                <div className={`flex-[1.3] min-h-[160px] sm:min-h-[200px] grid gap-2.5 ${
                  secondaryStreams.length === 1 
                    ? 'grid-cols-1 max-w-2xl mx-auto w-full' 
                    : secondaryStreams.length === 2 
                    ? 'grid-cols-2' 
                    : 'grid-cols-2 md:grid-cols-3'
                }`}>
                  {secondaryStreams.map(stream => (
                    <StreamPlayer
                      key={stream.handle}
                      channel={stream}
                      info={channelsInfo[stream.handle]}
                      onRemove={onRemoveStream}
                      onToggleChat={handleToggleChatForStream}
                      isChatOpen={isChatOpen && activeChatHandle === stream.handle}
                      isPrimary={false}
                      onMakePrimary={handleMakePrimary}
                      isMuted={!!mutedMap[stream.handle]}
                      onToggleMute={handleToggleMute}
                      volume={volumeMap[stream.handle] ?? 35}
                      onSetVolume={handleSetVolume}
                      totalStreams={activeStreams.length}
                    />
                  ))}
                </div>
              </div>
            ) : (
              /* GRID MODE / SINGLE STREAM */
              <div className={`h-full gap-2.5 ${
                activeStreams.length === 1
                  ? 'grid grid-cols-1'
                  : activeStreams.length === 2
                  ? 'grid grid-cols-1 lg:grid-cols-2'
                  : 'grid grid-cols-1 md:grid-cols-2'
              }`}>
                {activeStreams.map(stream => (
                  <StreamPlayer
                    key={stream.handle}
                    channel={stream}
                    info={channelsInfo[stream.handle]}
                    onRemove={onRemoveStream}
                    onToggleChat={handleToggleChatForStream}
                    isChatOpen={isChatOpen && activeChatHandle === stream.handle}
                    isPrimary={stream.handle === currentPrimaryHandle}
                    onMakePrimary={handleMakePrimary}
                    isMuted={!!mutedMap[stream.handle]}
                    onToggleMute={handleToggleMute}
                    volume={volumeMap[stream.handle] ?? 100}
                    onSetVolume={handleSetVolume}
                    totalStreams={activeStreams.length}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <Radio className="h-16 w-16 text-white/20 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No active streams</h3>
              <p className="text-sm text-white/50 max-w-sm mb-6">
                Please select channels from the list to start watching.
              </p>
              <button
                onClick={onBackToChannels}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-500/20"
              >
                Go to Channels List
              </button>
            </div>
          )}
        </div>

        {/* Live Chat Side Panel */}
        {isChatOpen && activeStreams.length > 0 && (
          <LiveChatPanel
            activeStreams={activeStreams}
            channelsInfo={channelsInfo}
            activeChatHandle={activeChatHandle || activeStreams[0]?.handle}
            onSelectChatHandle={setActiveChatHandle}
            onClose={() => setIsChatOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
