import HomePageClient from '@/app/HomePageClient';
import { pageMetadata } from '@/utils/seo/pageMetadata';

export const metadata = pageMetadata({ path: '/' });

export default function HomePage() {
  return <HomePageClient />;
}