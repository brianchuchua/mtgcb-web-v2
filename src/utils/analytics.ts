import { sendGAEvent } from '@next/third-parties/google';

const ENABLE_GA = process.env.NEXT_PUBLIC_ENABLE_GA === 'true';

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!ENABLE_GA) return;

  sendGAEvent('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};

export const trackButtonClick = (buttonName: string, location?: string) => {
  trackEvent('click', 'button', `${buttonName}${location ? ` - ${location}` : ''}`);
};

export const trackFormSubmit = (formName: string, success: boolean = true) => {
  trackEvent('submit', 'form', formName, success ? 1 : 0);
};

export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', 'search', searchTerm, resultsCount);
};

export const trackPageView = (pageName: string) => {
  if (!ENABLE_GA || typeof window === 'undefined') return;

  window.gtag?.('event', 'page_view', {
    page_title: pageName,
    page_path: window.location.pathname,
  });
};