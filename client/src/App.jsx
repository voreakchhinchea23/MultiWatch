import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import ChannelSelector from './components/ChannelSelector';
import MultiStreamViewer from './components/MultiStreamViewer';
import AddChannelModal from './components/AddChannelModal';
import Footer from './components/Footer';
import { getSavedChannels, saveChannels, INITIAL_DEFAULT_CHANNELS } from './utils/storage';

export default function App() {
  const [channels, setChannels] = useState([]);
  const [channelsInfo, setChannelsInfo] = useState({});
  const [selectedHandles, setSelectedHandles] = useState([]);
  const [activeHandles, setActiveHandles] = useState([]);
  const [activeView, setActiveView] = useState('channels'); // 'channels' | 'player'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved channels from backend file (server/channels.json) with localStorage fallback
  useEffect(() => {
    async function loadChannels() {
      try {
        const res = await fetch('/api/channels');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setChannels(data);
            saveChannels(data);
            return;
          }
        }
      } catch (e) {
        console.warn('Backend channels API not reached, using local storage fallback');
      }
      // Fallback to localStorage
      const local = getSavedChannels();
      setChannels(local);
    }

    loadChannels();
  }, []);

  // Fetch live info for all channels
  const refreshChannelsInfo = useCallback(async (channelList = channels) => {
    if (!channelList || channelList.length === 0) return;

    setIsRefreshing(true);
    try {
      const handles = channelList.map(c => c.handle);
      const res = await fetch('/api/live/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handles })
      });

      if (res.ok) {
        const results = await res.json();
        const infoMap = {};
        results.forEach(item => {
          if (item && item.identifier) {
            infoMap[item.identifier] = item;
            infoMap[item.identifier.toLowerCase()] = item;
            if (item.identifier.startsWith('@')) {
              infoMap[item.identifier.substring(1)] = item;
              infoMap[item.identifier.substring(1).toLowerCase()] = item;
            }
          }
        });
        setChannelsInfo(prev => ({ ...prev, ...infoMap }));
      }
    } catch (err) {
      console.error('Error fetching live info batch:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [channels]);

  // Initial fetch and periodic polling (every 45s)
  useEffect(() => {
    if (channels.length > 0) {
      refreshChannelsInfo(channels);
      const interval = setInterval(() => {
        refreshChannelsInfo(channels);
      }, 45000);
      return () => clearInterval(interval);
    }
  }, [channels.length, refreshChannelsInfo]);

  // Handle single channel selection toggle
  const handleToggleSelect = (handle) => {
    setSelectedHandles(prev => {
      if (prev.includes(handle)) {
        return prev.filter(h => h !== handle);
      } else {
        return [...prev, handle];
      }
    });
  };

  // Handle select all
  const handleSelectAll = (handles) => {
    setSelectedHandles(handles);
  };

  // Handle clear selection
  const handleClearSelection = () => {
    setSelectedHandles([]);
  };

  // Start watching selected channels
  const handleStartWatch = () => {
    if (selectedHandles.length === 0) return;
    setActiveHandles([...selectedHandles]);
    setActiveView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick single watch
  const handleQuickWatch = (handle) => {
    setActiveHandles([handle]);
    setActiveView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Remove a stream from multi-watch
  const handleRemoveStream = (handle) => {
    setActiveHandles(prev => {
      const filtered = prev.filter(h => h !== handle);
      if (filtered.length === 0) {
        setActiveView('channels');
      }
      return filtered;
    });
  };

  // Add a new custom channel (persists to server/channels.json and localStorage)
  const handleAddChannel = async (newChannel, previewData) => {
    const exists = channels.some(c => c.handle.toLowerCase() === newChannel.handle.toLowerCase());
    if (exists) return;

    const updated = [newChannel, ...channels];
    setChannels(updated);
    saveChannels(updated);

    // Save to server channels.json on disk
    try {
      await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newChannel)
      });
    } catch (e) {
      console.warn('Could not sync channel to server file', e);
    }

    if (previewData) {
      setChannelsInfo(prev => ({
        ...prev,
        [newChannel.handle]: previewData
      }));
    } else {
      refreshChannelsInfo(updated);
    }

    // Auto select the newly added channel
    setSelectedHandles(prev => [...prev, newChannel.handle]);
  };

  // Delete a custom channel (deletes from server/channels.json and localStorage)
  const handleDeleteChannel = async (handle) => {
    const updated = channels.filter(c => c.handle !== handle);
    setChannels(updated);
    saveChannels(updated);
    setSelectedHandles(prev => prev.filter(h => h !== handle));
    setActiveHandles(prev => prev.filter(h => h !== handle));

    // Delete from server channels.json on disk
    try {
      await fetch(`/api/channels/${encodeURIComponent(handle)}`, {
        method: 'DELETE'
      });
    } catch (e) {
      console.warn('Could not sync delete to server file', e);
    }
  };

  const liveCount = channels.filter(ch => channelsInfo[ch.handle]?.isLive).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100 selection:bg-blue-600/30 selection:text-white">
      {/* Navigation Bar */}
      <Navbar
        liveCount={liveCount}
        onRefresh={() => refreshChannelsInfo(channels)}
        isRefreshing={isRefreshing}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        selectedCount={selectedHandles.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeView === 'channels' ? (
          <ChannelSelector
            channels={channels}
            channelsInfo={channelsInfo}
            selectedHandles={selectedHandles}
            onToggleSelect={handleToggleSelect}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onStartWatch={handleStartWatch}
            onQuickWatch={handleQuickWatch}
            onDeleteChannel={handleDeleteChannel}
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onRefresh={() => refreshChannelsInfo(channels)}
            isRefreshing={isRefreshing}
            searchQuery={searchQuery}
          />
        ) : (
          <MultiStreamViewer
            activeHandles={activeHandles}
            channels={channels}
            channelsInfo={channelsInfo}
            onBackToChannels={() => setActiveView('channels')}
            onRemoveStream={handleRemoveStream}
            onAddStream={(handle) => setActiveHandles(prev => [...prev, handle])}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        )}
      </main>

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddChannel={handleAddChannel}
        existingHandles={channels.map(c => c.handle.toLowerCase())}
      />

      {/* Footer (shown in channel list mode) */}
      {activeView === 'channels' && <Footer />}
    </div>
  );
}
