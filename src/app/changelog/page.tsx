'use client';

import { Box, Typography, Paper, Chip, Divider } from '@mui/material';
import { styled } from '@mui/material/styles';
import changelogData from './changelog';

const VersionChip = styled(Chip)(({ theme }) => ({
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
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
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Changelog
      </Typography>
      
      {changelogData.releases.map((release, index) => (
        <Paper key={index} elevation={0} sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
              {formatDate(release.date)}
            </Typography>
            <VersionChip label={`v${release.version}`} size="small" />
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
    </Box>
  );
}
