'use client';

import { Box, Container, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import NextLink from 'next/link';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <FooterContent>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            © 2013-{currentYear} MTG Collection Builder ·{' '}
            <Link component={NextLink} href="/terms-and-privacy" color="inherit">
              Terms and Privacy
            </Link>{' '}
            ·{' '}
            <Link component={NextLink} href="/contact" color="inherit">
              Contact
            </Link>
          </Typography>
          <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
            <Typography variant="body2" color="text.secondary">
              © 2013-{currentYear} MTG Collection Builder
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              <Link component={NextLink} href="/terms-and-privacy" color="inherit">
                Terms and Privacy
              </Link>{' '}
              ·{' '}
              <Link component={NextLink} href="/contact" color="inherit">
                Contact
              </Link>
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Magic the Gathering and all related properties are copyright Wizards of the Coast. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Card prices are estimates provided by affiliates. Absolutely no guarantee is made for any price or
            collection value estimates. See the FAQ for more details.
          </Typography>
        </FooterContent>
      </Container>
    </StyledFooter>
  );
};

export default Footer;

const StyledFooter = styled('footer')(({ theme }) => ({
  backgroundColor: theme.palette.background.default,
  marginTop: 'auto',
  padding: theme.spacing(3, 0),
}));

const FooterContent = styled(Box)({
  textAlign: 'center',
});
