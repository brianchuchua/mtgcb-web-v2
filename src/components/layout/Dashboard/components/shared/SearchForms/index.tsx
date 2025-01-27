'use client';

import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import BrowseSearchForm from '@/features/browse/BrowseSearchForm';

export const SearchForms = () => {
  const pathname = usePathname();

  return (
    <Box>
      {pathname === '/browse' && <BrowseSearchForm />}
      {/* Add other forms here later, like:
        pathname.startsWith('/collections') && <CollectionSearchForm />
        etc...
      */}
    </Box>
  );
};