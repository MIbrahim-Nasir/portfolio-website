export type Mode = 'home' | 'work' | 'craft' | 'path' | 'ping';

export type RoomTheme = {
  id: Mode;
  label: string;
  key: string;
  hint: string;
  bg: string;
  fog: string;
  accent: string;
  light: string;
  env: 'studio' | 'warehouse' | 'night' | 'sunset' | 'apartment' | 'city';
};

export const rooms: Record<Mode, RoomTheme> = {
  home: {
    id: 'home',
    label: 'Intro',
    key: '1',
    hint: 'Drag the core',
    bg: '#0b0d12',
    fog: '#e8eef4',
    accent: '#5b9bd4',
    light: '#dce8f8',
    env: 'studio',
  },
  work: {
    id: 'work',
    label: 'Work',
    key: '2',
    hint: 'Flick the deck',
    bg: '#090d12',
    fog: '#dce8f0',
    accent: '#7eb8d4',
    light: '#d7eef8',
    env: 'warehouse',
  },
  craft: {
    id: 'craft',
    label: 'Craft',
    key: '3',
    hint: 'Tap a cluster',
    bg: '#0b0e12',
    fog: '#e4eaf0',
    accent: '#5a8fb8',
    light: '#dce8f4',
    env: 'night',
  },
  path: {
    id: 'path',
    label: 'Path',
    key: '4',
    hint: 'Tap the spiral',
    bg: '#0c1016',
    fog: '#e6eef4',
    accent: '#7a9ec4',
    light: '#d7e6f4',
    env: 'city',
  },
  ping: {
    id: 'ping',
    label: 'Write',
    key: '5',
    hint: 'Send a note',
    bg: '#e6eaef',
    fog: '#1a1e24',
    accent: '#2f5f8a',
    light: '#ffffff',
    env: 'apartment',
  },
};

export const modeList: Mode[] = ['home', 'work', 'craft', 'path', 'ping'];
