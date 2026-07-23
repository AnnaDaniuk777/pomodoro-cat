import { useSyncExternalStore } from 'react';

export type Lang = 'en' | 'ru';

const translations = {
  en: {
    settingsTitle: 'Settings',
    workMin: 'Work, min',
    breakMin: 'Break, min',
    longBreak: 'Long break, min',
    sessions: 'Sessions',
    autoNext: 'Auto next',
    sound: 'Sound',
    volume: 'Volume',
    notify: 'Notify',
    onTop: 'Always on top',
    repeat: 'Repeat playlist',
    language: 'Language',
    newTask: 'NEW TASK...',
    left: 'LEFT',
    clearDone: 'CLEAR DONE',
    workEnd: 'Session done, break time!',
    workEndLong: 'Session done, time for a long break!',
    breakEndAuto: 'Break over, back to work!',
    breakEnd: 'Break over!',
  },
  ru: {
    settingsTitle: 'Настройки',
    workMin: 'Работа, мин',
    breakMin: 'Перерыв, мин',
    longBreak: 'Долгий, мин',
    sessions: 'Сессий',
    autoNext: 'Авто-цикл',
    sound: 'Звук',
    volume: 'Громкость',
    notify: 'Уведомления',
    onTop: 'Поверх всех окон',
    repeat: 'Повтор плейлиста',
    language: 'Язык',
    newTask: 'НОВАЯ ЗАДАЧА...',
    left: 'ОСТАЛОСЬ',
    clearDone: 'УБРАТЬ СДЕЛАННЫЕ',
    workEnd: 'Сессия окончена, перерыв!',
    workEndLong: 'Сессия окончена, время долгого перерыва!',
    breakEndAuto: 'Перерыв окончен, за работу!',
    breakEnd: 'Перерыв окончен!',
  },
} as const;

export type TranslationKey = keyof (typeof translations)['en'];

const STORAGE_KEY = 'catodoro-lang';

function loadLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'ru' ? 'ru' : 'en';
  } catch {
    return 'en';
  }
}

let lang: Lang = loadLang();
const listeners = new Set<() => void>();

export const i18n = {
  getLang: () => lang,
  setLang(next: Lang) {
    lang = next;
    listeners.forEach((listener) => listener());
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
  },
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function t(key: TranslationKey): string {
  return translations[lang][key];
}

export function useLang(): Lang {
  return useSyncExternalStore(i18n.subscribe, i18n.getLang);
}
