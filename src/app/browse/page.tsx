import BrowseClient from '@/app/browse/BrowseClientWrapper';

// TODO: Evaluate trade-offs of not using 'use client' in this file when it comes to social previews and SEO.
export default function BrowsePage() {
  return <BrowseClient />;
}
