import SetBrowseClient from './SetBrowseClient';

interface SetBrowsePageProps {
  params: Promise<{
    setSlug: string;
  }>;
}

export default async function SetBrowsePage({ params }: SetBrowsePageProps) {
  const { setSlug } = await params;
  return <SetBrowseClient setSlug={setSlug} />;
}