import React from 'react';
import { 
  Radio, 
  Eye, 
  ExternalLink, 
  Trash2, 
  Play, 
  Check, 
  Tv, 
  MessageSquare,
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

  return (
    <div 
      className={`group relative rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between ${
        isSelected 
          ? 'bg-blue-950/40 border-2 border-blue-500/80 shadow-lg shadow-blue-500/20' 
          : 'bg-[#101728]/70 border border-white/[0.08] hover:border-white/[0.2] hover:bg-[#152038]/80 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1'
      }`}
    >
      {/* Top row: Checkbox, Live Badge, External Link */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Selection Checkbox */}
        <label 
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div 
            onClick={() => onToggleSelect(channel.handle)}
            className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm shadow-blue-500/50' 
                : 'border-white/30 bg-black/40 group-hover:border-white/50'
            }`}
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </div>
          <span className="text-xs font-semibold text-white/70 group-hover:text-white transition-colors">
            Select
          </span>
        </label>

        {/* Live Status Badge */}
        <div className="flex items-center gap-2">
          {isLive ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/40 shadow-sm shadow-red-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-80"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[11px] font-extrabold tracking-wider text-red-400">
                LIVE
              </span>
              {viewerCount && (
                <>
                  <span className="text-white/20 text-xs">•</span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-white/80">
                    <Eye className="h-3 w-3 text-red-400" />
                    {formatViewerCount(viewerCount)}
                  </span>
                </>
              )}
            </div>
          ) : (
            <div className="px-2.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-[11px] font-semibold text-white/40">
              OFFLINE
            </div>
          )}

          {/* Delete custom channel button */}
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

      {/* Middle: Channel Avatar, Handle, and Stream Title */}
      <div className="flex items-start gap-3.5 my-2">
        {/* Avatar with dynamic glow */}
        <div className="relative flex-shrink-0">
          <div className={`p-0.5 rounded-full ${
            isLive 
              ? 'bg-gradient-to-tr from-red-500 via-rose-500 to-amber-500 animate-pulse' 
              : 'bg-white/10'
          }`}>
            <img
              src={avatar}
              alt={channelName}
              className="h-12 w-12 rounded-full object-cover bg-slate-800"
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

        {/* Text Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-bold text-white truncate font-display group-hover:text-blue-300 transition-colors">
              {channelName}
            </h3>
            {channel.category && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.07] text-white/50 truncate hidden sm:inline">
                {channel.category}
              </span>
            )}
          </div>
          <p className="text-xs text-blue-400/80 font-mono truncate">
            {channel.handle}
          </p>

          {/* Stream Title / Channel Description */}
          <p className="text-xs text-white/70 mt-1.5 line-clamp-2 leading-relaxed">
            {title}
          </p>
        </div>
      </div>

      {/* Bottom: Action Buttons */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
        {/* Watch on YouTube link */}
        <a
          href={videoId ? `https://www.youtube.com/watch?v=${videoId}` : `https://www.youtube.com/${channel.handle}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-white/40 hover:text-white transition-colors"
        >
          <span>YouTube</span>
          <ExternalLink className="h-3 w-3" />
        </a>

        {/* Quick Watch Button */}
        <button
          onClick={() => onQuickWatch(channel.handle)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
            isLive
              ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-md shadow-red-600/30'
              : 'bg-white/[0.08] hover:bg-white/[0.15] text-white/80'
          }`}
        >
          <Play className="h-3 w-3 fill-current" />
          <span>{isLive ? 'Watch Live' : 'Open Stream'}</span>
        </button>
      </div>
    </div>
  );
}
