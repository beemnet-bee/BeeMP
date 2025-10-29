import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import MediaPlayer from './components/MediaPlayer';
import VideoPlayer from './components/VideoPlayer';
import Queue from './components/Queue';
import History from './components/History';
import Logo from './components/Logo';
import LyricsDisplay from './components/LyricsDisplay';
import PlaylistManager from './components/PlaylistManager';
import { UploadCloud, ListMusic, History as HistoryIcon, FolderKanban } from 'lucide-react';
import { MediaItem, Playlist, RepeatMode } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

type ActiveTab = 'playlists' | 'queue' | 'history';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('bee-playlists', []);
  const [activePlaylistId, setActivePlaylistId] = useLocalStorage<string | null>('bee-active-playlist-id', null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [history, setHistory] = useLocalStorage<MediaItem[]>('bee-history', []);
  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [autoplayNext, setAutoplayNext] = useState(false);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLyricsLoading, setIsLyricsLoading] = useState(false);
  const [lyricsError, setLyricsError] = useState<string | null>(null);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState(false);

  // Custom Cursor Effect
  useEffect(() => {
    const cursorDot = document.querySelector('.cursor-dot') as HTMLElement;
    const cursorOutline = document.querySelector('.cursor-outline') as HTMLElement;
    let mouseX = 0, mouseY = 0;
    let posX = 0, posY = 0;
    let animationFrame: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', onMouseMove);
    
    const animateCursor = () => {
      // Increased interpolation factor from 0.1 to 0.2 for a faster, more responsive trail
      posX += (mouseX - posX) * 0.2;
      posY += (mouseY - posY) * 0.2;
      cursorDot.style.left = `${mouseX}px`;
      cursorDot.style.top = `${mouseY}px`;
      cursorOutline.style.left = `${posX}px`;
      cursorOutline.style.top = `${posY}px`;
      animationFrame = requestAnimationFrame(animateCursor);
    };
    
    const startAnimation = () => {
      cursorDot.style.opacity = '1';
      cursorOutline.style.opacity = '1';
      animateCursor();
    };
    startAnimation();

    const addHoverEffect = (e: Event) => document.body.classList.add('cursor-pointer-hover');
    const removeHoverEffect = (e: Event) => document.body.classList.remove('cursor-pointer-hover');
    const addActiveEffect = (e: Event) => document.body.classList.add('cursor-pointer-active');
    const removeActiveEffect = (e: Event) => document.body.classList.remove('cursor-pointer-active');

    const setupListeners = (root: Element | Document) => {
      const interactiveElements = root.querySelectorAll('a, button, input, [role="button"], [class*="cursor-pointer"]');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', addHoverEffect);
        el.addEventListener('mouseleave', removeHoverEffect);
        el.addEventListener('mousedown', addActiveEffect);
        el.addEventListener('mouseup', removeActiveEffect);
      });
    };

    setupListeners(document);

    // Observe for new elements being added to the DOM
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        setupListeners(node);
                    }
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      // Clean up listeners from all elements (though less critical with modern browsers)
      document.querySelectorAll('a, button, input, [role="button"], [class*="cursor-pointer"]').forEach(el => {
        el.removeEventListener('mouseenter', addHoverEffect);
        el.removeEventListener('mouseleave', removeHoverEffect);
        el.removeEventListener('mousedown', addActiveEffect);
        el.removeEventListener('mouseup', removeActiveEffect);
      });
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Initialize default playlist if none exist
  useEffect(() => {
    if (playlists.length === 0) {
      const defaultPlaylistId = crypto.randomUUID();
      const defaultPlaylist: Playlist = { id: defaultPlaylistId, name: 'My First Playlist', items: [] };
      setPlaylists([defaultPlaylist]);
      setActivePlaylistId(defaultPlaylistId);
    } else if (!activePlaylistId || !playlists.some(p => p.id === activePlaylistId)) {
      setActivePlaylistId(playlists[0]?.id || null);
    }
  }, [playlists, setPlaylists, activePlaylistId, setActivePlaylistId]);

  const activePlaylist = useMemo(() => playlists.find(p => p.id === activePlaylistId), [playlists, activePlaylistId]);

  const updateActivePlaylist = (items: MediaItem[]) => {
    if (!activePlaylist) return;
    const updatedPlaylist = { ...activePlaylist, items };
    setPlaylists(prev => prev.map(p => p.id === activePlaylist.id ? updatedPlaylist : p));
  };
  
  useEffect(() => {
    const fetchLyricsForCurrentTrack = async () => {
      if (currentTrackIndex === null || !activePlaylist) {
        setLyrics(null);
        setLyricsError(null);
        setIsLyricsLoading(false);
        return;
      }
  
      const currentItem = activePlaylist.items[currentTrackIndex];
      if (!currentItem) return;
  
      let artist, song;
  
      if (currentItem.artist && currentItem.song) {
        artist = currentItem.artist;
        song = currentItem.song;
      } else {
        const cleanedName = currentItem.name.replace(/\.[^/.]+$/, "");
        const parts = cleanedName.split(' - ');
        if (parts.length >= 2) {
          artist = parts[0].trim();
          song = parts.slice(1).join(' - ').trim();
        } else {
          setLyrics(null);
          setLyricsError("Could not determine artist and song from filename.");
          return;
        }
      }
  
      setIsLyricsLoading(true);
      setLyrics(null);
      setLyricsError(null);
  
      try {
        const response = await fetch(`https://lyrist.vercel.app/api/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`);
        if (!response.ok) {
          throw new Error(response.status === 404 ? 'Lyrics not found for this track.' : 'Failed to fetch lyrics.');
        }
        const data = await response.json();
        if (data.lyrics) setLyrics(data.lyrics);
        else throw new Error('Lyrics not found for this track.');
      } catch (err: any) {
        setLyricsError(err.message || 'An error occurred while fetching lyrics.');
      } finally {
        setIsLyricsLoading(false);
      }
    };
  
    fetchLyricsForCurrentTrack();
  }, [currentTrackIndex, activePlaylist]);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || !activePlaylist) return;

    const mediaFiles = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || file.type.startsWith('video/')
    );
    if (mediaFiles.length === 0) return alert('Please select valid audio or video files.');

    const newPlaylistItems: MediaItem[] = mediaFiles.map(file => ({
      id: crypto.randomUUID(),
      name: file.name,
      src: URL.createObjectURL(file),
      type: file.type.startsWith('audio/') ? 'audio' : 'video',
    }));

    const wasEmpty = activePlaylist.items.length === 0;
    updateActivePlaylist([...activePlaylist.items, ...newPlaylistItems]);
    setActiveTab('queue');

    if (wasEmpty && newPlaylistItems.length > 0) {
      setCurrentTrackIndex(0);
      setAutoplayNext(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    if(event.target) event.target.value = "";
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }, [activePlaylist]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleSelectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setAutoplayNext(true);
  };
  
  const handleNextTrack = useCallback(() => {
    if (!activePlaylist || currentTrackIndex === null) {
      setAutoplayNext(false);
      return;
    }
    
    const queue = activePlaylist.items;
    if (queue.length <= 1 && repeatMode !== 'all') {
      setAutoplayNext(false);
      return;
    }

    let nextIndex = -1;

    if (isShuffled) {
      if (queue.length > 1) {
        do {
          nextIndex = Math.floor(Math.random() * queue.length);
        } while (nextIndex === currentTrackIndex);
      }
    } else {
      if (currentTrackIndex < queue.length - 1) {
        nextIndex = currentTrackIndex + 1;
      } else if (repeatMode === 'all') {
        nextIndex = 0;
      }
    }

    if (nextIndex !== -1) {
      setCurrentTrackIndex(nextIndex);
      setAutoplayNext(true);
    } else {
      setAutoplayNext(false);
    }
  }, [activePlaylist, currentTrackIndex, isShuffled, repeatMode]);
  
  const handlePreviousTrack = () => {
    if (isShuffled) return;
    if (currentTrackIndex !== null && currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
      setAutoplayNext(true);
    }
  };

  const handleTrackPlayed = () => {
    if (autoplayNext) setAutoplayNext(false);
    if (activePlaylist && currentTrackIndex !== null) {
      const currentItem = activePlaylist.items[currentTrackIndex];
      if (currentItem && !history.some(h => h.id === currentItem.id)) {
        setHistory(prev => [currentItem, ...prev]);
      }
    }
  };

  const filteredQueue = useMemo(() => {
    if (!activePlaylist) return [];
    if (!localSearchQuery) return activePlaylist.items;
    return activePlaylist.items.filter(item => item.name.toLowerCase().includes(localSearchQuery.toLowerCase()));
  }, [activePlaylist, localSearchQuery]);

  const handlePlayFromHistory = (item: MediaItem) => {
    if (!activePlaylist) return;
    const indexInQueue = activePlaylist.items.findIndex(i => i.id === item.id);
    if (indexInQueue !== -1) {
        handleSelectTrack(indexInQueue);
    } else {
        updateActivePlaylist([item, ...activePlaylist.items]);
        handleSelectTrack(0);
    }
    setActiveTab('queue');
  };
  
  const handleReorderQueue = (reorderedItems: MediaItem[]) => {
    if (!activePlaylist) return;
    const currentItem = activePlaylist.items[currentTrackIndex!];
    updateActivePlaylist(reorderedItems);
    const newIndex = reorderedItems.findIndex(item => item.id === currentItem?.id);
    if (newIndex !== -1) {
        setCurrentTrackIndex(newIndex);
    }
  };
  
  const createPlaylist = () => {
    const newPlaylistName = `My Playlist ${playlists.length + 1}`;
    const newPlaylist: Playlist = {
        id: crypto.randomUUID(),
        name: newPlaylistName,
        items: []
    };
    setPlaylists([...playlists, newPlaylist]);
    setActivePlaylistId(newPlaylist.id);
    setActiveTab('queue');
  };

  const renamePlaylist = (id: string, newName: string) => {
    setPlaylists(playlists.map(p => p.id === id ? { ...p, name: newName } : p));
  };
  
  const deletePlaylist = (id: string) => {
    const newPlaylists = playlists.filter(p => p.id !== id);
    setPlaylists(newPlaylists);
    if (activePlaylistId === id) {
        setActivePlaylistId(newPlaylists[0]?.id || null);
        setCurrentTrackIndex(null);
    }
  };

  const toggleRepeatMode = () => {
    setRepeatMode(prev => {
        if (prev === 'none') return 'all';
        if (prev === 'all') return 'one';
        return 'none';
    });
  };

  const toggleShuffle = () => {
      setIsShuffled(prev => !prev);
  };

  const renderPlayer = () => {
    if (currentTrackIndex === null || !activePlaylist || !activePlaylist.items[currentTrackIndex]) return null;
    const currentItem = activePlaylist.items[currentTrackIndex];
    const commonProps = {
        name: currentItem.name,
        onNext: handleNextTrack,
        onPrevious: handlePreviousTrack,
        onEnded: handleNextTrack,
        onPlayed: handleTrackPlayed,
        hasNext: currentTrackIndex < activePlaylist.items.length - 1 || repeatMode === 'all' || isShuffled,
        hasPrevious: currentTrackIndex > 0,
        autoPlay: autoplayNext,
    };
    
    if (currentItem.type === 'video') {
      return <VideoPlayer {...commonProps} key="video-player" videoSrc={currentItem.src} repeatMode={repeatMode} />;
    }
    
    return (
      <MediaPlayer 
        {...commonProps} 
        key="audio-player" 
        audioSrc={currentItem.src}
        repeatMode={repeatMode}
        isShuffled={isShuffled}
        onRepeatModeChange={toggleRepeatMode}
        onShuffleToggle={toggleShuffle}
      />
    );
  };
  
  const TabButton = ({ tab, icon: Icon, label }: { tab: ActiveTab, icon: React.ElementType, label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-300 ${
        activeTab === tab 
          ? 'bg-amber-500 text-white shadow-md' 
          : 'text-slate-500 hover:bg-slate-200'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div className={`fixed inset-0 splash-gradient flex items-center justify-center z-50 transition-opacity duration-700 ${showSplash ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="text-center flex flex-col items-center space-y-4">
          <div className="animate-fadeInZoom" style={{ animationFillMode: 'forwards' }}><Logo /></div>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 animate-fadeInUp" style={{ animationDelay: '0.3s', opacity: 0, animationFillMode: 'forwards' }}>Bee Media Player</h1>
          <p className="text-slate-600 text-lg animate-fadeInUp" style={{ animationDelay: '0.6s', opacity: 0, animationFillMode: 'forwards' }}>Discover, upload, and enjoy your media.</p>
        </div>
      </div>

      <div className={`animated-gradient transition-opacity duration-500 ${showSplash ? 'opacity-0' : 'opacity-100'}`}>
        <div className="min-h-screen bg-sky-100/70 text-slate-800 flex flex-col items-center p-4 lg:p-8 font-sans backdrop-blur-3xl">
          <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8">
            <div className="lg:flex-1 w-full">
              <header className="text-center mb-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-400">Bee Media Player</h1>
                  <p className="text-slate-600 mt-2">Discover, upload, and enjoy your media.</p>
                </div>
              </header>

              <main 
                  className={`bg-white/60 rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 border-2 border-dashed ${isDragging ? 'border-amber-500' : 'border-transparent'}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="audio/*,video/*" multiple className="hidden"/>
                {activePlaylist && activePlaylist.items.length > 0 && currentTrackIndex !== null ? renderPlayer() : (
                  <div
                    className="border-2 border-dashed border-slate-400 rounded-xl p-8 text-center cursor-pointer transition-all duration-300 hover:border-amber-600 hover:bg-slate-200/50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <UploadCloud className="w-16 h-16 mb-4 text-amber-500" strokeWidth={1}/>
                      <h2 className="text-xl font-semibold text-slate-800">Click to upload or drag & drop</h2>
                      <p>Add to '{activePlaylist?.name || '...'}' playlist</p>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4 bg-slate-200 p-1 rounded-lg gap-1">
                    <TabButton tab="playlists" icon={FolderKanban} label="Playlists" />
                    <TabButton tab="queue" icon={ListMusic} label="Queue" />
                    <TabButton tab="history" icon={HistoryIcon} label="History" />
                  </div>

                  {activeTab === 'playlists' && (
                    <PlaylistManager 
                      playlists={playlists}
                      activePlaylistId={activePlaylistId}
                      onCreate={createPlaylist}
                      onRename={renamePlaylist}
                      onDelete={deletePlaylist}
                      onSelect={setActivePlaylistId}
                    />
                  )}

                  {(activeTab === 'queue' || activeTab === 'history') && (
                    <div className="relative mb-3">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                      <input 
                          type="text"
                          placeholder="Filter current list..."
                          value={localSearchQuery}
                          onChange={(e) => setLocalSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors placeholder-slate-400"
                      />
                    </div>
                  )}

                  {activeTab === 'queue' && activePlaylist && (
                    <Queue
                      items={filteredQueue}
                      currentIndex={currentTrackIndex !== null ? filteredQueue.findIndex(item => item.id === activePlaylist.items[currentTrackIndex!]?.id) : -1}
                      onSelectTrack={(index) => {
                          const originalIndex = activePlaylist.items.findIndex(item => item.id === filteredQueue[index].id);
                          if(originalIndex !== -1) handleSelectTrack(originalIndex);
                      }}
                      onReorder={handleReorderQueue}
                    />
                  )}
                  {activeTab === 'history' && (
                    <History 
                      historyItems={history}
                      onSelectTrack={handlePlayFromHistory}
                      localSearchQuery={localSearchQuery}
                    />
                  )}
                </div>

                {activePlaylist && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 w-full sm:w-auto mx-auto px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition-colors"
                    >
                      Add to '{activePlaylist.name}'
                    </button>
                  </div>
                )}
              </main>
              <footer className="text-center mt-8 text-slate-600 text-sm space-y-1">
                  <p>Made by Be'emnet &copy; 2025</p>
                  <p><a href="https://t.me/beemnetbee" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">@beemnetbee</a></p>
              </footer>
            </div>

            <div className="w-full lg:w-2/5 lg:sticky lg:top-8 self-start">
              <LyricsDisplay isLoading={isLyricsLoading} lyrics={lyrics} error={lyricsError} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;