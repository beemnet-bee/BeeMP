export interface PlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

export type RepeatMode = 'none' | 'one' | 'all';
export type VisualizerType = 'bars' | 'wave' | 'circle' | 'honeycomb';

export interface MediaItem {
  id: string;
  name: string;
  src: string;
  type: 'audio' | 'video';
  artist?: string;
  song?: string;
}

export interface SearchResultItem {
  song: string;
  artist: string;
  album?: string;
  year?: number;
  previewUrl?: string;
  albumArtUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  items: MediaItem[];
}