import type { ConsoleMessage, Page } from '@playwright/test';

// Logged-out visitors always get a 401 from GET /auth/me (that is how useAuth
// learns there is no session), and Chrome logs every non-2xx fetch as a console
// error. Anything else is a real error.
const isExpectedNoise = (message: ConsoleMessage, allowStatus404: boolean): boolean => {
  const text = message.text();
  // Report-only CSP notice when a Google iframe (reCAPTCHA/embeds) loads intermittently; nothing is blocked.
  if (text.startsWith("[Report Only] Refused to frame 'https://www.google.com/'")) return true;
  if (!text.startsWith('Failed to load resource')) return false;
  const url = message.location()?.url ?? '';
  if (text.includes('401') && url.includes('/auth/me')) return true;
  // Icon/mana fonts load from public CDNs; a dropped connection there is network noise, not an app error.
  if (text.includes('net::ERR_') && /^https?:\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)\//.test(url)) return true;
  if (allowStatus404 && text.includes('404')) return true;
  return false;
};

export const collectPageErrors = (page: Page, options: { allowStatus404?: boolean } = {}): string[] => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    if (isExpectedNoise(message, options.allowStatus404 ?? false)) return;
    errors.push(`console: ${message.text()} (${message.location()?.url ?? ''})`);
  });
  page.on('pageerror', (error) => {
    errors.push(`pageerror: ${error.message}`);
  });
  return errors;
};
