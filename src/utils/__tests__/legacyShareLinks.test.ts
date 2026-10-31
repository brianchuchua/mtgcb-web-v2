import { legacyShareRedirect } from '@/utils/legacyShareRedirect';
import { buildTokenShareUrl } from '@/utils/shareLinkUtils';
import { smartDecodeToken, smartEncodeToken } from '@/utils/tokenEncoder';

const HEX = '2b2d7fc211ee7835dbae3dc6e2101c00c9c8b41d8d293acf41328f53ac8764a2';
const SHORT = smartEncodeToken(HEX);
const ORIGIN = 'https://www.mtgcollectionbuilder.com';

describe('buildTokenShareUrl', () => {
  it('turns the API share URL into the /shared/ link', () => {
    expect(buildTokenShareUrl(`/collections/5?share=${HEX}`, ORIGIN)).toBe(`${ORIGIN}/shared/${SHORT}`);
    expect(smartDecodeToken(SHORT)).toBe(HEX);
  });

  it('adds the current view and drops any share param from it', () => {
    expect(buildTokenShareUrl(`/collections/5?share=${HEX}`, ORIGIN, `?share=${HEX}&name=Bolt&contentType=cards`)).toBe(
      `${ORIGIN}/shared/${SHORT}?name=Bolt&contentType=cards`,
    );
    expect(buildTokenShareUrl(`/collections/5?share=${HEX}`, ORIGIN, '?name=Bolt')).toBe(`${ORIGIN}/shared/${SHORT}?name=Bolt`);
  });

  it('falls back to the API URL when it has no token', () => {
    expect(buildTokenShareUrl('/collections/5', ORIGIN)).toBe(`${ORIGIN}/collections/5`);
  });
});

describe('legacyShareRedirect', () => {
  it('ignores pages without a share param', () => {
    expect(legacyShareRedirect('', { contentType: 'cards' })).toBeNull();
    expect(legacyShareRedirect('', {})).toBeNull();
  });

  it('sends collection, set and card links to the matching /shared/ page', () => {
    expect(legacyShareRedirect('', { share: HEX })).toBe(`/shared/${SHORT}`);
    expect(legacyShareRedirect('/dominaria', { share: HEX })).toBe(`/shared/${SHORT}/dominaria`);
    expect(legacyShareRedirect('/cards/shock/12', { share: HEX })).toBe(`/shared/${SHORT}/cards/shock/12`);
  });

  it('keeps the rest of the query, including repeated keys', () => {
    expect(legacyShareRedirect('', { name: 'Lightning Bolt', share: HEX, contentType: 'cards', x: ['1', '2'] })).toBe(
      `/shared/${SHORT}?name=Lightning+Bolt&contentType=cards&x=1&x=2`,
    );
  });

  it('keeps an odd token inside the /shared/ path', () => {
    expect(legacyShareRedirect('', { share: '../../evil?x=1' })).toBe('/shared/..%2F..%2Fevil%3Fx%3D1');
  });
});
