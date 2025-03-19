'use client';

import { ReactNode } from 'react';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

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
          appendTo: 'head',
        }}
        container={{
          parameters: {
            badge: 'inline',
          },
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
