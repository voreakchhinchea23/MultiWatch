import React from 'react';
import { 
  Radio, 
  Eye, 
  ExternalLink, 
  Trash2, 
  Play, 
  Check, 
  Tv,
  Sparkles
} from 'lucide-react';
import { formatViewerCount } from '../utils/storage';

export default function ChannelCard({
  channel,
  info,
  isSelected,
  onToggleSelect,
  onQuickWatch,
  onDelete
}) {
  const isLive = info?.isLive ?? false;
  const videoId = info?.videoId;
  const channelName = channel.name || info?.channelName || channel.handle.replace('@', '');
  const avatar = info?.channelAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
  const title = isLive ? (info?.title || 'Live Stream') : (channel.description || 'Offline');
  const viewerCount = info?.viewerCount;
  const thumbnail = info?.thumbnail || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null);

  // Clicking the card: Selects if live; opens YouTube channel in new tab if offline
  const handleCardClick = () => {
    if (isLive) {
      onToggleSelect(channel.handle);
    } else {
      window.open(`https://www.youtube.com/${channel.handle}`, '_blank', 'noopener,noreferrer');
    }
  };

  // Button action: Quick watch if live; open YouTube channel if offline
  const handleActionClick = (e) => {
    e.stopPropagation();
    if (isLive) {
      onQuickWatch(channel.handle);
    } else {
      window.open(`https://www.youtube.com/${channel.handle}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
        isLive
          ? isSelected 
            ? 'bg-blue-950/50 border-blue-500 shadow-xl shadow-blue-500/20 ring-1 ring-blue-400/50 -translate-y-1' 
            : 'bg-[#0f172a]/80 border-red-500/30 hover:border-red-500/80 hover:bg-[#131f38] hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-1'
          : 'bg-[#0a0f1d]/50 border-white/[0.05] opacity-75 hover:opacity-100 hover:border-white/[0.18] hover:bg-[#101728]/70'
      }`}
    >
      {/* Live Stream Thumbnail Banner if Live */}
      {isLive && thumbnail && (
        <div className="relative w-full aspect-video bg-slate-900 overflow-hidden border-b border-white/[0.08]">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          {/* Subtle gradient vignette overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/60"></div>

          {/* Top Floating Badges on Thumbnail */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
            {/* Live Indicator + Viewers */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/90 backdrop-blur-md text-white shadow-md">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              <span className="text-[10px] font-black tracking-wider">LIVE</span>
              {viewerCount && formatViewerCount(viewerCount) && (
                <>
                  <span className="text-white/40 text-[10px]">•</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold">
                    <Eye className="h-3 w-3" />
                    {formatViewerCount(viewerCount)}
                  </span>
                </>
              )}
            </div>

            {/* Checkbox badge on top right */}
            <div className="pointer-events-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(channel.handle);
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-md backdrop-blur-md ${
                  isSelected
                    ? 'bg-blue-600 text-white border border-blue-400 ring-2 ring-blue-500/50'
                    : 'bg-black/60 hover:bg-black/80 text-white/90 border border-white/20'
                }`}
              >
                <div className={`h-3.5 w-3.5 rounded flex items-center justify-center border ${
                  isSelected ? 'bg-white text-blue-600 border-white' : 'border-white/60 bg-transparent'
                }`}>
                  {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                </div>
                <span>{isSelected ? 'Selected' : 'Select'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Content Area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {/* If offline, show offline header bar */}
        {!isLive && (
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5 text-white/40 text-xs select-none">
              <span className="h-2 w-2 rounded-full bg-white/20"></span>
              <span>Offline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[11px] font-semibold text-white/40">
                OFFLINE
              </div>
              {!channel.isDefault && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(channel.handle);
                  }}
                  title="Remove channel"
                  className="p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Streamer Avatar & Text */}
        <div className="flex items-start gap-3 my-1">
          <div className="relative flex-shrink-0">
            <div className={`p-0.5 rounded-full ${
              isLive 
                ? 'bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 animate-pulse' 
                : 'bg-white/10'
            }`}>
              <img
                src={avatar}
                alt={channelName}
                className="h-11 w-11 rounded-full object-cover bg-slate-800"
                onError={(e) => {
                  e.target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(channel.handle)}`;
                }}
              />
            </div>
            {isLive && (
              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-red-600 border-2 border-[#101728] flex items-center justify-center">
                <Radio className="h-2 w-2 text-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`text-sm font-bold truncate font-display transition-colors ${
                isLive ? 'text-white group-hover:text-red-300' : 'text-white/80 group-hover:text-white'
              }`}>
                {channelName}
              </h3>
              {channel.category && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.07] text-white/50 truncate">
                  {channel.category}
                </span>
              )}
            </div>
            <p className="text-xs text-blue-400 font-mono truncate">
              {channel.handle}
            </p>
            <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
              isLive ? 'text-white font-medium' : 'text-white/50'
            }`}>
              {title}
            </p>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <a
            href={`https://www.youtube.com/${channel.handle}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
          >
            <span>YouTube</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            onClick={handleActionClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-md ${
              isLive
                ? 'bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white shadow-red-600/30'
                : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/60 hover:text-white'
            }`}
          >
            {isLive ? (
              <>
                <Play className="h-3 w-3 fill-current" />
                <span>Watch Live</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3 w-3" />
                <span>Visit Channel</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
