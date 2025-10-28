import React, { useState, useRef } from 'react';
import { Play, Music2, Film, ListMusic, Download, GripVertical } from 'lucide-react';
import { MediaItem } from '../types';

interface QueueProps {
  items: MediaItem[];
  currentIndex: number;
  onSelectTrack: (index: number) => void;
  onReorder: (items: MediaItem[]) => void;
}

const Queue: React.FC<QueueProps> = ({ items, currentIndex, onSelectTrack, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragItemNode = useRef<HTMLLIElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    setDraggedIndex(index);
    dragItemNode.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    // Use a timeout to avoid the dragged element disappearing immediately
    setTimeout(() => {
      if (dragItemNode.current) {
        dragItemNode.current.classList.add('opacity-50');
      }
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    
    const newItems = [...items];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(targetIndex, 0, removed);
    
    onReorder(newItems);
    setDraggedIndex(targetIndex);
  };
  
  const handleDragEnd = () => {
    if (dragItemNode.current) {
      dragItemNode.current.classList.remove('opacity-50');
    }
    setDraggedIndex(null);
    dragItemNode.current = null;
  };

  if (items.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-slate-200 text-slate-500">
            <ListMusic className="w-12 h-12 mb-4" />
            <h3 className="font-semibold text-lg text-slate-700">Your Queue is Empty</h3>
            <p className="mt-1">Upload some files or add from search.</p>
        </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-200">
      <ul className="divide-y divide-slate-300">
        {items.map((item, index) => (
          <li 
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center justify-between p-2 pl-3 transition-all duration-300 group ${
              index === currentIndex 
              ? 'bg-amber-500/20 text-amber-500' 
              : 'text-slate-600 hover:bg-slate-300'
            } ${draggedIndex !== null ? 'cursor-grabbing' : 'cursor-grab'}`}
            title={item.name}
          >
            <div className="flex items-center space-x-2 overflow-hidden flex-grow">
              <GripVertical className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div 
                className="flex items-center space-x-3 overflow-hidden flex-grow"
                onClick={() => onSelectTrack(index)}
              >
                  {item.type === 'audio' 
                      ? <Music2 className="w-5 h-5 flex-shrink-0" /> 
                      : <Film className="w-5 h-5 flex-shrink-0" />
                  }
                  <span className={`font-medium truncate ${index === currentIndex ? 'text-slate-800' : ''}`}>{item.name}</span>
              </div>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {item.src.startsWith('blob:') && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        const link = document.createElement('a');
                        link.href = item.src;
                        link.download = item.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }}
                    className={`p-2 rounded-full transition-colors ${index === currentIndex ? 'text-amber-600 hover:bg-amber-100' : 'text-slate-500 hover:bg-slate-100'}`}
                    title="Download"
                >
                    <Download className="w-5 h-5" />
                </button>
              )}
              {index === currentIndex && (
                <Play className="w-5 h-5 flex-shrink-0 text-amber-500 fill-current" />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Queue;
