'use client';

import { useEffect } from 'react';

const STATE_KEY = 'mtgcb:chunk-recovery';
const SCHEDULED_FLAG = '__mtgcbChunkScheduled';
const MAX_ATTEMPTS = 4;
const SCHEDULES = [0, 3000, 10000, 30000];

declare global {
  interface Window {
    __mtgcbChunkScheduled?: boolean;
  }
}

const CHUNK_ERROR_PATTERN =
  /Loading chunk \d+ failed|Failed to load chunk|ChunkLoadError|Loading CSS chunk \d+ failed|Failed to fetch dynamically imported module|module factory is not available/i;

function isChunkLoadError(value: unknown): boolean {
  if (!value) return false;
  if (typeof value === 'object') {
    const err = value as { name?: string; message?: string };
    if (err.name === 'ChunkLoadError') return true;
    if (typeof err.message === 'string' && CHUNK_ERROR_PATTERN.test(err.message)) return true;
  }
  if (typeof value === 'string' && CHUNK_ERROR_PATTERN.test(value)) return true;
  return false;
}

function readState(): { attempts: number } {
  try {
    const raw = window.sessionStorage.getItem(STATE_KEY);
    if (!raw) return { attempts: 0 };
    const parsed = JSON.parse(raw);
    return { attempts: parsed.attempts || 0 };
  } catch {
    return { attempts: 0 };
  }
}

function writeState(state: { attempts: number }): void {
  try {
    window.sessionStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch {}
}

export default function ChunkLoadErrorRecovery() {
  useEffect(() => {
    const triggerRecovery = () => {
      if (window[SCHEDULED_FLAG]) return;
      const state = readState();
      if (state.attempts >= MAX_ATTEMPTS) return;
      const delay = SCHEDULES[state.attempts] ?? SCHEDULES[SCHEDULES.length - 1];
      state.attempts += 1;
      writeState(state);
      window[SCHEDULED_FLAG] = true;
      window.setTimeout(() => {
        try {
          window.sessionStorage.setItem('mtgcb:chunk-our-reload', '1');
        } catch {}
        window.location.reload();
      }, delay);
    };

    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error ?? event.message)) triggerRecovery();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) triggerRecovery();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return null;
}
