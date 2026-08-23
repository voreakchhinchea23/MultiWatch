import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
  Minimize2,
  ExternalLink, 
  X, 
  MessageSquare, 
  Radio, 
  RefreshCw,
  ArrowUpRight,
  Eye,
  Volume2,
  Volume1,
  VolumeX,
  Volume,
  Gauge,
  SlidersHorizontal,
  Check,
  ChevronDown,
  Sparkles,
  Tv
} from 'lucide-react';
import { formatViewerCount } from '../utils/storage';

const QUALITY_OPTIONS = [
  { value: 'auto', label: 'Auto', badge: 'Auto', desc: 'Adaptive' },
  { value: 'hd1080', label: '1080p HD', badge: '1080p', desc: 'Full HD' },
  { value: 'hd720', label: '720p HD', badge: '720p', desc: 'HD' },
  { value: 'large', label: '480p', badge: '480p', desc: 'SD' },
  { value: 'medium', label: '360p', badge: '360p', desc: 'Data Saver' },
  { value: 'small', label: '240p', badge: '240p', desc: 'Low' },
  { value: 'tiny', label: '144p', badge: '144p', desc: 'Minimal' },
];

const SPEED_OPTIONS = [
  { value: 0.25, label: '0.25x' },
  { value: 0.5, label: '0.5x' },
  { value: 0.75, label: '0.75x' },
  { value: 1, label: '1.0x', badge: 'Normal' },
  { value: 1.25, label: '1.25x' },
  { value: 1.5, label: '1.5x' },
  { value: 1.75, label: '1.75x' },
  { value: 2, label: '2.0x' },
];

