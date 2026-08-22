import React from 'react';
import { 
  MessageSquare, 
  ExternalLink, 
  X, 
  Radio
} from 'lucide-react';

export default function LiveChatPanel({
  activeStreams,
  channelsInfo,
  activeChatHandle,
  onSelectChatHandle,
  onClose
}) {
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  // Get active stream info for current selected chat handle
  const currentStream = activeStreams.find(s => s.handle === activeChatHandle) || activeStreams[0];
  const info = currentStream ? channelsInfo[currentStream.handle] : null;
  const videoId = info?.videoId;
  const channelId = info?.channelId || currentStream?.channelId;
  const channelName = info?.channelName || currentStream?.name || currentStream?.handle;

  // Add &dark_theme=1 and &theme=dark to guarantee YouTube renders chat in Dark Mode
  const chatEmbedUrl = videoId
    ? `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${encodeURIComponent(currentDomain)}&dark_theme=1&theme=dark`
    : channelId
    ? `https://www.youtube.com/live_chat?channel=${channelId}&embed_domain=${encodeURIComponent(currentDomain)}&dark_theme=1&theme=dark`
    : '';

  const handlePopout = () => {
    const popoutUrl = videoId
      ? `https://www.youtube.com/live_chat?v=${videoId}&is_popout=1`
      : channelId
      ? `https://www.youtube.com/live_chat?channel=${channelId}&is_popout=1`
      : null;
    if (popoutUrl) {
      window.open(popoutUrl, '_blank', 'width=420,height=680,resizable=yes,scrollbars=yes');
    }
  };

  return (
    <aside className="w-full lg:w-80 xl:w-[380px] flex flex-col h-full bg-[#0a0f1d] border-l border-white/[0.08] shadow-2xl z-20 flex-shrink-0">
      {/* Top Header matching Loffy Store */}
      <div className="p-4 border-b border-white/[0.08] bg-[#0c1424]">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-extrabold text-white tracking-tight font-display">
              Live Chat
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Select a stream to view its chat.
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Popout Button */}
            {videoId && (
              <button
                onClick={handlePopout}
                title="Popout live chat window"
                className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
            )}

            {/* Close Panel */}
            <button
              onClick={onClose}
              title="Close chat panel"
              className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stream selector pills */}
        {activeStreams.length > 0 && (
          <div className="flex items-center gap-2 mt-3.5 overflow-x-auto pb-1 scrollbar-none">
            {activeStreams.map(stream => {
              const streamInfo = channelsInfo[stream.handle];
              const isSelected = stream.handle === (currentStream?.handle);
              const name = streamInfo?.channelName || stream.name || stream.handle.replace('@', '');

              return (
                <button
                  key={stream.handle}
                  onClick={() => onSelectChatHandle(stream.handle)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'bg-white/[0.08] text-white/70 hover:bg-white/[0.15] hover:text-white'
                  }`}
                >
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

      {/* Embedded Chat Frame Container (Enforced Dark Theme) */}
      <div className="relative flex-1 w-full bg-[#0a0f1d] overflow-hidden flex flex-col">
        {videoId ? (
          <div className="relative w-full h-full bg-[#0f0f0f]">
            <iframe
              key={`${videoId}-${currentDomain}`}
              src={chatEmbedUrl}
              title={`${channelName} live chat`}
              className="w-full h-full border-0 bg-[#0f0f0f]"
              style={{ colorScheme: 'dark' }}
              allow="autoplay"
            />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/60">
            <MessageSquare className="h-12 w-12 text-white/20 mb-3" />
            <h4 className="text-sm font-bold text-white mb-1">
              Live Chat Unavailable
            </h4>
            <p className="text-xs text-white/50 max-w-[240px] mb-5 leading-relaxed">
              {currentStream ? `No active livestream detected for ${channelName}.` : 'No channel selected.'}
            </p>
            {currentStream && (
              <button
                onClick={handlePopout}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-2 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in YouTube Popout</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer helper note */}
      <div className="p-3 bg-[#070b14] border-t border-white/[0.06] text-[11px] text-white/40 flex items-center justify-between">
        <span>Logged into YouTube for live chatting</span>
        <button
          onClick={handlePopout}
          className="text-blue-400 hover:underline flex items-center gap-1 font-medium"
        >
          Pop-out
        </button>
      </div>
    </aside>
  );
}
