import { useState, useEffect, useCallback, useRef, RefObject } from 'react';
import { PlayerState } from '../types';

export const useAudioPlayer = (
  audioRef: RefObject<HTMLAudioElement>,
  onEnded: () => void
) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 0.75,
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const setupAudioContext = useCallback(() => {
    if (audioRef.current && !audioContextRef.current) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        // Check if source already exists for this element
        if (!sourceRef.current || sourceRef.current.mediaElement !== audioRef.current) {
          const source = audioContext.createMediaElementSource(audioRef.current);
          sourceRef.current = source;
          source.connect(analyser);
        }
        
        analyser.connect(audioContext.destination);
    }
  }, [audioRef]);

  const togglePlayPause = useCallback(() => {
    if (!audioContextRef.current) {
      setupAudioContext();
    }
    
    const audio = audioRef.current;
    if (audio) {
      if (audio.paused) {
        audioContextRef.current?.resume();
        audio.play().catch(e => console.error("Playback was prevented", e));
      } else {
        audio.pause();
      }
    }
  }, [audioRef, setupAudioContext]);

  const handleVolumeChange = useCallback((volume: number) => {
    setPlayerState((prev) => {
      if (audioRef.current) {
        audioRef.current.volume = volume;
      }
      return { ...prev, volume };
    });
  }, [audioRef]);
  
  const handleSeek = useCallback((time: number) => {
    setPlayerState((prev) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
      }
      return { ...prev, currentTime: time };
    });
  }, [audioRef]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const setAudioData = () => {
      setPlayerState((prev) => ({
        ...prev,
        duration: audio.duration || 0,
        currentTime: audio.currentTime,
      }));
    };

    const handleTimeUpdate = () => {
      if (!audio.seeking) {
        setPlayerState((prev) => ({ ...prev, currentTime: audio.currentTime }));
      }
    };

    const handleEnded = () => {
      // isPlaying will be set to false by the 'pause' event that fires after 'ended'
      onEnded();
    };
    
    const handleCanPlay = () => {
        setPlayerState(prev => ({...prev, duration: audio.duration}))
    }
    
    const handlePlay = () => setPlayerState(prev => ({ ...prev, isPlaying: true }));
    const handlePause = () => setPlayerState(prev => ({ ...prev, isPlaying: false }));

    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);


    // Set initial volume
    audio.volume = playerState.volume;

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [audioRef, playerState.volume, onEnded]);

  return {
    playerState,
    togglePlayPause,
    handleVolumeChange,
    handleSeek,
    analyser: analyserRef.current,
  };
};
