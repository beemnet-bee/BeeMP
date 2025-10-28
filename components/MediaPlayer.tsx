import React, { useRef, useEffect } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import AudioVisualizer from './AudioVisualizer';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import { Music2, Download } from 'lucide-react';
import { RepeatMode } from '../types';

interface MediaPlayerProps {
  audioSrc: string;
  name: string;
  onNext: () => void;
  onPrevious: () => void;
  onEnded: () => void;
  onPlayed: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  autoPlay?: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  onRepeatModeChange: () => void;
  onShuffleToggle: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  audioSrc, 
  name,
  onNext,
  onPrevious,
  onEnded,
  onPlayed,
  hasNext,
  hasPrevious,
  autoPlay = false,
  repeatMode,
  isShuffled,
  onRepeatModeChange,
  onShuffleToggle,
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    playerState,
    togglePlayPause,
    handleVolumeChange,
    handleSeek,
    analyser,
  } = useAudioPlayer(audioRef, onEnded);

  useEffect(() => {
    if (audioRef.current) {
      if (audioRef.current.src !== audioSrc) {
        audioRef.current.src = audioSrc;
        audioRef.current.load();
      }
      audioRef.current.loop = repeatMode === 'one';
      if (autoPlay) {
          audioRef.current.play().catch(e => {
            if (e.name !== 'AbortError') {
              console.error("Autoplay was prevented.", e)
            }
          });
      }
    }
  }, [audioSrc, autoPlay, repeatMode]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = audioSrc;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4">
      <audio ref={audioRef} onPlay={onPlayed} preload="metadata" crossOrigin="anonymous" />
      <div className="flex items-center space-x-4 text-slate-600">
        <div className="p-3 bg-amber-500/20 rounded-lg">
          <Music2 className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-grow overflow-hidden">
          <p className="font-semibold text-slate-800 truncate" title={name}>{name}</p>
          <p className="text-sm text-slate-500">Now Playing</p>
        </div>
        {audioSrc.startsWith('blob:') && (
            <button onClick={handleDownload} title="Download" className="p-2 text-slate-500 hover:text-amber-500 rounded-full hover:bg-slate-200 transition-colors flex-shrink-0">
                <Download className="w-5 h-5" />
            </button>
        )}
      </div>
      
      <AudioVisualizer 
        analyser={analyser} 
        isPlaying={playerState.isPlaying} 
        onClick={togglePlayPause} 
      />
      
      <ProgressBar
        currentTime={playerState.currentTime}
        duration={playerState.duration}
        onSeek={handleSeek}
      />

      <PlayerControls
        isPlaying={playerState.isPlaying}
        volume={playerState.volume}
        onPlayPause={togglePlayPause}
        onVolumeChange={handleVolumeChange}
        onNext={onNext}
        onPrevious={onPrevious}
        hasNext={hasNext}
        hasPrevious={hasPrevious}
        repeatMode={repeatMode}
        isShuffled={isShuffled}
        onRepeatModeChange={onRepeatModeChange}
        onShuffleToggle={onShuffleToggle}
      />
    </div>
  );
};

export default MediaPlayer;