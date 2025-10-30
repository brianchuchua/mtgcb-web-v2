'use client';

import { Box, Typography, Paper, Chip, Divider, Pagination } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import changelogData from './changelog';

const ITEMS_PER_PAGE = 10;

const VersionChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const NewCardsChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.success.main,
  color: theme.palette.success.contrastText,
}));

const ChangeItem = styled('li')(({ theme }) => ({
  marginBottom: theme.spacing(1),
  color: theme.palette.text.secondary,
  '&::marker': {
    color: theme.palette.primary.main,
  },
}));

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'UTC'
  });
};

export default function ChangelogPage() {
  const [page, setPage] = useState(1);
  
  const totalPages = Math.ceil(changelogData.releases.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedReleases = changelogData.releases.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Changelog
      </Typography>
      
      {paginatedReleases.map((release, index) => (
        <Paper key={startIndex + index} elevation={0} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {formatDate(release.date)}
            </Typography>
            <VersionChip label={`v${release.version}`} size="small" />
            {release.type === 'data' && (
              <NewCardsChip label="New Cards" size="small" />
            )}
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {release.changes.map((change, changeIndex) => (
              <ChangeItem key={changeIndex}>
                <Typography variant="body1">
                  {change}
                </Typography>
              </ChangeItem>
            ))}
          </Box>
        </Paper>
      ))}
      
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
}