import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  ExternalLink, 
  X, 
  Radio, 
  Sparkles, 
  Heart, 
  Flame, 
  Star, 
  Smile, 
  Crown, 
  PartyPopper,
  Info,
  RefreshCw,
  Eye,
  Send
} from 'lucide-react';
import { formatViewerCount } from '../utils/storage';

const CUTE_REACTIONS = [
  { emoji: '💖', label: 'Love', icon: Heart, color: 'text-pink-400' },
  { emoji: '🔥', label: 'Hype', icon: Flame, color: 'text-amber-400' },
  { emoji: '⭐', label: 'GG', icon: Star, color: 'text-yellow-400' },
  { emoji: '🎉', label: 'Pog', icon: PartyPopper, color: 'text-emerald-400' },
  { emoji: '😂', label: 'LOL', icon: Smile, color: 'text-blue-400' },
  { emoji: '👑', label: 'MVP', icon: Crown, color: 'text-purple-400' },
];

export default function LiveChatPanel({
  activeStreams,
  channelsInfo,
  activeChatHandle,
  onSelectChatHandle,
  onClose
}) {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'info'
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);

  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  // Get active stream info for current selected chat handle
  const currentStream = activeStreams.find(s => s.handle === activeChatHandle) || activeStreams[0];
  const info = currentStream ? channelsInfo[currentStream.handle] : null;
  const videoId = info?.videoId;
  const channelName = info?.channelName || currentStream?.name || currentStream?.handle;
  const avatar = info?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(currentStream?.handle || 'seed')}`;
  const title = info?.title || currentStream?.description || `${channelName} Live Stream`;
  const isLive = info?.isLive ?? false;
  const viewerCount = info?.viewerCount;

  // Add &dark_theme=1 and &theme=dark to guarantee YouTube renders chat in Dark Mode
  const chatEmbedUrl = videoId
    ? `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${encodeURIComponent(currentDomain)}&dark_theme=1&theme=dark`
    : '';

  // Trigger floating cute emoji burst
  const handleTriggerReaction = (emoji) => {
    const id = Date.now() + Math.random();
    const randomLeft = Math.floor(Math.random() * 70) + 15; // 15% to 85%
    const randomRotation = Math.floor(Math.random() * 40) - 20;

    const newReaction = { id, emoji, left: randomLeft, rotation: randomRotation };

    setFloatingReactions(prev => [...prev.slice(-15), newReaction]);

    // Auto remove after animation completes
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 1800);
  };

  const handlePopout = () => {
    const popoutUrl = videoId
      ? `https://www.youtube.com/live_chat?v=${videoId}&is_popout=1`
      : null;
    if (popoutUrl) {
      window.open(popoutUrl, '_blank', 'width=420,height=680,resizable=yes,scrollbars=yes');
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-[380px] flex flex-col h-full bg-[#0a0f1d] border-l border-white/[0.08] shadow-2xl z-20 flex-shrink-0 relative overflow-hidden">
      {/* Floating Animated Reaction Emojis Layer */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map(item => (
          <div
            key={item.id}
            style={{ 
              left: `${item.left}%`,
              bottom: '60px',
              transform: `rotate(${item.rotation}deg)`
            }}
            className="absolute text-2xl sm:text-3xl animate-float-up drop-shadow-lg select-none"
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Top Header with Cute Cyberpunk styling */}
      <div className="p-3 sm:p-4 border-b border-white/[0.08] bg-gradient-to-r from-[#0c1424] via-[#0e172e] to-[#0c1424]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-md shadow-pink-500/20">
              <MessageSquare className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight font-display">
                  Live Chat <span className="text-gradient-pink">Room</span>
                </h3>
                {isLive && (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons (Tab switch, Popout, Close) */}
          <div className="flex items-center gap-1">
            {/* Tab switch button */}
            <button
              onClick={() => setActiveTab(activeTab === 'chat' ? 'info' : 'chat')}
              title={activeTab === 'chat' ? "Streamer Details" : "Live Chat"}
              className={`p-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeTab === 'info'
                  ? 'bg-purple-600/30 text-purple-300 border-purple-500/50'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border-white/[0.08]'
              }`}
            >
              <Info className="h-3.5 w-3.5" />
            </button>

            {/* Refresh Chat */}
            {videoId && (
              <button
                onClick={() => setReloadKey(prev => prev + 1)}
                title="Reload Chat"
                className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08] transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Popout Button */}
            {videoId && (
              <button
                onClick={handlePopout}
                title="Open popout window"
                className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-white/70 hover:text-white border border-white/[0.08] transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Close Panel */}
            <button
              onClick={onClose}
              title="Close chat panel"
              className="p-1.5 rounded-xl bg-white/[0.06] hover:bg-red-600/80 text-white/70 hover:text-white border border-white/[0.08] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Cute Stream Selector Pills */}
        {activeStreams.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {activeStreams.map(stream => {
              const streamInfo = channelsInfo[stream.handle];
              const isSelected = stream.handle === (currentStream?.handle);
              const name = streamInfo?.channelName || stream.name || stream.handle.replace('@', '');
              const streamAvatar = streamInfo?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(stream.handle)}`;

              return (
                <button
                  key={stream.handle}
                  onClick={() => onSelectChatHandle(stream.handle)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-blue-400 shadow-md shadow-indigo-600/30 ring-1 ring-blue-400'
                      : 'bg-white/[0.06] text-white/70 hover:bg-white/[0.12] hover:text-white border-white/[0.08]'
                  }`}
                >
                  <img
                    src={streamAvatar}
                    alt={name}
                    className="h-4 w-4 rounded-full object-cover border border-white/20"
                    onError={(e) => {
                      e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(stream.handle)}`;
                    }}
                  />
                  {streamInfo?.isLive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse"></span>
                  )}
                  <span>{name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Chat Container / Info Container */}
      <div className="relative flex-1 w-full bg-[#0a0f1d] overflow-hidden flex flex-col">
        {activeTab === 'chat' ? (
          videoId ? (
            <div className="relative w-full h-full bg-[#0f0f0f]">
              <iframe
                key={`${videoId}-${currentDomain}-${reloadKey}`}
                src={chatEmbedUrl}
                title={`${channelName} live chat`}
                className="w-full h-full border-0 bg-[#0f0f0f]"
                style={{ colorScheme: 'dark' }}
                allow="autoplay"
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/60">
              <div className="h-14 w-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-3">
                <Radio className="h-7 w-7 text-white/30" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                Chat Currently Offline
              </h4>
              <p className="text-xs text-white/50 max-w-[240px] mb-4 leading-relaxed">
                {currentStream ? `No live broadcast detected for ${channelName}.` : 'Select a stream.'}
              </p>
              {currentStream && (
                <button
                  onClick={handlePopout}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>Open YouTube Channel</span>
                </button>
              )}
            </div>
          )
        ) : (
          /* Streamer Info Card View */
          <div className="flex-1 p-4 overflow-y-auto space-y-4 animate-fade-in text-slate-200">
            {/* Streamer Avatar & Name Card */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-3.5">
              <img
                src={avatar}
                alt={channelName}
                className="h-14 w-14 rounded-full object-cover border-2 border-pink-500/50 shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-base text-white truncate font-display">
                    {channelName}
                  </h4>
                  {isLive && (
                    <span className="px-2 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-extrabold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-blue-400 font-mono">
                  {currentStream?.handle}
                </p>
                {viewerCount && (
                  <p className="text-xs text-white/70 flex items-center gap-1 mt-1 font-medium">
                    <Eye className="h-3.5 w-3.5 text-red-400" />
                    <span>{formatViewerCount(viewerCount)} viewers watching</span>
                  </p>
                )}
              </div>
            </div>

            {/* Broadcast Details */}
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-2">
              <div className="text-[11px] font-bold text-white/40 uppercase tracking-wider">
                Broadcast Title
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                {title}
              </p>
              {currentStream?.category && (
                <div className="pt-2 flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold">
                    {currentStream.category}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Channel Actions */}
            <div className="space-y-2">
              <a
                href={`https://www.youtube.com/${currentStream?.handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 transition-all"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Visit {channelName} on YouTube</span>
              </a>

              <button
                onClick={() => setActiveTab('chat')}
                className="w-full py-2.5 px-4 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white text-xs font-bold border border-white/[0.1] flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="h-3.5 w-3.5 text-blue-400" />
                <span>Back to Live Chat</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Cute Interactive Reaction Dock at Bottom */}
      <div className="p-2.5 bg-[#090e1a] border-t border-white/[0.08] flex items-center justify-between gap-1 select-none">
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 scrollbar-none w-full justify-around">
          {CUTE_REACTIONS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleTriggerReaction(item.emoji)}
              title={`Send cute ${item.label} reaction!`}
              className="px-2 py-1 rounded-xl bg-white/[0.06] hover:bg-white/[0.15] hover:scale-110 active:scale-95 border border-white/[0.06] text-sm sm:text-base transition-all duration-150 flex items-center gap-1 shadow-sm"
            >
              <span>{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 bg-[#070b14] border-t border-white/[0.04] text-[10px] text-white/40 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-pink-400" />
          <span>Synced with YouTube Dark Live Chat</span>
        </span>
        <button
          onClick={handlePopout}
          className="text-blue-400 hover:text-blue-300 transition-colors font-medium flex items-center gap-1"
        >
          <span>Pop-out</span>
          <ExternalLink className="h-2.5 w-2.5" />
        </button>
      </div>
    </aside>
  );
}
