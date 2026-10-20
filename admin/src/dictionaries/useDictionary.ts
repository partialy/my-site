import { useEffect, useState } from 'react';
import { getDictionaryOptions, type DictItem } from '../api/dictionaries';

interface DictionaryState {
  items: DictItem[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
}

const emptyState: DictionaryState = { items: [], loading: false, loaded: false, error: null };
const cache = new Map<string, DictionaryState>();
const pending = new Map<string, Promise<void>>();
const listeners = new Map<string, Set<(state: DictionaryState) => void>>();
const versions = new Map<string, number>();

function snapshot(code: string): DictionaryState {
  return cache.get(code) ?? emptyState;
}

function publish(code: string, state: DictionaryState): void {
  cache.set(code, state);
  listeners.get(code)?.forEach((listener) => listener(state));
}

function load(code: string): Promise<void> {
  if (!code || snapshot(code).loaded) return Promise.resolve();
  const running = pending.get(code);
  if (running) return running;

  const version = versions.get(code) ?? 0;
  publish(code, { ...snapshot(code), loading: true, error: null });
  const task = getDictionaryOptions([code])
    .then((response) => {
      if (!response.success) throw new Error(response.msg);
      if ((versions.get(code) ?? 0) === version) {
        publish(code, { items: response.data[code]?.items ?? [], loading: false, loaded: true, error: null });
      }
    })
    .catch((error: unknown) => {
      if ((versions.get(code) ?? 0) === version) {
        publish(code, { ...snapshot(code), loading: false,
          error: error instanceof Error ? error.message : '字典加载失败' });
      }
    })
    .finally(() => {
      pending.delete(code);
      if ((versions.get(code) ?? 0) !== version && listeners.get(code)?.size) void load(code);
    });
  pending.set(code, task);
  return task;
}

export function invalidateDictionary(code: string): void {
  if (!code) return;
  versions.set(code, (versions.get(code) ?? 0) + 1);
  publish(code, emptyState);
  if (listeners.get(code)?.size) void load(code);
}

export function clearDictionaryCache(): void {
  for (const code of cache.keys()) versions.set(code, (versions.get(code) ?? 0) + 1);
  cache.clear();
}

export function useDictionary(code: string): DictionaryState {
  const [state, setState] = useState(() => snapshot(code));
  useEffect(() => {
    setState(snapshot(code));
    const group = listeners.get(code) ?? new Set<(next: DictionaryState) => void>();
    group.add(setState);
    listeners.set(code, group);
    void load(code);
    return () => {
      group.delete(setState);
      if (group.size === 0) listeners.delete(code);
    };
  }, [code]);
  return state;
}
