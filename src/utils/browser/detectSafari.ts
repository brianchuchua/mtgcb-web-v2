'use client';

export const isSafariBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  return userAgent.includes('Safari') && 
         !userAgent.includes('Chrome') && 
         !userAgent.includes('Android');
};

export const getFormTarget = (): string => {
  return isSafariBrowser() ? '_self' : '_blank';
};