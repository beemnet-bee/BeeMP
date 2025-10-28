import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize, Minimize, Captions } from 'lucide-react';

interface VideoPlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  playbackRate: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (time: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
  onToggleMute: () => void;
  onSelectSubtitles: () => void;
  onPlaybackRateChange: (rate: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds <= 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const VideoPlayerControls: React.FC<VideoPlayerControlsProps> = ({
  isPlaying, volume, isMuted, currentTime, duration, playbackRate,
  onPlayPause, onVolumeChange, onSeek, onNext, onPrevious, onToggleFullscreen, onToggleMute, onSelectSubtitles, onPlaybackRateChange,
  hasNext, hasPrevious
}) => {
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const speedMenuRef = useRef<HTMLDivElement>(null);
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2;
  const isFullscreen = !!document.fullscreenElement;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (speedMenuRef.current && !speedMenuRef.current.contains(event.target as Node)) {
            setShowSpeedMenu(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div 
        className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent"
        onClick={e => e.stopPropagation()}
    >
      {/* Progress Bar */}
      <div className="flex items-center space-x-2">
        <span className="text-xs text-white font-mono">{formatTime(currentTime)}</span>
        <input
            type="range" min="0" max={duration || 0} value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-amber-500"
            aria-label="Seek progress"
        />
        <span className="text-xs text-white font-mono">{formatTime(duration)}</span>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center space-x-2">
          <button onClick={onToggleMute} className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300">
            <VolumeIcon className="w-6 h-6" />
          </button>
          <input
            type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer range-sm accent-amber-500"
            aria-label="Volume"
          />
        </div>

        <div className="flex items-center space-x-4">
          <button onClick={onPrevious} disabled={!hasPrevious} className="p-2 text-white rounded-full hover:bg-white/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
            <SkipBack className="w-6 h-6" />
          </button>
          <button onClick={onPlayPause} className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all duration-300 transform hover:scale-110">
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
          </button>
          <button onClick={onNext} disabled={!hasNext} className="p-2 text-white rounded-full hover:bg-white/20 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed">
            <SkipForward className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
           <div className="relative" ref={speedMenuRef}>
              <button 
                onClick={() => setShowSpeedMenu(prev => !prev)} 
                className="p-2 w-12 text-sm text-white font-bold hover:bg-white/20 rounded-full transition-all duration-300"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full mb-2 right-1/2 translate-x-1/2 bg-black/80 rounded-lg p-1 flex flex-col items-center text-white">
                  {[2, 1.5, 1, 0.75, 0.5].map(rate => (
                    <button 
                      key={rate} 
                      onClick={() => { onPlaybackRateChange(rate); setShowSpeedMenu(false); }}
                      className={`px-3 py-1 text-sm rounded-md w-full hover:bg-white/20 ${playbackRate === rate ? 'bg-amber-500' : ''}`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
           </div>
           <button onClick={onSelectSubtitles} title="Load Subtitles (.vtt, .srt)" className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300">
            <Captions className="w-6 h-6" />
          </button>
          <button onClick={onToggleFullscreen} className="p-2 text-white hover:bg-white/20 rounded-full transition-all duration-300">
            {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerControls;