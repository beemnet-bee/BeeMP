import { useState, useEffect, useCallback, RefObject } from 'react';

interface VideoPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
}

export const useVideoPlayer = (
  videoRef: RefObject<HTMLVideoElement>,
  containerRef: RefObject<HTMLDivElement>,
  onEnded: () => void
) => {
  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.75,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1,
  });

  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (video) {
        if (video.paused) {
            video.play().catch(e => console.error("Playback was prevented", e));
        } else {
            video.pause();
        }
    }
  }, [videoRef]);

  const handleVolumeChange = useCallback((volume: number) => {
    setPlayerState((prev) => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = volume === 0;
      }
      return { ...prev, volume, isMuted: volume === 0 };
    });
  }, [videoRef]);

  const toggleMute = useCallback(() => {
    setPlayerState((prev) => {
      const newMutedState = !prev.isMuted;
      if (videoRef.current) {
        videoRef.current.muted = newMutedState;
      }
      return { ...prev, isMuted: newMutedState };
    });
  }, [videoRef]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setPlayerState((prev) => ({ ...prev, currentTime: time }));
    }
  }, [videoRef]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
        container.requestFullscreen().catch(err => {
            alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
        });
    } else {
        document.exitFullscreen();
    }
  }, [containerRef]);
  
  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (videoRef.current) {
        videoRef.current.playbackRate = rate;
    }
    setPlayerState(prev => ({ ...prev, playbackRate: rate }));
  }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const setVideoData = () => setPlayerState(prev => ({ ...prev, duration: video.duration || 0 }));
    const handleTimeUpdate = () => setPlayerState(prev => ({ ...prev, currentTime: video.currentTime }));
    const handleEnded = () => {
        // isPlaying will be set to false by the 'pause' event
        onEnded();
    };
    const handlePlay = () => setPlayerState(prev => ({...prev, isPlaying: true}));
    const handlePause = () => setPlayerState(prev => ({...prev, isPlaying: false}));
    const handleVolume = () => setPlayerState(prev => ({...prev, volume: video.volume, isMuted: video.muted}));

    video.addEventListener('loadedmetadata', setVideoData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolume);
    
    video.volume = playerState.volume;
    video.muted = playerState.isMuted;
    video.playbackRate = playerState.playbackRate;

    return () => {
      video.removeEventListener('loadedmetadata', setVideoData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('volumechange', handleVolume);
    };
  }, [videoRef, playerState.volume, playerState.isMuted, playerState.playbackRate, onEnded]);
  
  useEffect(() => {
    const handleFullscreenChange = () => {
        setPlayerState(prev => ({...prev, isFullscreen: !!document.fullscreenElement}))
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return {
    playerState,
    togglePlayPause,
    handleVolumeChange,
    handleSeek,
    toggleFullscreen,
    toggleMute,
    handlePlaybackRateChange,
  };
};