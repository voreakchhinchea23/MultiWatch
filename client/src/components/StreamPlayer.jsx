import React, { useState, useEffect, useRef } from 'react';
import { 
  Maximize2, 
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
  Volume
} from 'lucide-react';
import { formatViewerCount } from '../utils/storage';

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
  totalStreams
}) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const volumeRef = useRef(null);
  const iframeRef = useRef(null);

  const isLive = info?.isLive ?? false;
  const videoId = info?.videoId;
  const channelId = info?.channelId;
  const channelName = info?.channelName || channel.name || channel.handle.replace('@', '');
  const avatar = info?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
  const title = info?.title || channel.description || `${channelName} Stream`;
  const viewerCount = info?.viewerCount;

  // Compute embed URL with initial mute parameter
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const effectiveMuted = isMuted || volume === 0;
  const muteParam = effectiveMuted ? 1 : 0;

  let embedUrl = '';
  if (videoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${muteParam}&enablejsapi=1&origin=${encodeURIComponent(currentOrigin)}`;
  } else if (channelId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/live_stream?channel=${channelId}&autoplay=1&mute=${muteParam}&enablejsapi=1`;
  } else if (channel.handle) {
    embedUrl = `https://www.youtube-nocookie.com/embed?listType=user_uploads&list=${channel.handle.replace('@', '')}&autoplay=1&mute=${muteParam}&enablejsapi=1`;
  }

  // Handle instant volume & mute changes via postMessage without reloading iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        if (effectiveMuted) {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'mute', args: [] }),
            '*'
          );
        } else {
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'unMute', args: [] }),
            '*'
          );
          iframeRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setVolume', args: [volume] }),
            '*'
          );
        }
      } catch (err) {
        // Silent fallback
      }
    }
  }, [effectiveMuted, volume]);

  // Outside click handler to collapse volume slider if open
  useEffect(() => {
    function handleClickOutside(event) {
      if (volumeRef.current && !volumeRef.current.contains(event.target)) {
        setIsSliderOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  return (
    <div 
      className={`relative flex flex-col w-full h-full rounded-2xl overflow-hidden bg-black border transition-all duration-300 group shadow-2xl ${
        isPrimary 
          ? 'border-blue-500/60 shadow-blue-500/10' 
          : 'border-white/[0.1] hover:border-white/[0.25]'
      }`}
    >
      {/* Top Floating Overlay (Transparent glass header over video) */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between p-2.5 sm:p-3 bg-gradient-to-b from-black/85 via-black/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Left: Streamer Avatar + Name + Title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 drop-shadow-md">
          <div className="relative flex-shrink-0">
            <img
              src={avatar}
              alt={channelName}
              className="h-8 w-8 rounded-full object-cover border border-white/40 shadow-md"
              onError={(e) => {
                e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
              }}
            />
            {isLive && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-600 border-2 border-black"></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-white truncate font-display drop-shadow">
                {title || channelName}
              </span>
              {isLive ? (
                <span className="flex items-center gap-1 text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-red-600/90 text-white shadow-sm flex-shrink-0">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                  LIVE {viewerCount && `(${formatViewerCount(viewerCount)})`}
                </span>
              ) : (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 text-white/80 backdrop-blur-sm flex-shrink-0">
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-[11px] text-white/70 truncate -mt-0.5">
              {channelName} • {channel.handle}
            </p>
          </div>
        </div>

        {/* Right: Overlay Controls */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          
          {/* SOLID INLINE EXPANDABLE VOLUME CONTROLLER */}
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
                onClick={() => setIsSliderOpen(true)}
                title="Click to adjust volume slider"
                className="pr-2 pl-0.5 py-1 text-[11px] font-mono font-bold text-white/90 hover:text-white"
              >
                {effectiveMuted ? '0%' : `${volume}%`}
              </button>
            ) : (
              /* If open: inline slider that NEVER disappears while dragging */
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
                  className="w-20 sm:w-28 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
                />
                <span className="text-[11px] font-mono font-bold text-white min-w-[28px] text-right">
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

          {/* If secondary stream, show "Swap to Main / Focus" button */}
          {!isPrimary && totalStreams > 1 && onMakePrimary && (
            <button
              onClick={() => onMakePrimary(channel.handle)}
              title="Set as Main Big Screen"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white text-xs font-bold shadow-md backdrop-blur-md transition-all active:scale-95"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Make Main</span>
            </button>
          )}

          {/* Reload Stream Player */}
          <button
            onClick={handleReload}
            title="Reload player"
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-md transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          {/* Toggle Live Chat */}
          <button
            onClick={() => onToggleChat(channel.handle)}
            title={isChatOpen ? "Close Live Chat" : "Open Live Chat"}
            className={`p-1.5 rounded-lg backdrop-blur-md transition-colors flex items-center gap-1 text-xs font-semibold ${
              isChatOpen 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-black/50 hover:bg-black/80 text-white/70 hover:text-white'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>

          {/* Open on YouTube */}
          <a
            href={videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/${channel.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Open in YouTube"
            className="p-1.5 rounded-lg bg-black/50 hover:bg-black/80 text-white/70 hover:text-white backdrop-blur-md transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          {/* Close Stream */}
          <button
            onClick={() => onRemove(channel.handle)}
            title="Remove stream"
            className="p-1.5 rounded-lg bg-black/50 hover:bg-red-600/80 text-white/70 hover:text-white backdrop-blur-md transition-colors"
          >
            <X className="h-3.5 w-3.5" />
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
