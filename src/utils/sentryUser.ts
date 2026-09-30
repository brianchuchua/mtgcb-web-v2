import * as Sentry from '@sentry/nextjs';

export const syncSentryUser = (userId: number | undefined | null): void => {
  Sentry.setUser(userId ? { id: String(userId) } : null);
};
