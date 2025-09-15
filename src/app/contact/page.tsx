'use client';

import { Email as EmailIcon, Facebook as FacebookIcon, Twitter as TwitterIcon, X as XIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';

const ContactCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const SocialButton = styled(IconButton)(({ theme }) => ({
  width: 60,
  height: 60,
  backgroundColor: theme.palette.background.paper,
  border: `2px solid ${theme.palette.divider}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    transform: 'scale(1.1)',
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.contrastText,
    },
  },
})) as typeof IconButton;

const ContactButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  fontSize: '1.1rem',
  fontWeight: 500,
  borderRadius: theme.spacing(1),
  textTransform: 'none',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
})) as typeof Button;

export default function ContactPage() {
  const [emailLink, setEmailLink] = useState<string>('');

  useEffect(() => {
    // Client-side only email construction
    const lhs = 'brian';
    const rhs = 'mtgcb.com';
    setEmailLink(`mailto:${lhs}@${rhs}`);
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Contact
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Have questions, feedback, or just want to say hi? Here are some ways.
          </Typography>
        </Box>

        {/* Main Contact Options */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          <Grid item xs={12} md={6}>
            <ContactCard elevation={0}>
              <CardContent sx={{ height: '100%' }}>
                <Stack spacing={3} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h2" fontWeight={600} textAlign="center" gutterBottom>
                      Email
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Have a suggestion or noticed a ridiculous bug?
                    </Typography>
                  </Box>
                  {emailLink ? (
                    <ContactButton
                      variant="contained"
                      color="primary"
                      href={emailLink}
                      component="a"
                      startIcon={<EmailIcon />}
                    >
                      Send an Email
                    </ContactButton>
                  ) : (
                    <ContactButton variant="contained" color="primary" disabled startIcon={<EmailIcon />}>
                      Send an Email
                    </ContactButton>
                  )}
                </Stack>
              </CardContent>
            </ContactCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <ContactCard elevation={0}>
              <CardContent sx={{ height: '100%' }}>
                <Stack spacing={3} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 48, lineHeight: 1 }}>🎉</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h2" fontWeight={600} textAlign="center" gutterBottom>
                      Patreon Discord Channel
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Patrons get access to our Discord community
                    </Typography>
                  </Box>
                  <ContactButton
                    variant="contained"
                    sx={{
                      backgroundColor: '#FF424D',
                      '&:hover': {
                        backgroundColor: '#E0353E',
                      },
                    }}
                    href="https://patreon.com/mtgcollectionbuilder"
                    component="a"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Become a Patron
                  </ContactButton>
                </Stack>
              </CardContent>
            </ContactCard>
          </Grid>
        </Grid>

        <Divider sx={{ my: 5 }} />

        {/* Social Media Section */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Follow Us
          </Typography>
          <Paper elevation={0} sx={{ p: 4 }}>
            <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
              <Box textAlign="center">
                <SocialButton
                  href="https://facebook.com/mtgcollectionbuilder"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FacebookIcon sx={{ fontSize: 30, color: '#1877F2' }} />
                </SocialButton>
                <Typography variant="caption" display="block" mt={1}>
                  Facebook
                </Typography>
              </Box>

              <Box textAlign="center">
                <SocialButton
                  href="https://twitter.com/mtg_cb"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <TwitterIcon sx={{ fontSize: 30, color: '#1DA1F2' }} />
                </SocialButton>
                <Typography variant="caption" display="block" mt={1}>
                  Twitter
                </Typography>
              </Box>

              <Box textAlign="center">
                <SocialButton
                  href="https://twitter.com/mtg_cb"
                  component="a"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X (Twitter)"
                >
                  <XIcon sx={{ fontSize: 30, color: '#000000' }} />
                </SocialButton>
                <Typography variant="caption" display="block" mt={1}>
                  (...or X)
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
