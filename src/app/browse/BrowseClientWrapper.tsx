'use client';

import dynamic from 'next/dynamic';

// TODO: Evaluate this trade-off of not using 'use client' in this file when it comes to social previews and SEO.
const BrowseClient = dynamic(() => import('@/app/browse/BrowseClient'), {
  ssr: false,
  loading: () => <p style={{ padding: 32 }}>Loading…</p>,
});

export default BrowseClient;
