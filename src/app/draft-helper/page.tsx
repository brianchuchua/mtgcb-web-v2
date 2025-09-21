'use client';

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

const HighlightBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
  textAlign: 'center',
}));

export default function DraftHelperPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            17Lands Visual Comparison Tool
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Because reading tables during a draft is hard!
          </Typography>
        </Box>

        {/* Screenshot Section */}
        <Box sx={{ mb: 5 }}>
          <Box
            component="a"
            href="https://17lands.mtgcb.tools/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'block',
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 aspect ratio, adjust if needed
              overflow: 'hidden',
              borderRadius: 1,
            }}
          >
            <Box
              component="img"
              src="https://r2.mtgcollectionbuilder.com/images/17-lands-tool-cropped.png"
              alt="17Lands Visual Comparison Tool Screenshot"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              href="https://17lands.mtgcb.tools/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ px: 4, py: 1.5 }}
            >
              Open Draft Helper Tool
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* What It Does */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            What It Does
          </Typography>
          <Typography variant="body1" paragraph>
            The{' '}
            <Typography
              component="a"
              href="https://17lands.mtgcb.tools/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500 }}
            >
              17Lands Visual Comparison Tool
            </Typography>{' '}
            lets you browse 17Lands data visually during a draft to help you make those tough picks. I built this over a
            weekend for me and my wife to use since we had a hard time searching 17Lands tables with a draft pick timer
            ticking. We just wanted to be able to compare a few specific cards quickly.
          </Typography>
          <Typography variant="body1" paragraph>
            Simply select your draft format, input the cards you're comparing, optionally choose which colors you're in,
            and it'll sort them by 17Lands win percentage criteria. Card names autocomplete, so it's fast to use - I
            usually run it on a second monitor.
          </Typography>
        </Box>

        {/* Attribution */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Data provided by{' '}
            <Typography
              component="a"
              href="https://www.17lands.com/"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none' }}
            >
              17Lands
            </Typography>{' '}
            • Consider supporting them on{' '}
            <Typography
              component="a"
              href="https://www.patreon.com/17lands"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', textDecoration: 'none' }}
            >
              Patreon
            </Typography>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
