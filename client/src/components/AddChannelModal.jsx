import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Search, 
  Radio, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

const POPULAR_SUGGESTIONS = [
  { handle: '@yaboiaddi', name: 'YaBoi Addi', category: 'Gaming' },
  { handle: '@MMegamind', name: 'M.Megamind', category: 'Entertainment' },
  { handle: '@LofiGirl', name: 'Lofi Girl', category: '24/7 Beats' },
  { handle: '@IGN', name: 'IGN', category: 'Gaming News' },
  { handle: '@GameSparks', name: 'Mobile Gaming', category: 'Gaming' }
];

export default function AddChannelModal({ isOpen, onClose, onAddChannel, existingHandles = [] }) {
  const [inputVal, setInputVal] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [previewInfo, setPreviewInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCheck = async (targetHandle) => {
    const raw = targetHandle || inputVal;
    if (!raw || !raw.trim()) {
      setErrorMsg('Please enter a YouTube handle, channel URL, or video URL');
      return;
    }

    setIsChecking(true);
    setErrorMsg('');
    setPreviewInfo(null);

    try {
      const res = await fetch(`/api/live/check?handle=${encodeURIComponent(raw.trim())}`);
      if (!res.ok) {
        throw new Error('Failed to resolve channel details');
      }
      const data = await res.json();
      setPreviewInfo(data);
    } catch (err) {
      setErrorMsg(err.message || 'Could not verify channel. Check the handle and try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!previewInfo) return;

    const newChannel = {
      id: previewInfo.identifier || inputVal.trim(),
      handle: previewInfo.identifier || inputVal.trim(),
      name: previewInfo.channelName || inputVal.trim(),
      category: 'Custom Streamer',
      description: previewInfo.title || '',
      isDefault: false
    };

    onAddChannel(newChannel, previewInfo);
    onClose();
    setInputVal('');
    setPreviewInfo(null);
  };

  const handleSelectSuggestion = (item) => {
    setInputVal(item.handle);
    handleCheck(item.handle);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-lg rounded-3xl bg-[#0c1424] border border-white/[0.12] p-6 shadow-2xl shadow-black/80 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-display">
              Add YouTube Channel
            </h2>
            <p className="text-xs text-white/50">
              Enter handle (@username), channel URL, or livestream link
            </p>
          </div>
        </div>

        {/* Search / Input Box */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/70 mb-2">
              YouTube Identifier or URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => {
                    setInputVal(e.target.value);
                    setErrorMsg('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCheck();
                  }}
                  placeholder="e.g. @MMegamind, @yaboiaddi, https://youtube.com/@..."
                  className="w-full h-11 px-3.5 rounded-xl bg-white/[0.06] border border-white/[0.12] text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                />
              </div>
              <button
                onClick={() => handleCheck()}
                disabled={isChecking || !inputVal.trim()}
                className="px-4 h-11 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all"
              >
                {isChecking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>Check</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Channel Preview Card if resolved */}
          {previewInfo && (
            <div className="p-4 rounded-2xl bg-white/[0.04] border border-blue-500/40 animate-fade-in">
              <div className="flex items-start gap-3">
                <img
                  src={previewInfo.channelAvatar}
                  alt={previewInfo.channelName}
                  className="h-12 w-12 rounded-full object-cover border border-white/20"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white truncate">
                      {previewInfo.channelName}
                    </h4>
                    {previewInfo.isLive ? (
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold flex items-center gap-1">
                        <Radio className="h-2.5 w-2.5 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-white/10 text-white/50 text-[10px] font-medium">
                        OFFLINE
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-blue-400 font-mono">
                    {previewInfo.identifier}
                  </p>
                  <p className="text-xs text-white/70 mt-1 line-clamp-2">
                    {previewInfo.title || 'Ready to stream'}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
                <button
                  onClick={handleConfirmAdd}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>Add to Multi-Watch</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">
              Popular Channels & Presets
            </label>
            <div className="flex flex-wrap gap-2">
              {POPULAR_SUGGESTIONS.map(s => {
                const isAdded = existingHandles.includes(s.handle.toLowerCase());
                return (
                  <button
                    key={s.handle}
                    onClick={() => handleSelectSuggestion(s)}
                    disabled={isAdded}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isAdded 
                        ? 'bg-white/[0.03] text-white/30 border border-white/[0.04] cursor-default' 
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-white/80 hover:text-white border border-white/[0.08]'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-white/40">{s.handle}</span>
                    {isAdded && <span className="text-[10px] text-emerald-400">✓ added</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
