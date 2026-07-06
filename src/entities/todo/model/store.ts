import { useSyncExternalStore } from 'react';

export type TodoTask = {
  id: string;
  text: string;
  done: boolean;
};

type TodoState = {
  tasks: TodoTask[];
};

const STORAGE_KEY = 'catodoro-todos';

function loadTasks(): TodoTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(
      (t): t is TodoTask =>
        typeof t?.id === 'string' &&
        typeof t?.text === 'string' &&
        typeof t?.done === 'boolean',
    );
  } catch {
    return [];
  }
}

let state: TodoState = { tasks: loadTasks() };
const listeners = new Set<() => void>();

function setState(tasks: TodoTask[]) {
  state = { tasks };
  listeners.forEach((listener) => listener());
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    /* storage unavailable */
  }
}

function sortTasks(tasks: TodoTask[]): TodoTask[] {
  return [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)];
}

export const todoStore = {
  addTask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setState(
      sortTasks([
        ...state.tasks,
        { id: crypto.randomUUID(), text: trimmed, done: false },
      ]),
    );
  },
  toggleTask(id: string) {
    setState(
      sortTasks(
        state.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
      ),
    );
  },
  clearCompleted() {
    setState(state.tasks.filter((t) => !t.done));
  },
  updateTask(id: string, text: string) {
    setState(state.tasks.map((t) => (t.id === id ? { ...t, text } : t)));
  },
  removeTask(id: string) {
    setState(state.tasks.filter((t) => t.id !== id));
  },
  getState: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
};

export function useTodos(): TodoState {
  return useSyncExternalStore(todoStore.subscribe, todoStore.getState);
}
