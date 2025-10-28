import React from 'react';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds) || timeInSeconds <= 0) return '00:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ currentTime, duration, onSeek }) => {
  return (
    <div className="flex items-center space-x-3">
      <span className="text-xs text-slate-500 font-mono w-12 text-center">{formatTime(currentTime)}</span>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer range-sm accent-amber-500"
        aria-label="Seek progress"
      />
      <span className="text-xs text-slate-500 font-mono w-12 text-center">{formatTime(duration)}</span>
    </div>
  );
};

export default ProgressBar;