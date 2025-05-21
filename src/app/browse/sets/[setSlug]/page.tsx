import SetBrowseClient from './SetBrowseClient';

interface SetBrowsePageProps {
  params: {
    setSlug: string;
  };
}

export default function SetBrowsePage({ params }: SetBrowsePageProps) {
  return <SetBrowseClient setSlug={params.setSlug} />;
}