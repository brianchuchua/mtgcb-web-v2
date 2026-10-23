import { decodeToken, encodeToken, isHexToken, smartDecodeToken, smartEncodeToken } from '@/utils/tokenEncoder';

// The API mints share tokens as randomBytes(32).toString('hex'): always 64 lowercase hex chars.
const SAMPLE_TOKEN = 'ffb676098ccc57db3c965976c4bb1515b7122fb086fe5db5562cdfa3cc832bd9';
const tokenWithPrefix = (prefix: string) => (prefix + SAMPLE_TOKEN).slice(0, 64);

describe('encodeToken / decodeToken', () => {
  it('round-trips a typical 64-char hex token', () => {
    const encoded = encodeToken(SAMPLE_TOKEN);

    expect(encoded.length).toBeLessThan(SAMPLE_TOKEN.length);
    expect(encoded).toMatch(/^[0-9a-zA-Z]+$/);
    expect(decodeToken(encoded)).toBe(SAMPLE_TOKEN);
  });

  it('round-trips a token with a single leading zero', () => {
    const token = tokenWithPrefix('0f');

    expect(decodeToken(encodeToken(token))).toBe(token);
  });

  it('round-trips a token with two leading zeros', () => {
    const token = tokenWithPrefix('00');

    expect(decodeToken(encodeToken(token))).toBe(token);
  });

  it('round-trips a token with three leading zeros', () => {
    const token = tokenWithPrefix('000a');

    expect(decodeToken(encodeToken(token))).toHaveLength(64);
  });

  it('round-trips a batch of tokens with no leading zero', () => {
    const tokens = Array.from({ length: 20 }, (_, i) =>
      ((i + 1) * 0x1234567).toString(16).padStart(8, 'f').repeat(8).slice(0, 64),
    );

    tokens.forEach((token) => expect(decodeToken(encodeToken(token))).toBe(token));
  });

  it('returns an empty string for empty input', () => {
    expect(encodeToken('')).toBe('');
    expect(decodeToken('')).toBe('');
  });

  it('encodes an all-zero value as "0"', () => {
    expect(encodeToken('0000')).toBe('0');
  });

  it('returns the input unchanged when it is not valid hex', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(encodeToken('not-hex!')).toBe('not-hex!');
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it('returns the input unchanged when it contains a non-base62 character', () => {
    expect(decodeToken('abc-def')).toBe('abc-def');
    expect(decodeToken('abc_def')).toBe('abc_def');
  });

  it('is case-sensitive when decoding', () => {
    expect(decodeToken('a')).not.toBe(decodeToken('A'));
  });
});

describe('isHexToken', () => {
  it.each([
    [SAMPLE_TOKEN, true],
    [SAMPLE_TOKEN.toUpperCase(), true],
    ['a'.repeat(32), true],
    ['a'.repeat(31), false],
    ['g'.repeat(40), false],
    [`${'a'.repeat(40)}-`, false],
    ['', false],
  ])('isHexToken(%p) is %p', (input, expected) => {
    expect(isHexToken(input)).toBe(expected);
  });
});

describe('smartEncodeToken / smartDecodeToken', () => {
  it('encodes hex tokens and leaves short or non-hex strings alone', () => {
    expect(smartEncodeToken(SAMPLE_TOKEN)).toBe(encodeToken(SAMPLE_TOKEN));
    expect(smartEncodeToken('abc')).toBe('abc');
    expect(smartEncodeToken('already-short')).toBe('already-short');
  });

  it('passes an undecoded hex token straight through', () => {
    expect(smartDecodeToken(SAMPLE_TOKEN)).toBe(SAMPLE_TOKEN);
  });

  it('decodes a base62 token back to hex', () => {
    expect(smartDecodeToken(smartEncodeToken(SAMPLE_TOKEN))).toBe(SAMPLE_TOKEN);
  });

  it('returns a non-base62 string unchanged', () => {
    expect(smartDecodeToken('bad.token')).toBe('bad.token');
  });
});
