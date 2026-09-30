import * as Sentry from '@sentry/nextjs';
import { syncSentryUser } from '@/utils/sentryUser';

/**
 * Runs through the real SDK so we check what actually lands on a captured event,
 * not just that setUser was called.
 */
describe('syncSentryUser', () => {
  const users: unknown[] = [];

  beforeAll(() => {
    Sentry.init({
      dsn: 'https://public@o0.ingest.sentry.io/0',
      // jsdom has no Performance timeline for web-vitals; tracing is irrelevant here.
      integrations: (defaults) => defaults.filter((integration) => integration.name !== 'BrowserTracing'),
      beforeSend: (event) => {
        users.push(event.user);
        return null;
      },
    });
  });

  afterAll(() => Sentry.close());

  beforeEach(() => {
    users.length = 0;
  });

  const captureAndReadUser = async () => {
    Sentry.captureException(new Error('test'));
    await Sentry.flush(1000);
    return users[0];
  };

  it('attaches only the numeric id, as a string, once a user is logged in', async () => {
    syncSentryUser(1337);

    expect(await captureAndReadUser()).toEqual({ id: '1337' });
  });

  it('removes the user after logout', async () => {
    syncSentryUser(1337);
    syncSentryUser(undefined);

    // Sentry represents a cleared user as an object with every field undefined.
    expect((await captureAndReadUser()) as { id?: string } | undefined).not.toHaveProperty('id', expect.anything());
  });
});
