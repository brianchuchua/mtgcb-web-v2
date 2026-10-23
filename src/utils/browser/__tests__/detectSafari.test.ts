import { getFormTarget, isSafariBrowser } from '@/utils/browser/detectSafari';

const USER_AGENTS = {
  safariMac:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  safariIos:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  chrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  androidStock:
    'Mozilla/5.0 (Linux; U; Android 4.0.3; en-us) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
};

describe('isSafariBrowser', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it.each([
    ['safariMac', true],
    ['safariIos', true],
    ['chrome', false],
    ['androidStock', false],
    ['firefox', false],
  ] as const)('%s -> %p', (agent, expected) => {
    jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(USER_AGENTS[agent]);

    expect(isSafariBrowser()).toBe(expected);
  });
});

describe('getFormTarget', () => {
  it('always opens a new tab', () => {
    expect(getFormTarget()).toBe('_blank');
  });
});
