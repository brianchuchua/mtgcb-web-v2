'use client';

import { Box, Chip, Divider, Pagination, Paper, Stack, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useState } from 'react';
import newsData from './newsData';
import { Link } from '@/components/ui/link';

const ITEMS_PER_PAGE = 5;

const CategoryChip = styled(Chip)<{ category: string }>(({ theme, category }) => {
  const getColor = () => {
    switch (category) {
      case 'feature':
        return { bg: theme.palette.success.main, text: theme.palette.success.contrastText };
      case 'news':
        return { bg: theme.palette.info.main, text: theme.palette.info.contrastText };
      default:
        return { bg: theme.palette.grey[500], text: theme.palette.common.white };
    }
  };

  const colors = getColor();
  return {
    fontWeight: 600,
    backgroundColor: colors.bg,
    color: colors.text,
    '&:hover': {
      backgroundColor: colors.bg,
    },
  };
});

const NewsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

export default function NewsPage() {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(newsData.articles.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedArticles = newsData.articles.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatVersionDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map((num) => parseInt(num, 10));
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          News
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Major features and announcements are highlighted here. See the <Link href="/changelog">changelog</Link> for
          all updates.
        </Typography>
      </Box>

      {paginatedArticles.map((article, index) => (
        <NewsCard key={startIndex + index} elevation={0}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, mb: 1 }}>
                  {article.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <CategoryChip label={article.category} size="small" category={article.category} />
                  <Typography variant="caption" color="text.secondary">
                    {formatVersionDate(article.date)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Divider />

            <Box
              sx={{
                lineHeight: 1.7,
                color: 'text.primary',
                '& p': {
                  margin: 0,
                  marginBottom: 2,
                  '&:last-child': {
                    marginBottom: 0,
                  },
                },
                '& strong': {
                  fontWeight: 600,
                  color: 'primary.main',
                },
              }}
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          </Stack>
        </NewsCard>
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
