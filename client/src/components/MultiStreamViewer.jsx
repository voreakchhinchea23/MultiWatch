import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Plus, 
  MessageSquare, 
  X, 
  LayoutGrid, 
  MonitorPlay,
  Columns,
  ArrowLeft,
  Eye,
  Radio,
  Sparkles,
  Volume2,
  Volume1,
  VolumeX,
  Headphones,
  Sliders,
  SlidersHorizontal,
  Music,
  Maximize2,
  Minimize2,
  Gauge,
  Check,
  ChevronDown,
  Tv,
  Layers
} from 'lucide-react';
import StreamPlayer from './StreamPlayer';
import LiveChatPanel from './LiveChatPanel';

const GLOBAL_QUALITY_PRESETS = [
  { id: 'auto', name: 'Auto (Adaptive)', desc: 'Optimized by YouTube' },
  { id: 'hd1080', name: '1080p Full HD', desc: 'Maximum clarity' },
  { id: 'hd720', name: '720p HD', desc: 'Smooth balanced' },
  { id: 'large', name: '480p SD', desc: 'Multi-stream friendly' },
  { id: 'medium', name: '360p Saver', desc: 'Low bandwidth' },
  { id: 'smart', name: 'Smart Focus', desc: 'Main 1080p + Subs 360p' }
];

