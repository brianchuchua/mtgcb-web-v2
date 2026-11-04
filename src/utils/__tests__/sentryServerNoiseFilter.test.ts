import type { ErrorEvent, EventHint } from '@sentry/nextjs';
import { filterServerSentryNoise } from '@/utils/sentryServerNoiseFilter';

const errorEvent = (message: string): ErrorEvent =>
  ({ type: undefined, exception: { values: [{ type: 'Error', value: message }] } }) as ErrorEvent;

describe('filterServerSentryNoise', () => {
  it('drops a visitor closing the page mid-render (MTGCB-WEB-V2-90)', () => {
    expect(filterServerSentryNoise(errorEvent('The destination stream closed early.'))).toBeNull();
  });

  it('reads the message from the original exception when there is one', () => {
    const hint: EventHint = { originalException: new Error('The destination stream closed early.') };
    expect(filterServerSentryNoise(errorEvent(''), hint)).toBeNull();
  });

  it.each([
    'Failed to fetch card name',
    'The destination stream closed early. Extra detail',
    'Cannot read properties of undefined (reading "id")',
  ])('keeps other server errors: %s', (message) => {
    const event = errorEvent(message);
    expect(filterServerSentryNoise(event)).toBe(event);
  });
});
