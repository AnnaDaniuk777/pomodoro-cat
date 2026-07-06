import { useSyncExternalStore } from 'react';

export type Track = {
  name: string;
  url: string;
};

export type PlayerState = {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  repeatPlaylist: boolean;
};

function loadRepeat(): boolean {
  try {
    return localStorage.getItem('catodoro-repeat') !== 'off';
  } catch {
    return true;
  }
}

let state: PlayerState = {
  tracks: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  repeatPlaylist: loadRepeat(),
};

const listeners = new Set<() => void>();
const audio = new Audio();
audio.volume = state.volume;

function setState(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

audio.addEventListener('timeupdate', () => {
  setState({ currentTime: audio.currentTime });
});
audio.addEventListener('loadedmetadata', () => {
  setState({ duration: audio.duration });
});
audio.addEventListener('ended', () => {
  const isLast = state.currentIndex === state.tracks.length - 1;
  if (isLast && !state.repeatPlaylist) {
    setState({ isPlaying: false, currentTime: 0 });
    return;
  }
  playerStore.next();
});

export const playerStore = {
  addFiles(files: File[]) {
    const added = files.map((file) => ({
      name: file.name.replace(/\.[^.]+$/, ''),
      url: URL.createObjectURL(file),
    }));
    const tracks = [...state.tracks, ...added];
    const patch: Partial<PlayerState> = { tracks };
    if (state.currentIndex === -1 && tracks.length > 0) {
      patch.currentIndex = 0;
    }
    setState(patch);
  },
  addTrackFromData(name: string, data: Uint8Array) {
    const url = URL.createObjectURL(new Blob([data as BlobPart]));
    const tracks = [...state.tracks, { name, url }];
    const patch: Partial<PlayerState> = { tracks };
    if (state.currentIndex === -1) {
      patch.currentIndex = tracks.length - 1;
    }
    setState(patch);
  },
  removeTrack(index: number) {
    const track = state.tracks[index];
    if (!track) return;
    const wasCurrent = index === state.currentIndex;
    if (wasCurrent) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    URL.revokeObjectURL(track.url);
    const tracks = state.tracks.filter((_, i) => i !== index);
    const patch: Partial<PlayerState> = { tracks };
    if (wasCurrent) {
      patch.isPlaying = false;
      patch.currentTime = 0;
      patch.duration = 0;
      patch.currentIndex = tracks.length > 0 ? Math.min(index, tracks.length - 1) : -1;
    } else if (index < state.currentIndex) {
      patch.currentIndex = state.currentIndex - 1;
    }
    setState(patch);
  },
  play(index: number) {
    const track = state.tracks[index];
    if (!track) return;
    if (audio.src !== track.url) {
      audio.src = track.url;
      setState({ currentTime: 0, duration: 0 });
    }
    void audio.play().catch(() => {});
    setState({ currentIndex: index, isPlaying: true });
  },
  toggle() {
    if (state.tracks.length === 0) return;
    if (state.currentIndex === -1 || !audio.src) {
      this.play(Math.max(0, state.currentIndex));
      return;
    }
    if (audio.paused) {
      void audio.play().catch(() => {});
      setState({ isPlaying: true });
    } else {
      audio.pause();
      setState({ isPlaying: false });
    }
  },
  next() {
    if (state.tracks.length === 0) return;
    this.play((state.currentIndex + 1) % state.tracks.length);
  },
  prev() {
    if (state.tracks.length === 0) return;
    this.play(
      (state.currentIndex - 1 + state.tracks.length) % state.tracks.length,
    );
  },
  seek(time: number) {
    if (!audio.src) return;
    audio.currentTime = time;
    setState({ currentTime: time });
  },
  setVolume(volume: number) {
    const clamped = Math.min(1, Math.max(0, volume));
    audio.volume = clamped;
    setState({ volume: clamped });
  },
  toggleRepeat() {
    const next = !state.repeatPlaylist;
    setState({ repeatPlaylist: next });
    try {
      localStorage.setItem('catodoro-repeat', next ? 'on' : 'off');
    } catch {
      /* storage unavailable */
    }
  },
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function usePlayer(): PlayerState {
  return useSyncExternalStore(playerStore.subscribe, playerStore.getState);
}
