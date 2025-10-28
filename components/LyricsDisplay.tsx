import React from 'react';
import { Loader2, Music4, ServerCrash } from 'lucide-react';

interface LyricsDisplayProps {
  isLoading: boolean;
  lyrics: string | null;
  error: string | null;
}

const LyricsDisplay: React.FC<LyricsDisplayProps> = ({ isLoading, lyrics, error }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-amber-500">
          <Loader2 className="w-10 h-10 animate-spin" />
          <p className="mt-4 text-slate-600">Fetching lyrics...</p>
        </div>
      );
    }

    if (error) {
      // Specific message for when lyrics are not found for a track
      if (error.includes('not found')) {
        return (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
            <Music4 className="w-12 h-12 mb-4" />
            <h3 className="font-semibold text-lg text-slate-700">Lyrics Not Available</h3>
            <p className="mt-1">Sorry, we couldn't find lyrics for this song.</p>
          </div>
        );
      }
      // Generic message for other fetching errors
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-500">
          <ServerCrash className="w-10 h-10 mb-2" />
          <p className="font-semibold">Could Not Load Lyrics</p>
          <p className="mt-1 text-sm">{error}</p>
        </div>
      );
    }

    if (lyrics) {
      return (
        <p className="whitespace-pre-wrap text-slate-700 text-base leading-relaxed">
            {lyrics}
        </p>
      );
    }

    // Default placeholder for when no track is playing or has been played
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-slate-500">
        <Music4 className="w-12 h-12 mb-4" />
        <h3 className="font-semibold text-lg text-slate-700">Live Lyrics</h3>
        <p className="mt-1">Lyrics for the current track will appear here.</p>
      </div>
    );
  };

  return (
    <div className="bg-white/60 rounded-2xl shadow-2xl p-6 md:p-8 min-h-[20rem]">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b-2 border-slate-200 pb-2">
        Lyrics
      </h2>
      <div className="max-h-[60vh] lg:max-h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {renderContent()}
      </div>
    </div>
  );
};

export default LyricsDisplay;
