import React, { useRef, useEffect, useState } from 'react';
import { useVideoPlayer } from '../hooks/useVideoPlayer';
import VideoPlayerControls from './VideoPlayerControls';
import { Film, Download } from 'lucide-react';
import { RepeatMode } from '../types';

interface VideoPlayerProps {
  videoSrc: string;
  name: string;
  onNext: () => void;
  onPrevious: () => void;
  onEnded: () => void;
  onPlayed: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  autoPlay?: boolean;
  repeatMode: RepeatMode;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoSrc, 
  name,
  onNext,
  onPrevious,
  onEnded,
  onPlayed,
  hasNext,
  hasPrevious,
  autoPlay = false,
  repeatMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<number | null>(null);
  const [subtitleUrl, setSubtitleUrl] = useState<string | null>(null);
  const subtitleInputRef = useRef<HTMLInputElement>(null);
  
  const {
    playerState,
    togglePlayPause,
    handleVolumeChange,
    handleSeek,
    toggleFullscreen,
    toggleMute,
    handlePlaybackRateChange,
  } = useVideoPlayer(videoRef, containerRef, onEnded);

  useEffect(() => {
    setSubtitleUrl(null); // Reset subtitles when video changes
    if (videoRef.current) {
      if (videoRef.current.src !== videoSrc) {
        videoRef.current.src = videoSrc;
      }
      videoRef.current.loop = repeatMode === 'one';
      if (autoPlay) {
        videoRef.current.play().catch(e => console.error("Autoplay was prevented.", e));
      }
    }
  }, [videoSrc, autoPlay, repeatMode]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
        if (playerState.isPlaying) {
            setShowControls(false);
        }
    }, 3000);
  };
  
  const handleMouseLeave = () => {
    if (playerState.isPlaying) {
      setShowControls(false);
    }
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    }
  }, []);

  const handleSubtitleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (subtitleUrl) {
        URL.revokeObjectURL(subtitleUrl);
      }
      setSubtitleUrl(URL.createObjectURL(file));
    }
  };
  
  const handleSelectSubtitles = () => {
    subtitleInputRef.current?.click();
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = videoSrc;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-4 text-slate-600">
        <div className="p-3 bg-amber-500/20 rounded-lg">
          <Film className="w-6 h-6 text-amber-500" />
        </div>
        <div className="flex-grow overflow-hidden">
          <p className="font-semibold text-slate-800 truncate" title={name}>{name}</p>
          <p className="text-sm text-slate-500">Now Playing</p>
        </div>
        {videoSrc.startsWith('blob:') && (
            <button onClick={handleDownload} title="Download" className="p-2 text-slate-500 hover:text-amber-500 rounded-full hover:bg-slate-200 transition-colors flex-shrink-0">
                <Download className="w-5 h-5" />
            </button>
        )}
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <video 
            ref={videoRef} 
            src={videoSrc} 
            className="w-full h-full"
            onClick={togglePlayPause}
            onPlay={onPlayed}
        >
          {subtitleUrl && <track kind="subtitles" src={subtitleUrl} srcLang="en" label="English" default />}
        </video>
        <input type="file" ref={subtitleInputRef} onChange={handleSubtitleFileChange} accept=".vtt,.srt" className="hidden" />
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <VideoPlayerControls
            isPlaying={playerState.isPlaying}
            volume={playerState.volume}
            isMuted={playerState.isMuted}
            currentTime={playerState.currentTime}
            duration={playerState.duration}
            playbackRate={playerState.playbackRate}
            onPlayPause={togglePlayPause}
            onVolumeChange={handleVolumeChange}
            onSeek={handleSeek}
            onNext={onNext}
            onPrevious={onPrevious}
            onToggleFullscreen={toggleFullscreen}
            onToggleMute={toggleMute}
            onSelectSubtitles={handleSelectSubtitles}
            onPlaybackRateChange={handlePlaybackRateChange}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;