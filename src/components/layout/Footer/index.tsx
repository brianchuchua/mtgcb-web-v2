'use client';

import { Box, Container, Link, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import NextLink from 'next/link';
import { useEffect, useState } from 'react';

const Footer = () => {
  const [emailLink, setEmailLink] = useState<string>('');
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    // Client-side only email construction
    const lhs = 'brian';
    const rhs = 'mtgcb.com';
    setEmailLink(`mailto:${lhs}@${rhs}`);
  }, []);

  return (
    <StyledFooter>
      <Container maxWidth="lg">
        <FooterContent>
          <Typography variant="body2" color="text.secondary">
            © 2013-{currentYear} MTG Collection Builder ·{' '}
            <Link component={NextLink} href="/terms-and-privacy" color="inherit">
              Terms and Privacy
            </Link>{' '}
            ·{' '}
            {emailLink ? (
              <Link href={emailLink} color="inherit">
                Contact
              </Link>
            ) : (
              <span>Contact</span>
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Magic the Gathering and all related properties are copyright Wizards of the Coast. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This site is not affiliated with any third-party services.
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
