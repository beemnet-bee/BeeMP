import React, { useState, useRef, useEffect } from 'react';
import { Playlist } from '../types';
import { FolderKanban, Plus, Trash2, Edit, Check } from 'lucide-react';

interface PlaylistManagerProps {
  playlists: Playlist[];
  activePlaylistId: string | null;
  onCreate: () => void;
  onRename: (id: string, newName: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

const PlaylistManager: React.FC<PlaylistManagerProps> = ({
  playlists,
  activePlaylistId,
  onCreate,
  onRename,
  onDelete,
  onSelect,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartRename = (playlist: Playlist) => {
    setEditingId(playlist.id);
    setTempName(playlist.name);
  };

  const handleFinishRename = (id: string) => {
    if (tempName.trim()) {
      onRename(id, tempName.trim());
    }
    setEditingId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === 'Enter') {
      handleFinishRename(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the playlist "${name}"?`)) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onCreate}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Create New Playlist
      </button>

      <div className="max-h-80 overflow-y-auto rounded-lg bg-slate-200 p-2 space-y-2">
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500">
            <FolderKanban className="w-12 h-12 mb-4" />
            <h3 className="font-semibold text-lg text-slate-700">No Playlists</h3>
            <p className="mt-1">Click the button above to create one.</p>
          </div>
        ) : (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              className={`flex items-center justify-between p-3 rounded-md transition-colors ${
                playlist.id === activePlaylistId
                  ? 'bg-amber-500/20 text-amber-600'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {editingId === playlist.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => handleFinishRename(playlist.id)}
                  onKeyDown={(e) => handleKeyDown(e, playlist.id)}
                  className="bg-white/80 text-slate-800 font-semibold px-2 py-1 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              ) : (
                <div 
                    className="flex items-center gap-3 overflow-hidden cursor-pointer flex-grow"
                    onClick={() => onSelect(playlist.id)}
                    onDoubleClick={() => handleStartRename(playlist)}
                >
                  <FolderKanban className="w-5 h-5 flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className={`font-semibold truncate ${playlist.id === activePlaylistId ? 'text-slate-800' : ''}`} title={playlist.name}>
                      {playlist.name}
                    </p>
                    <p className="text-sm text-slate-500">{playlist.items.length} track(s)</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                {editingId === playlist.id ? (
                    <button
                        onClick={() => handleFinishRename(playlist.id)}
                        className="p-2 rounded-full text-green-600 hover:bg-green-100 transition-colors"
                        title="Save name"
                    >
                        <Check className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        onClick={() => handleStartRename(playlist)}
                        className="p-2 rounded-full text-slate-500 hover:bg-slate-100 transition-colors"
                        title="Rename playlist"
                    >
                        <Edit className="w-5 h-5" />
                    </button>
                )}
                <button
                  onClick={() => handleDelete(playlist.id, playlist.name)}
                  disabled={playlists.length <= 1}
                  className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Delete playlist"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlaylistManager;
