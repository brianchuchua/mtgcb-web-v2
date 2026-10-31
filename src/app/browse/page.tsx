import BrowseClient from '@/app/browse/BrowseClient';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({
  title: 'Browse',
  description: 'Browse every Magic: The Gathering card and set.',
  path: '/browse',
});

export default function BrowsePage() {
  return <BrowseClient />;
}
