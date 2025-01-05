'use client';

import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { ReactNode } from 'react';

interface ReCaptchaProviderProps {
  children: ReactNode;
}

export default function ReCaptchaProvider({ children }: ReCaptchaProviderProps) {
  return (
    <>
      <GoogleReCaptchaProvider
        reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ''}
        scriptProps={{
          async: true,
          defer: true,
          appendTo: 'head'
        }}
        container={{
          parameters: {
            badge: 'inline',
          }
        }}
      >
        {children}
      </GoogleReCaptchaProvider>
      <style jsx global>{`
        .grecaptcha-badge {
          visibility: hidden;
        }
      `}</style>
    </>
  );
}