const GLOBAL_SPEED_PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function MultiStreamViewer({
  activeHandles,
  channels,
  channelsInfo,
  onBackToChannels,
  onRemoveStream,
  onOpenAddModal
}) {
  // Mode: 'stage' (1 Big Main Top + Sub-screens Bottom) | 'theater' (1 Big Left + Sub-screens Right) | 'grid' (Equal split)
  const [viewMode, setViewMode] = useState('stage');
  const [primaryHandle, setPrimaryHandle] = useState(activeHandles[0] || null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [activeChatHandle, setActiveChatHandle] = useState(activeHandles[0] || null);
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [isQualityPresetOpen, setIsQualityPresetOpen] = useState(false);
  const [isSpeedPresetOpen, setIsSpeedPresetOpen] = useState(false);
  const [isRoomFullscreen, setIsRoomFullscreen] = useState(false);

  // Global Sync States
  const [globalQualityPreset, setGlobalQualityPreset] = useState('auto');
  const [globalSpeed, setGlobalSpeed] = useState(1);

  // Per-stream quality override map: { [handle]: 'hd1080' | 'hd720' | 'auto' ... }
  const [qualityMap, setQualityMap] = useState({});

  const roomContainerRef = useRef(null);
  const qualityPresetRef = useRef(null);
  const speedPresetRef = useRef(null);

  // Track mute status for each stream handle: { [handle]: boolean }
  const [mutedMap, setMutedMap] = useState(() => {
    const initial = {};
    activeHandles.forEach((handle) => {
      initial[handle] = false;
    });
    return initial;
  });

  // Track volume level (0 - 100) for each stream handle
  const [volumeMap, setVolumeMap] = useState(() => {
    const initial = {};
    activeHandles.forEach((handle, idx) => {
      // Primary stream starts at 100%, secondary streams start at 35%
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

  // Outside click listener for header dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (qualityPresetRef.current && !qualityPresetRef.current.contains(event.target)) {
        setIsQualityPresetOpen(false);
      }
      if (speedPresetRef.current && !speedPresetRef.current.contains(event.target)) {
        setIsSpeedPresetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for fullscreen changes on room container
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsRoomFullscreen(document.fullscreenElement === roomContainerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  // Apply Global Quality Preset
  const handleApplyGlobalQuality = (presetId) => {
    setGlobalQualityPreset(presetId);
    setIsQualityPresetOpen(false);

    if (presetId === 'smart') {
      // Smart Focus: Primary = 1080p, Secondary = 360p
      const newMap = {};
      activeHandles.forEach(h => {
        newMap[h] = h === currentPrimaryHandle ? 'hd1080' : 'medium';
      });
      setQualityMap(newMap);
    } else {
      // Apply uniform quality
      const newMap = {};
      activeHandles.forEach(h => {
        newMap[h] = presetId;
      });
      setQualityMap(newMap);
    }
  };

  // Apply Global Speed Preset
  const handleApplyGlobalSpeed = (speed) => {
    setGlobalSpeed(speed);
    setIsSpeedPresetOpen(false);
  };

  const handleMakePrimary = (handle) => {
    setPrimaryHandle(handle);
    setActiveChatHandle(handle);
    if (globalQualityPreset === 'smart') {
      const newMap = {};
      activeHandles.forEach(h => {
        newMap[h] = h === handle ? 'hd1080' : 'medium';
      });
      setQualityMap(newMap);
    }
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

  const handleToggleRoomFullscreen = () => {
    if (!roomContainerRef.current) return;
    if (!document.fullscreenElement) {
      roomContainerRef.current.requestFullscreen().catch(err => {
        console.warn('Error enabling room fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Error exiting room fullscreen:', err);
      });
    }
  };

  const allMuted = activeHandles.every(h => mutedMap[h]);
  const activeQualityPresetObj = GLOBAL_QUALITY_PRESETS.find(p => p.id === globalQualityPreset) || GLOBAL_QUALITY_PRESETS[0];

  return (
    <div 
      ref={roomContainerRef}
      className="flex flex-col h-[calc(100vh-68px)] min-h-[650px] w-full overflow-hidden bg-[#070b14]"
    >
      {/* Top Header Control Bar */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-[#090e1a] border-b border-white/[0.08] z-30 select-none flex-wrap gap-2">
        {/* Left: Stream count, Layout Selector & Global Presets */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Live stream count indicator */}
          <div className="flex items-center gap-2 pr-1 border-r border-white/[0.08]">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            </span>
            <span className="font-extrabold text-xs sm:text-sm text-white tracking-tight font-display">
              {activeStreams.length} {activeStreams.length === 1 ? 'stream' : 'streams'}
            </span>
          </div>

          {/* Layout Mode Switcher (Stage vs Theater vs Grid) */}
          {activeStreams.length > 1 && (
            <div className="flex items-center p-0.5 rounded-xl bg-black/50 border border-white/[0.08]">
              {/* Stage View: 1 Big Top + Bottom Row */}
              <button
                onClick={() => setViewMode('stage')}
                title="Stage View: 1 Main Big Screen on Top + Bottom Row"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'stage'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <MonitorPlay className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Stage</span>
              </button>

              {/* Theater View: 1 Big Left + Right Column */}
              <button
                onClick={() => setViewMode('theater')}
                title="Theater View: 1 Main Big Screen on Left + Right Column"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'theater'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <Columns className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Theater</span>
              </button>

              {/* Grid View: Equal Split */}
              <button
                onClick={() => setViewMode('grid')}
                title="Grid View: Equal split multi-stream cards"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Grid</span>
              </button>
            </div>
          )}

          {/* GLOBAL QUALITY SYNC DROPDOWN */}
          <div ref={qualityPresetRef} className="relative">
            <button
              onClick={() => {
                setIsQualityPresetOpen(!isQualityPresetOpen);
                setIsSpeedPresetOpen(false);
              }}
              title="Global Quality Preset for all streams"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                isQualityPresetOpen
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/[0.08]'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden lg:inline text-white/50 font-normal">Quality:</span>
              <span>{activeQualityPresetObj.name}</span>
              <ChevronDown className={`h-3 w-3 text-white/50 transition-transform ${isQualityPresetOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quality Preset Popover Menu */}
            {isQualityPresetOpen && (
              <div className="absolute left-0 mt-1.5 w-52 rounded-2xl bg-[#0c1424]/95 border border-blue-500/40 shadow-2xl backdrop-blur-2xl p-1.5 z-50 animate-fade-in divide-y divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Global Quality Sync
                </div>
                <div className="pt-1 space-y-0.5">
                  {GLOBAL_QUALITY_PRESETS.map(preset => {
                    const isSelected = globalQualityPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleApplyGlobalQuality(preset.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm font-bold'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div>
                          <div>{preset.name}</div>
                          <div className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-white/40'}`}>
                            {preset.desc}
                          </div>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* GLOBAL SPEED SYNC DROPDOWN */}
          <div ref={speedPresetRef} className="relative">
            <button
              onClick={() => {
                setIsSpeedPresetOpen(!isSpeedPresetOpen);
                setIsQualityPresetOpen(false);
              }}
              title="Global Playback Speed for all streams"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                isSpeedPresetOpen
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/[0.08]'
              }`}
            >
              <Gauge className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden lg:inline text-white/50 font-normal">Speed:</span>
              <span>{globalSpeed}x</span>
              <ChevronDown className={`h-3 w-3 text-white/50 transition-transform ${isSpeedPresetOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Speed Preset Popover Menu */}
            {isSpeedPresetOpen && (
              <div className="absolute left-0 mt-1.5 w-36 rounded-2xl bg-[#0c1424]/95 border border-purple-500/40 shadow-2xl backdrop-blur-2xl p-1.5 z-50 animate-fade-in divide-y divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider">
                  Sync Speed (All)
                </div>
                <div className="pt-1 space-y-0.5">
                  {GLOBAL_SPEED_PRESETS.map(spd => {
                    const isSelected = globalSpeed === spd;
                    return (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleApplyGlobalSpeed(spd)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm font-bold'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{spd}x {spd === 1 && '(Normal)'}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Audio Mixer Toggle Button */}
          {activeStreams.length > 1 && (
            <button
              onClick={() => setIsMixerOpen(!isMixerOpen)}
              title="Open Audio Mixer to adjust volume per stream"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
                isMixerOpen
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 border-white/[0.08]'
              }`}
            >
              <Sliders className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">Audio Mixer</span>
            </button>
          )}

          {/* Chill Preset Shortcut */}
          {activeStreams.length > 1 && (
            <button
              onClick={handleChillPreset}
              title="Chill Mode: Main Stream 100% volume + Music/Others 20% volume"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold transition-all active:scale-95"
            >
              <Music className="h-3.5 w-3.5 text-purple-400" />
              <span>Chill (100%/20%)</span>
            </button>
          )}
        </div>

        {/* Right: Fullscreen Room, Channels Picker, Chat Toggle, Exit */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Fullscreen Room */}
          <button
            onClick={handleToggleRoomFullscreen}
            title={isRoomFullscreen ? "Exit Room Fullscreen" : "Fullscreen Multi-Watch Room"}
            className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08] transition-colors hidden sm:flex"
          >
            {isRoomFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* + Change Channels Button */}
          <button
            onClick={onBackToChannels}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-xs font-bold text-white border border-white/[0.1] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Channels</span>
          </button>

          {/* Hide/Show Chat Button */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 shadow-sm ${
              isChatOpen
                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-white border border-white/[0.1]'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{isChatOpen ? 'Hide Chat' : 'Live Chat'}</span>
          </button>

          {/* Exit Watch Room */}
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
            <div className="flex flex-wrap items-center gap-3">
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
                    <span className="text-xs font-bold text-white truncate max-w-[80px]">
                      {name}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isStreamMuted ? 0 : vol}
                      onChange={(e) => handleSetVolume(stream.handle, parseInt(e.target.value, 10))}
                      className="w-16 sm:w-20 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="text-[11px] font-mono font-bold text-white/80 min-w-[28px] text-right">
                      {isStreamMuted ? '0%' : `${vol}%`}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quick Presets */}
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
        {/* Streams View Area */}
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
                    globalQuality={qualityMap[primaryStream.handle] || globalQualityPreset}
                    globalSpeed={globalSpeed}
                  />
                </div>

                {/* Bottom Row of Sub-Screens */}
                <div className={`flex-[1.2] min-h-[160px] sm:min-h-[190px] grid gap-2.5 ${
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
                      globalQuality={qualityMap[stream.handle] || globalQualityPreset}
                      globalSpeed={globalSpeed}
                    />
                  ))}
                </div>
              </div>
            ) : viewMode === 'theater' && secondaryStreams.length > 0 ? (
              /* THEATER MODE: 1 Big Screen Left + Sub-screens Column Right */
              <div className="flex flex-col md:flex-row h-full gap-2.5">
                {/* Big Primary Screen */}
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
                    globalQuality={qualityMap[primaryStream.handle] || globalQualityPreset}
                    globalSpeed={globalSpeed}
                  />
                </div>

                {/* Right Column of Sub-Screens */}
                <div className="flex-[1.2] flex flex-col gap-2.5 overflow-y-auto min-w-[240px] max-w-sm">
                  {secondaryStreams.map(stream => (
                    <div key={stream.handle} className="h-44 sm:h-52 w-full flex-shrink-0">
                      <StreamPlayer
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
                        globalQuality={qualityMap[stream.handle] || globalQualityPreset}
                        globalSpeed={globalSpeed}
                      />
                    </div>
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
                    globalQuality={qualityMap[stream.handle] || globalQualityPreset}
                    globalSpeed={globalSpeed}
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