export default function StreamPlayer({
  channel,
  info,
  onRemove,
  onToggleChat,
  isChatOpen,
  isPrimary = false,
  onMakePrimary,
  isMuted = false,
  onToggleMute,
  volume = 100,
  onSetVolume,
  totalStreams = 1,
  globalQuality,
  globalSpeed
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [isSpeedOpen, setIsSpeedOpen] = useState(false);
  const [currentQuality, setCurrentQuality] = useState('auto');
  const [currentSpeed, setCurrentSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const containerRef = useRef(null);
  const volumeRef = useRef(null);
  const qualityRef = useRef(null);
  const speedRef = useRef(null);
  const iframeRef = useRef(null);

  const isLive = info?.isLive ?? false;
  const videoId = info?.videoId;
  const channelName = info?.channelName || channel.name || channel.handle.replace('@', '');
  const avatar = info?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
  const title = info?.title || channel.description || `${channelName} Stream`;
  const viewerCount = info?.viewerCount;

  // Compute embed URL with parameters
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const effectiveMuted = isMuted || volume === 0;
  const muteParam = effectiveMuted ? 1 : 0;

  let embedUrl = '';
  if (isLive && videoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muteParam}&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}&playsinline=1`;
  }

  // Helper to send command to YouTube Iframe
  const sendIframeCommand = (func, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func, args }),
          '*'
        );
      } catch (err) {
        // Fallback silently
      }
    }
  };

  // Sync volume & mute changes via postMessage
  useEffect(() => {
    if (effectiveMuted) {
      sendIframeCommand('mute');
    } else {
      sendIframeCommand('unMute');
      sendIframeCommand('setVolume', [volume]);
    }
  }, [effectiveMuted, volume]);

  // Sync global quality if set by parent
  useEffect(() => {
    if (globalQuality) {
      handleSetQuality(globalQuality);
    }
  }, [globalQuality]);

  // Sync global speed if set by parent
  useEffect(() => {
    if (globalSpeed !== undefined) {
      handleSetSpeed(globalSpeed);
    }
  }, [globalSpeed]);

  // Listen for YouTube Iframe events (playback quality, speed, etc.)
  useEffect(() => {
    const handleWindowMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'infoDelivery' || data.info)) {
          const streamInfo = data.info;
          if (streamInfo) {
            if (streamInfo.playbackRate && streamInfo.playbackRate !== currentSpeed) {
              setCurrentSpeed(streamInfo.playbackRate);
            }
          }
        }
      } catch (e) {
        // Non-JSON message from other extensions, ignore
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [currentQuality, currentSpeed]);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setIsSliderOpen(false);
      }
      if (qualityRef.current && !qualityRef.current.contains(event.target)) {
        setIsQualityOpen(false);
      }
      if (speedRef.current && !speedRef.current.contains(event.target)) {
        setIsSpeedOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Set Video Quality
  const handleSetQuality = (qualityVal) => {
    setCurrentQuality(qualityVal);
    sendIframeCommand('setPlaybackQuality', [qualityVal]);
    sendIframeCommand('setPlaybackQualityRange', [qualityVal, qualityVal]);
    setIsQualityOpen(false);
  };

  // Set Playback Speed
  const handleSetSpeed = (speedVal) => {
    setCurrentSpeed(speedVal);
    sendIframeCommand('setPlaybackRate', [speedVal]);
    setIsSpeedOpen(false);
  };

  // Toggle Fullscreen on player container
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.warn('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().catch(err => {
        console.warn('Error attempting to exit fullscreen:', err);
      });
    }
  };

  const handleReload = () => {
    setReloadKey(prev => prev + 1);
  };

  const getVolumeIcon = () => {
    if (effectiveMuted || volume === 0) {
      return <VolumeX className="h-3.5 w-3.5 text-red-400" />;
    }
    if (volume < 40) {
      return <Volume1 className="h-3.5 w-3.5 text-emerald-400" />;
    }
    return <Volume2 className="h-3.5 w-3.5 text-emerald-400" />;
  };

  const activeQualityOption = QUALITY_OPTIONS.find(q => q.value === currentQuality) || QUALITY_OPTIONS[0];

  // Overlay is active when hovered, or when any menu/slider is opened
  const isControlsVisible = isHovered || isQualityOpen || isSpeedOpen || isSliderOpen;

  return (
    <div 
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // If dropdowns are open, don't close them instantly on leave, but hide hovered flag
        setIsHovered(false);
      }}
      className={`relative flex flex-col w-full h-full rounded-2xl overflow-hidden bg-black border transition-all duration-300 group shadow-2xl ${
        isPrimary 
          ? 'border-blue-500/70 shadow-blue-500/15 ring-1 ring-blue-500/30' 
          : 'border-white/[0.12] hover:border-white/[0.3]'
      }`}
    >
      {/* Top Floating Control Overlay - HIDE BY DEFAULT, SHOW ONLY ON HOVER OR ACTIVE MENU */}
      <div 
        className={`absolute top-0 inset-x-0 z-30 flex items-center justify-between p-2 sm:p-3 bg-gradient-to-b from-black/95 via-black/75 to-transparent transition-all duration-300 ease-out ${
          isControlsVisible 
            ? 'opacity-100 translate-y-0 pointer-events-auto' 
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        {/* Left: Streamer Avatar, Channel Name, Stream Title & Viewer Badge */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 drop-shadow-md pr-2">
          <div className="relative flex-shrink-0">
            <img
              src={avatar}
              alt={channelName}
              className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border border-white/40 shadow-md bg-slate-800"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
              }}
            />
            {isLive && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-red-600 border-2 border-black"></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-white truncate font-display drop-shadow">
                {channelName}
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-600/90 text-white shadow-sm flex-shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE {viewerCount && `(${formatViewerCount(viewerCount)})`}
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 border border-white/10 backdrop-blur-sm flex-shrink-0 font-medium">
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-white/70 truncate -mt-0.5">
              {title}
            </p>
          </div>
        </div>

        {/* Right: Controls Strip (Quality, Speed, Volume, Stage Switch, Chat, Fullscreen, Close) */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          
          {/* 1. QUALITY SELECTOR DROPDOWN */}
          <div ref={qualityRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsQualityOpen(!isQualityOpen);
                setIsSpeedOpen(false);
                setIsSliderOpen(false);
              }}
              title="Change Video Quality"
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-mono font-bold transition-all border shadow-sm backdrop-blur-xl ${
                isQualityOpen
                  ? 'bg-blue-600 text-white border-blue-400 shadow-blue-500/40'
                  : currentQuality !== 'auto'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30'
                  : 'bg-black/70 text-white/90 hover:text-white hover:bg-black/90 border-white/15'
              }`}
            >
              <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-blue-400" />
              <span>{activeQualityOption.badge}</span>
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isQualityOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Quality Menu Popover */}
            {isQualityOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-2xl bg-[#0c1424]/95 border border-blue-500/40 shadow-2xl backdrop-blur-2xl p-1.5 z-50 animate-fade-in divide-y divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center justify-between">
                  <span>Video Quality</span>
                  <span className="text-blue-400 font-mono">{activeQualityOption.badge}</span>
                </div>
                <div className="pt-1 space-y-0.5">
                  {QUALITY_OPTIONS.map((opt) => {
                    const isSelected = currentQuality === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSetQuality(opt.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-sm font-bold'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-white/40'}`}>
                            ({opt.desc})
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. SPEED SELECTOR DROPDOWN */}
          <div ref={speedRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setIsSpeedOpen(!isSpeedOpen);
                setIsQualityOpen(false);
                setIsSliderOpen(false);
              }}
              title="Adjust Playback Speed"
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-mono font-bold transition-all border shadow-sm backdrop-blur-xl ${
                isSpeedOpen
                  ? 'bg-purple-600 text-white border-purple-400 shadow-purple-500/40'
                  : currentSpeed !== 1
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30'
                  : 'bg-black/70 text-white/90 hover:text-white hover:bg-black/90 border-white/15'
              }`}
            >
              <Gauge className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-400" />
              <span>{currentSpeed}x</span>
              <ChevronDown className={`h-2.5 w-2.5 transition-transform ${isSpeedOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Speed Menu Popover */}
            {isSpeedOpen && (
              <div className="absolute right-0 mt-1.5 w-36 rounded-2xl bg-[#0c1424]/95 border border-purple-500/40 shadow-2xl backdrop-blur-2xl p-1.5 z-50 animate-fade-in divide-y divide-white/[0.06]">
                <div className="px-2.5 py-1 text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center justify-between">
                  <span>Playback Speed</span>
                  <span className="text-purple-400 font-mono">{currentSpeed}x</span>
                </div>
                <div className="pt-1 space-y-0.5">
                  {SPEED_OPTIONS.map((opt) => {
                    const isSelected = currentSpeed === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSetSpeed(opt.value)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm font-bold'
                            : 'text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <span>{opt.label} {opt.badge && `(${opt.badge})`}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. EXPANDABLE VOLUME CONTROLLER */}
          <div 
            ref={volumeRef}
            className={`flex items-center rounded-xl backdrop-blur-xl border transition-all duration-200 ${
              isSliderOpen 
                ? 'bg-[#0c1424]/95 border-blue-500/60 p-1 shadow-xl' 
                : effectiveMuted
                ? 'bg-red-500/20 border-red-500/40 p-0.5 hover:bg-red-500/30'
                : 'bg-emerald-500/20 border-emerald-500/40 p-0.5 hover:bg-emerald-500/30 shadow-sm'
            }`}
          >
            {/* Mute/Unmute Icon Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleMute) onToggleMute(channel.handle);
              }}
              title={effectiveMuted ? "Click to unmute" : "Click to mute"}
              className="flex items-center gap-1 px-1.5 py-1 rounded-lg text-xs font-bold text-white hover:bg-white/10 transition-colors"
            >
              {getVolumeIcon()}
            </button>

            {/* If closed: click percentage to open slider */}
            {!isSliderOpen ? (
              <button
                type="button"
                onClick={() => {
                  setIsSliderOpen(true);
                  setIsQualityOpen(false);
                  setIsSpeedOpen(false);
                }}
                title="Click to adjust volume slider"
                className="pr-1.5 sm:pr-2 pl-0.5 py-1 text-[10px] sm:text-[11px] font-mono font-bold text-white/90 hover:text-white"
              >
                {effectiveMuted ? '0%' : `${volume}%`}
              </button>
            ) : (
              /* If open: inline slider */
              <div className="flex items-center gap-2 pl-1 pr-1.5 py-0.5 animate-fade-in">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={effectiveMuted ? 0 : volume}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (onSetVolume) {
                      onSetVolume(channel.handle, val);
                    }
                  }}
                  className="w-16 sm:w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
                <span className="text-[10px] sm:text-[11px] font-mono font-bold text-white min-w-[28px] text-right">
                  {effectiveMuted ? '0%' : `${volume}%`}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSliderOpen(false)}
                  title="Close slider"
                  className="p-0.5 rounded text-white/40 hover:text-white hover:bg-white/10"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* 4. MAKE MAIN / STAGE SWAP BUTTON (Secondary streams) */}
          {!isPrimary && totalStreams > 1 && onMakePrimary && (
            <button
              onClick={() => onMakePrimary(channel.handle)}
              title="Set as Main Big Screen"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white text-[10px] sm:text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95 border border-blue-400/30"
            >
              <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="hidden sm:inline">Make Main</span>
            </button>
          )}

          {/* 5. TOGGLE LIVE CHAT */}
          <button
            onClick={() => onToggleChat(channel.handle)}
            title={isChatOpen ? "Close Live Chat" : "Open Live Chat"}
            className={`p-1.5 rounded-xl backdrop-blur-md transition-colors flex items-center gap-1 text-xs font-semibold border ${
              isChatOpen 
                ? 'bg-blue-600 text-white border-blue-400 shadow-md' 
                : 'bg-black/70 hover:bg-black/90 text-white/70 hover:text-white border-white/15'
            }`}
          >
            <MessageSquare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>

          {/* 6. FULLSCREEN PLAYER */}
          <button
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Player"}
            className="p-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-colors hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {/* 7. RELOAD STREAM */}
          <button
            onClick={handleReload}
            title="Reload player"
            className="p-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-colors"
          >
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>

          {/* 8. OPEN ON YOUTUBE */}
          <a
            href={videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/${channel.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in YouTube"
            className="p-1.5 rounded-xl bg-black/70 hover:bg-black/90 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-colors hidden sm:flex"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* 9. CLOSE / REMOVE STREAM */}
          <button
            onClick={() => onRemove(channel.handle)}
            title="Remove stream"
            className="p-1.5 rounded-xl bg-black/70 hover:bg-red-600/80 text-white/70 hover:text-white border border-white/15 backdrop-blur-md transition-colors"
          >
            <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      {/* Video Player Iframe Area */}
      <div className="relative w-full h-full min-h-[220px] sm:min-h-[280px] bg-black flex items-center justify-center">
        {embedUrl ? (
          <iframe
            ref={iframeRef}
            key={reloadKey}
            src={embedUrl}
            title={`${channelName} live stream`}
            className="w-full h-full border-0 absolute inset-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center bg-black/90">
            <Radio className="h-10 w-10 text-white/30 mb-2" />
            <p className="text-sm font-semibold text-white">Stream currently offline</p>
            <p className="text-xs text-white/50 mt-1 max-w-xs">
              No active livestream detected for {channelName}.
            </p>
            <a
              href={`https://www.youtube.com/${channel.handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
            >
              <span>Visit Channel</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
