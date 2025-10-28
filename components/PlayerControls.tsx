import React from 'react';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Shuffle, Repeat, Repeat1 } from 'lucide-react';
import { RepeatMode } from '../types';

interface PlayerControlsProps {
  isPlaying: boolean;
  volume: number;
  onPlayPause: () => void;
  onVolumeChange: (volume: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  onRepeatModeChange: () => void;
  onShuffleToggle: () => void;
}

const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  volume,
  onPlayPause,
  onVolumeChange,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  repeatMode,
  isShuffled,
  onRepeatModeChange,
  onShuffleToggle,
}) => {
  const VolumeIcon = volume === 0 ? VolumeX : Volume2;
  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-2 sm:space-x-4 w-1/4">
        <VolumeIcon className="w-6 h-6 text-slate-500 flex-shrink-0" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer range-sm accent-amber-500"
          aria-label="Volume"
        />
      </div>

      <div className="flex items-center justify-center flex-grow space-x-2 sm:space-x-4">
        <button
          onClick={onShuffleToggle}
          className={`p-2 rounded-full hover:bg-black/10 transition-colors ${isShuffled ? 'text-amber-500' : 'text-slate-500'}`}
          aria-label="Shuffle"
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>
        <button
          onClick={onPrevious}
          disabled={!hasPrevious || isShuffled}
          className="p-2 text-slate-800 rounded-full hover:bg-black/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Previous Track"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        <button
          onClick={onPlayPause}
          className="p-3 bg-amber-500 text-white rounded-full shadow-lg hover:bg-amber-600 transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-100 focus:ring-amber-500"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
        </button>

        <button
          onClick={onNext}
          disabled={!hasNext}
          className="p-2 text-slate-800 rounded-full hover:bg-black/10 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          aria-label="Next Track"
        >
          <SkipForward className="w-6 h-6" />
        </button>
        <button
          onClick={onRepeatModeChange}
          className={`p-2 rounded-full hover:bg-black/10 transition-colors ${repeatMode !== 'none' ? 'text-amber-500' : 'text-slate-500'}`}
          aria-label="Repeat"
          title={`Repeat: ${repeatMode.charAt(0).toUpperCase() + repeatMode.slice(1)}`}
        >
          <RepeatIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="w-1/4" />
    </div>
  );
};

export default PlayerControls;