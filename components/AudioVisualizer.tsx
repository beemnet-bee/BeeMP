import React, { useRef, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { VisualizerType } from '../types';
import { BarChartHorizontal, Waves, CircleDot, Hexagon } from 'lucide-react';
import { drawBars } from './visualizers/Bars';
import { drawWave } from './visualizers/Wave';
import { drawCircle } from './visualizers/Circle';
import { drawHoneycomb } from './visualizers/Honeycomb';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  onClick?: () => void;
}

const visualizers: Record<VisualizerType, (ctx: CanvasRenderingContext2D, dataArray: Uint8Array, bufferLength: number, width: number, height: number) => void> = {
  bars: drawBars,
  wave: drawWave,
  circle: drawCircle,
  honeycomb: drawHoneycomb,
};

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ analyser, isPlaying, onClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [visualizerType, setVisualizerType] = useLocalStorage<VisualizerType>('bee-visualizer-type', 'bars');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const isWave = visualizerType === 'wave';
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);

      if (isWave) {
        analyser.getByteTimeDomainData(dataArray);
      } else {
        analyser.getByteFrequencyData(dataArray);
      }
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      visualizers[visualizerType](canvasCtx, dataArray, bufferLength, canvas.width, canvas.height);
    };

    if (isPlaying) {
      draw();
    } else {
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyser, isPlaying, visualizerType]);

  const VisualizerButton = ({ type, icon: Icon }: { type: VisualizerType, icon: React.ElementType }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setVisualizerType(type);
      }}
      className={`p-2 rounded-md transition-colors ${visualizerType === type ? 'bg-amber-500 text-white' : 'bg-slate-300/50 text-slate-600 hover:bg-slate-300'}`}
      title={type.charAt(0).toUpperCase() + type.slice(1)}
    >
      <Icon className="w-5 h-5" />
    </button>
  );

  return (
    <div className="relative">
        <div className="absolute top-2 left-2 z-10 flex items-center space-x-1 bg-white/30 backdrop-blur-sm p-1 rounded-lg">
            <VisualizerButton type="bars" icon={BarChartHorizontal} />
            <VisualizerButton type="wave" icon={Waves} />
            <VisualizerButton type="circle" icon={CircleDot} />
            <VisualizerButton type="honeycomb" icon={Hexagon} />
        </div>
        <canvas 
            ref={canvasRef} 
            width="600" 
            height="120" 
            onClick={onClick} 
            className="w-full rounded-lg cursor-pointer bg-slate-200/50" 
        />
    </div>
  );
};

export default AudioVisualizer;