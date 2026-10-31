import { fetchCardName, fetchCollectionOwnerName, titleFromSlug } from '@/utils/seo/collectionTitleLookups';

const reply = (status: number, body: unknown) =>
  Promise.resolve({ ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body) } as Response);

describe('collection title lookups', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('returns the owner username from a sets search, passing the share token', async () => {
    fetchMock.mockReturnValue(reply(200, { success: true, data: { username: 'Manath' } }));

    await expect(fetchCollectionOwnerName(1337, 'tok')).resolves.toBe('Manath');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/sets\/search$/);
    expect(JSON.parse(init.body)).toMatchObject({ userId: 1337, limit: 1 });
    expect(init.headers['X-Share-Token']).toBe('tok');
    expect(init.next).toEqual({ revalidate: 3600 });
  });

  it('returns null for a private collection, an API error or a network failure', async () => {
    fetchMock.mockReturnValueOnce(reply(403, { error: { code: 'COLLECTION_PRIVATE' } }));
    await expect(fetchCollectionOwnerName(5)).resolves.toBeNull();

    fetchMock.mockReturnValueOnce(reply(200, { success: true, data: { username: '' } }));
    await expect(fetchCollectionOwnerName(5)).resolves.toBeNull();

    fetchMock.mockRejectedValueOnce(new Error('timeout'));
    await expect(fetchCollectionOwnerName(5)).resolves.toBeNull();
  });

  it('returns the real card name, punctuation intact', async () => {
    fetchMock.mockReturnValue(reply(200, { success: true, data: { cards: [{ name: 'Teferi, Hero of Dominaria' }] } }));

    await expect(fetchCardName(35089)).resolves.toBe('Teferi, Hero of Dominaria');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/cards\/by-ids$/);
    expect(JSON.parse(init.body)).toEqual({ ids: [35089] });
    expect(init.headers['X-Share-Token']).toBeUndefined();
  });

  it('returns null when the card is not found', async () => {
    fetchMock.mockReturnValue(reply(200, { success: true, data: { cards: [] } }));
    await expect(fetchCardName(1)).resolves.toBeNull();
  });

  it('skips the API for ids that are not positive integers', async () => {
    await expect(fetchCollectionOwnerName(NaN)).resolves.toBeNull();
    await expect(fetchCardName(0)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('builds the fallback title from the slug', () => {
    expect(titleFromSlug('teferi-hero-of-dominaria')).toBe('Teferi Hero Of Dominaria');
  });
});
