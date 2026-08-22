import React, { useState } from 'react';
import { 
  Tv, 
  Radio, 
  PlusCircle, 
  Search, 
  RefreshCw, 
  LayoutGrid, 
  Layers, 
  Volume2, 
  VolumeX, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function Navbar({ 
  liveCount, 
  onRefresh, 
  isRefreshing, 
  onOpenAddModal, 
  activeView, 
  setActiveView,
  selectedCount,
  searchQuery,
  setSearchQuery
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#0c1424]/90 backdrop-blur-xl transition-all">
      {/* Top Banner Notice */}
      <div className="border-b border-white/[0.05] bg-[#070b14] text-[12px] text-white/60">
        <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Stream Engine Active
            </span>
            <span className="text-white/20">|</span>
            <span className="hidden sm:inline text-white/50">
              Watch real-time YouTube streams & live comments together
            </span>
          </div>
          <div className="flex items-center gap-4 text-white/50">
            <span className="hidden md:inline">
              Multi-View Live Streaming & Chat Synchronization
            </span>
          </div>
        </div>
      </div>

      {/* Main Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center gap-6">
          <div 
            onClick={() => setActiveView('channels')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-tr from-red-600 via-rose-500 to-indigo-600 p-[2px] shadow-lg shadow-red-500/20 group-hover:shadow-red-500/40 transition-all duration-300">
              <div className="h-full w-full bg-[#0c1424] rounded-[10px] flex items-center justify-center">
                <Radio className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white font-display">
                  Multi<span className="text-gradient">Watch</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/30 text-red-400 uppercase tracking-wider">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-white/40 font-medium -mt-0.5 hidden sm:block">
                YouTube Multi-Stream Viewer
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="hidden lg:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveView('channels')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                activeView === 'channels' 
                  ? 'bg-white/10 text-white font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Channels List
            </button>
            <button
              onClick={() => setActiveView('player')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeView === 'player' 
                  ? 'bg-blue-600/20 border border-blue-500/40 text-blue-400 font-semibold' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Tv className="h-4 w-4" />
              Watch Room
              {selectedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] bg-blue-500 text-white font-bold">
                  {selectedCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search channel or filter (@handle, gaming, music)..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Refresh live status button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh live status from YouTube"
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white/70 hover:text-white hover:bg-white/[0.12] active:scale-95 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Add Channel Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 h-10 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Add Channel</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>
    </header>
  );
}
