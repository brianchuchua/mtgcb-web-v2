'use client';

import CloseIcon from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { SnackbarKey, useSnackbar } from 'notistack';
import { useEffect, useRef } from 'react';

const POLL_INTERVAL_MS = 300_000;
const INITIAL_DELAY_MS = 30_000;
const VERSION_ENDPOINT = '/api/version';

export default function NewVersionAvailable() {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const notifiedRef = useRef(false);

  useEffect(() => {
    const baked = process.env.NEXT_PUBLIC_BUILD_SHA;
    if (!baked) return;

    let cancelled = false;

    const checkVersion = async () => {
      if (cancelled || notifiedRef.current) return;
      if (typeof document !== 'undefined' && document.hidden) return;

      try {
        const res = await fetch(VERSION_ENDPOINT, { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { version?: string };
        if (cancelled || notifiedRef.current) return;
        if (!data.version || data.version === baked) return;

        notifiedRef.current = true;
        enqueueSnackbar('A new version of MTG CB is available.', {
          variant: 'info',
          persist: true,
          action: (key: SnackbarKey) => (
            <>
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Reload
              </Button>
              <IconButton size="small" onClick={() => closeSnackbar(key)} sx={{ color: 'white' }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </>
          ),
        });
      } catch {
        // Network blip — silently retry on next interval.
      }
    };

    const initial = window.setTimeout(checkVersion, INITIAL_DELAY_MS);
    const interval = window.setInterval(checkVersion, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [enqueueSnackbar, closeSnackbar]);

  return null;
}
