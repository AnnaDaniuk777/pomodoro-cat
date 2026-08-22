import { useRef, useSyncExternalStore } from 'react';

export type ExternalStore<S> = {
  subscribe: (listener: () => void) => () => void;
  getState: () => S;
};

export function useStoreSelector<S, T>(
  store: ExternalStore<S>,
  selector: (state: S) => T,
): T {
  const cache = useRef<{ source: S; value: T } | null>(null);

  const getSnapshot = () => {
    const source = store.getState();
    const cached = cache.current;
    if (cached && cached.source === source) return cached.value;

    const value = selector(source);
    if (cached && Object.is(cached.value, value)) {
      cache.current = { source, value: cached.value };
      return cached.value;
    }
    cache.current = { source, value };
    return value;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot);
}
