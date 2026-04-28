'use client';

import { useSnackbar } from 'notistack';
import { useEffect } from 'react';

const RELOAD_FLAG_KEY = 'mtgcb:chunk-reload';
const RELOAD_COOLDOWN_MS = 60_000;
const RELOAD_DELAY_MS = 1500;

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

function recentlyReloaded(): boolean {
  try {
    const last = window.sessionStorage.getItem(RELOAD_FLAG_KEY);
    if (!last) return false;
    return Date.now() - Number(last) < RELOAD_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markReload(): void {
  try {
    window.sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()));
  } catch {
    // sessionStorage unavailable — recovery proceeds without loop guard
  }
}

export default function ChunkLoadErrorRecovery() {
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    let recovering = false;

    const triggerRecovery = () => {
      if (recovering || recentlyReloaded()) return;
      recovering = true;
      markReload();
      enqueueSnackbar('A new version is available. Reloading...', {
        variant: 'info',
        autoHideDuration: RELOAD_DELAY_MS,
      });
      window.setTimeout(() => window.location.reload(), RELOAD_DELAY_MS);
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
  }, [enqueueSnackbar]);

  return null;
}
