import React from 'react';
import { Play, Music2, Film, History as HistoryIcon, Download } from 'lucide-react';
import { MediaItem } from '../types';

interface HistoryProps {
  historyItems: MediaItem[];
  onSelectTrack: (item: MediaItem) => void;
  localSearchQuery: string;
}

const History: React.FC<HistoryProps> = ({ historyItems, onSelectTrack, localSearchQuery }) => {
  const filteredHistory = historyItems
    .filter(item => item.name && item.name.toLowerCase().includes(localSearchQuery.toLowerCase()));

  if (filteredHistory.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-slate-200 text-slate-500">
            <HistoryIcon className="w-12 h-12 mb-4" />
            <h3 className="font-semibold text-lg text-slate-700">No History Yet</h3>
            <p className="mt-1">Play some tracks to see your history here.</p>
        </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-lg bg-slate-200">
      <ul className="divide-y divide-slate-300">
        {filteredHistory.map((item) => (
          <li 
            key={item.id}
            onClick={() => onSelectTrack(item)}
            className="flex items-center justify-between p-3 cursor-pointer transition-all duration-300 group hover:bg-slate-300 text-slate-600"
            title={item.name}
          >
            <div className="flex items-center space-x-3 overflow-hidden">
              {item.type === 'audio' 
                  ? <Music2 className="w-5 h-5 flex-shrink-0" /> 
                  : <Film className="w-5 h-5 flex-shrink-0" />
              }
              <span className="font-medium truncate">{item.name}</span>
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
                    className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                    title="Download"
                >
                    <Download className="w-5 h-5" />
                </button>
              )}
              <Play className="w-5 h-5 flex-shrink-0 text-transparent group-hover:text-amber-500 transition-colors" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default History;
