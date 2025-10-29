import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { SearchResultItem } from '../types';
import { Search as SearchIcon, Music2, Loader2, ServerCrash, Play, Youtube, Plus, KeyRound } from 'lucide-react';

interface SearchProps {
    onPlayPreview: (item: SearchResultItem) => void;
    onAddToQueue: (item: SearchResultItem) => void;
}

// Fix: Use a named interface `AIStudio` for `window.aistudio` to resolve declaration conflicts
// with other global type definitions, as indicated by the TypeScript error.
// The interface itself does not need to be global.
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}
declare global {
    interface Window {
        aistudio: AIStudio;
    }
}

const Search: React.FC<SearchProps> = ({ onPlayPreview, onAddToQueue }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [isKeySelected, setIsKeySelected] = useState(false);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio) {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setIsKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const handleSelectKey = async () => {
        if (window.aistudio) {
            try {
                await window.aistudio.openSelectKey();
                // To avoid a race condition, assume the key is selected after the dialog is closed.
                setIsKeySelected(true);
                setError(null);
            } catch (e) {
                console.error("Error opening key selection:", e);
                setError("Could not open API key selection dialog.");
            }
        }
    };

    const fetchPreviews = async (tracks: SearchResultItem[]) => {
        setStatus("Finding playable previews...");
        const enhancedTracks = await Promise.all(
          tracks.map(async (track) => {
            try {
              const searchTerm = encodeURIComponent(`${track.artist} ${track.song}`);
              const response = await fetch(
                `https://itunes.apple.com/search?term=${searchTerm}&entity=song&limit=1`
              );
              if (!response.ok) return track;

              const data = await response.json();
              if (data.results && data.results.length > 0) {
                const itunesTrack = data.results[0];
                return {
                  ...track,
                  previewUrl: itunesTrack.previewUrl,
                  albumArtUrl: itunesTrack.artworkUrl100?.replace('100x100', '200x200'),
                };
              }
            } catch (e) {
              console.error('Error fetching from iTunes API', e);
            }
            return track;
          })
        );
        setStatus(null);
        return enhancedTracks;
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setStatus("Searching for music...");
        setResults([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `For the user query "${query}", create a JSON object with a single key "tracks". The value should be an array of 5 song objects. Each object must have "song" (string), "artist" (string), "album" (string), and "year" (number) properties. Your response must only be the raw JSON object, without markdown formatting or other text.`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            tracks: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        song: { type: Type.STRING },
                                        artist: { type: Type.STRING },
                                        album: { type: Type.STRING },
                                        year: { type: Type.NUMBER },
                                    },
                                    required: ['song', 'artist', 'album', 'year'],
                                },
                            },
                        },
                        required: ['tracks'],
                    },
                },
            });
            
            let jsonText = response.text.trim();
        
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.slice(7, -3).trim();
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.slice(3, -3).trim();
            }
    
            const parsed = JSON.parse(jsonText);
            
            if (parsed && Array.isArray(parsed.tracks)) {
                const tracksWithPreviews = await fetchPreviews(parsed.tracks);
                setResults(tracksWithPreviews);
            } else {
                throw new Error("Invalid data structure received from API.");
            }

        } catch (err: any) {
            console.error("Error searching for music:", err);
            const errorMessage = err.message || '';
            if (errorMessage.includes("API key") || errorMessage.includes("not found")) {
                setError("Your API key may be invalid or missing permissions. Please select a valid key.");
                setIsKeySelected(false);
            } else {
                setError("Sorry, something went wrong while searching. Please try again.");
            }
        } finally {
            setIsLoading(false);
            setStatus(null);
        }
    };
    
    if (!isKeySelected) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-slate-200 text-slate-500">
                <KeyRound className="w-12 h-12 mb-4 text-amber-500" />
                <h3 className="font-semibold text-lg text-slate-700">API Key Required</h3>
                <p className="mt-1 mb-4 max-w-sm">To use the AI-powered music discovery, you need to provide a Google AI API key.</p>
                <p className="text-xs mb-4">Learn more about billing at <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline">ai.google.dev</a>.</p>
                <button
                    onClick={handleSelectKey}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                    <KeyRound className="w-4 h-4" />
                    Select API Key
                </button>
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
            </div>
        );
    }

    return (
        <>
            <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for a song, artist, or even a mood..."
                    className="w-full px-4 py-2 bg-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors placeholder-slate-400"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="p-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed"
                    disabled={isLoading}
                    aria-label="Search"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
                </button>
            </form>

            <div className="max-h-60 overflow-y-auto rounded-lg bg-slate-200 p-2 space-y-2">
                {(isLoading || status) && (
                    <div className="flex flex-col justify-center items-center p-8 text-amber-500">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        {status && <p className="mt-2 text-sm text-slate-600">{status}</p>}
                    </div>
                )}
                {error && !isLoading && (
                    <div className="flex flex-col items-center text-center p-8 text-red-500">
                        <ServerCrash className="w-10 h-10 mb-2" />
                        <p className="font-semibold">{error}</p>
                    </div>
                )}
                {!isLoading && !error && results.length === 0 && (
                     <div className="flex flex-col items-center justify-center text-center p-8 text-slate-500">
                        <SearchIcon className="w-12 h-12 mb-4" />
                        <h3 className="font-semibold text-lg text-slate-700">Discover New Music</h3>
                        <p className="mt-1">Search results will appear here.</p>
                    </div>
                )}
                {results.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-md bg-slate-50">
                        <div className="flex items-center gap-3 overflow-hidden">
                            {item.albumArtUrl ? (
                                <img src={item.albumArtUrl} alt={`${item.song} album art`} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
                            ) : (
                                <div className="w-12 h-12 rounded-md flex-shrink-0 bg-slate-300 flex items-center justify-center">
                                    <Music2 className="w-6 h-6 text-slate-500" />
                                </div>
                            )}
                            <div className="overflow-hidden">
                                <p className="font-bold text-slate-800 truncate" title={item.song}>{item.song}</p>
                                <p className="text-sm text-slate-500 truncate" title={`${item.artist} - ${item.album} (${item.year})`}>
                                  {item.artist} {item.album && `• ${item.album}`} {item.year && `(${item.year})`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                            <button
                                onClick={() => onAddToQueue(item)}
                                disabled={!item.previewUrl}
                                className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                                title={item.previewUrl ? `Add preview to queue` : 'No preview available'}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onPlayPreview(item)}
                                disabled={!item.previewUrl}
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                                aria-label={`Listen to preview of ${item.song}`}
                                title={item.previewUrl ? `Listen to a preview of ${item.song}` : 'No preview available'}
                            >
                                <Play className="w-4 h-4" />
                            </button>
                             <a
                                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${item.artist} ${item.song}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                aria-label={`Find full song ${item.song} on YouTube`}
                                title={`Find ${item.song} on YouTube`}
                            >
                                <Youtube className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
};

export default Search;