'use client';

import {
  Box,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid,
  Button as MuiButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useGetPatreonStatusQuery, useGetPatreonSupportersQuery } from '@/api/patreon/patreonApi';
import { CustomCard } from '@/components/patrons/CustomCard';
import { useAuth } from '@/hooks/useAuth';

const ContactCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const ContactButton = styled(MuiButton)(({ theme }) => ({
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
})) as typeof MuiButton;

const TierBadge = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'badgeColor',
})<{ badgeColor: string }>(({ badgeColor }) => ({
  width: 28,
  height: 28,
  borderRadius: '50%',
  backgroundColor: badgeColor,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold',
  fontSize: '0.875rem',
  color: '#000',
}));

const getBadgeColor = (badge: 'C' | 'U' | 'R' | 'M'): string => {
  switch (badge) {
    case 'C':
      return '#94A3B8'; // Common - gray/blue
    case 'U':
      return '#C0C0C0'; // Uncommon - silver
    case 'R':
      return '#FFD700'; // Rare - gold
    case 'M':
      return '#FF6B35'; // Mythic - orange/red
    default:
      return '#94A3B8';
  }
};

export default function PatronsPage() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { data: patreonData, isLoading: isLoadingStatus } = useGetPatreonStatusQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: supportersData, isLoading: isLoadingSupporters } = useGetPatreonSupportersQuery();

  const isLinked = patreonData?.data?.linked || false;
  const currentTier = patreonData?.data?.currentTier;
  const supporters = supportersData?.data || [];

  // Show loading state while checking authentication
  const isCheckingAuth = isAuthLoading || (isAuthenticated && isLoadingStatus);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            Patrons
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Support MTG Collection Builder and help keep the site ad-free!
          </Typography>
        </Box>

        {/* Action Cards */}
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {/* Become a Patron Card */}
          <Grid item xs={12} md={6}>
            <ContactCard elevation={0}>
              <CardContent sx={{ height: '100%' }}>
                <Stack spacing={3} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                  <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 48, lineHeight: 1 }}>❤️</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h5" component="h2" fontWeight={600} textAlign="center" gutterBottom>
                      Become a Patron
                    </Typography>
                    <Typography variant="body1" color="text.secondary" textAlign="center">
                      Support development and get exclusive perks
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
                    Become a Patron on Patreon
                  </ContactButton>
                </Stack>
              </CardContent>
            </ContactCard>
          </Grid>

          {/* Link Account / Thank You Card */}
          <Grid item xs={12} md={6}>
            <ContactCard elevation={0}>
              <CardContent sx={{ height: '100%', minHeight: 280 }}>
                {isCheckingAuth ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : !isAuthenticated || !isLinked ? (
                  <Stack spacing={3} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                    <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 48, lineHeight: 1 }}>🔗</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" component="h2" fontWeight={600} textAlign="center" gutterBottom>
                        Link Your Account
                      </Typography>
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        {!isAuthenticated
                          ? 'Sign in and link your Patreon to show your support'
                          : 'Link your Patreon account to display your badge'}
                      </Typography>
                    </Box>
                    <ContactButton
                      variant="contained"
                      color="primary"
                      component={Link}
                      href={!isAuthenticated ? '/login' : '/account#patreon'}
                    >
                      {!isAuthenticated ? 'Sign In' : 'Link Patreon Account'}
                    </ContactButton>
                  </Stack>
                ) : (
                  <Stack spacing={3} alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
                    <Box sx={{ height: 48, display: 'flex', alignItems: 'center' }}>
                      <Typography sx={{ fontSize: 48, lineHeight: 1 }}>🎉</Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" component="h2" fontWeight={600} textAlign="center" gutterBottom>
                        Thank You for Your Support!
                      </Typography>
                      {currentTier ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
                          <TierBadge badgeColor={getBadgeColor(currentTier.badge)}>{currentTier.badge}</TierBadge>
                          <Typography variant="body1" fontWeight={500}>
                            {currentTier.name}
                          </Typography>
                          {currentTier.isActive && (
                            <Typography variant="caption" color="success.main">
                              Active
                            </Typography>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
                          You&apos;re a former patron - thank you!
                        </Typography>
                      )}
                    </Box>
                    <ContactButton variant="outlined" color="primary" component={Link} href="/account#patreon">
                      Manage Settings
                    </ContactButton>
                  </Stack>
                )}
              </CardContent>
            </ContactCard>
          </Grid>
        </Grid>

        <Divider sx={{ my: 5 }} />

        {/* Philosophy Section */}
        <Box sx={{ mb: 5 }}>
          <Paper elevation={0} sx={{ p: 4, backgroundColor: 'action.hover' }}>
            <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Why Patreon?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Patreon allows me to offset the cost of not showing ads to any of my users. I used to run Google Ads until
              I realized how much it detracted from the experience, especially for users on older devices. Anyone who's
              been to a gaming wiki knows how obstrusive ads can be. Do I <strong>really</strong> need to see two
              simultaneous video ads for toothpaste while reading a Mass Effect 2 guide?
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              I also personally use Patreon to support other creators, and I love the idea of a platform that allows
              fans to directly fund projects that they like. I think the best value patrons get is a direct line to me
              in our Discord community, especially since patrons get a very strong say in the next features I work on.
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Whether you're a patron or not, thank you for being here!
            </Typography>
          </Paper>
        </Box>

        <Divider sx={{ my: 5 }} />

        {/* Tier Benefits */}
        <Box sx={{ mb: 5 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Supporter Tiers
          </Typography>

          <Grid container spacing={3}>
            {/* Common Tier */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TierBadge badgeColor={getBadgeColor('C')}>C</TierBadge>
                    <Typography variant="h6" fontWeight={600}>
                      Common
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    $1
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  You will receive:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Personalized thank you email</Typography>
                  <Typography variant="body2">• Access to MTG CB Discord</Typography>
                  <Typography variant="body2">• Access to polls</Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* Uncommon Tier */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  border: '2px solid',
                  borderColor: 'primary.main',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" fontWeight={600}>
                    POPULAR
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TierBadge badgeColor={getBadgeColor('U')}>U</TierBadge>
                    <Typography variant="h6" fontWeight={600}>
                      Uncommon
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    $2
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  You will receive:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Everything in Common tier</Typography>
                  <Typography variant="body2">• MTG CB sticker mailed to you</Typography>
                  <Typography variant="body2">• MTG CB magnet mailed to you</Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* Rare Tier */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TierBadge badgeColor={getBadgeColor('R')}>R</TierBadge>
                    <Typography variant="h6" fontWeight={600}>
                      Rare
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    $5
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  You will receive:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Everything in previous tiers</Typography>
                  <Typography variant="body2">• Personalized signed postcard mailed to you</Typography>
                </Stack>
              </Paper>
            </Grid>

            {/* Mythic Rare Tier */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 3, height: '100%', border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TierBadge badgeColor={getBadgeColor('M')}>M</TierBadge>
                    <Typography variant="h6" fontWeight={600}>
                      Mythic Rare
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main">
                    $10
                    <Typography component="span" variant="body2" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  You will receive:
                </Typography>
                <Stack spacing={1}>
                  <Typography variant="body2">• Everything in previous tiers</Typography>
                  <Typography variant="body2">• Immortalized as Mythic Rare supporter</Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 5 }} />

        {/* Supporters List */}
        <Box>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600, textAlign: 'center', mb: 4 }}>
            Our Amazing Supporters
          </Typography>

          {isLoadingSupporters ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : supporters.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4 }}>
              <Typography variant="body1" color="text.secondary" textAlign="center">
                No supporters have chosen to be listed publicly yet. Supporters can link their Patreon account and
                opt-in to display their name on this page.
              </Typography>
            </Paper>
          ) : (
            <Stack spacing={4}>
              {/* Mythic Rare Supporters */}
              {supporters.filter((s) => s.highestTier.slug === 'mythic').length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <TierBadge badgeColor={getBadgeColor('M')}>M</TierBadge>
                    <Typography variant="h5" fontWeight={600} sx={{ color: getBadgeColor('M') }}>
                      Mythic Rare Supporters
                    </Typography>
                  </Box>

                  {/* The Reserved List - Mythic supporters with custom cards */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
                        The Reserved List
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Mythic Rare supporters using their perk to represent themselves with a custom card
                      </Typography>
                    </Box>
                    {supporters.filter((s) => s.highestTier.slug === 'mythic' && s.customCard).length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                        {supporters
                          .filter((s) => s.highestTier.slug === 'mythic' && s.customCard)
                          .map((supporter) => (
                            <CustomCard
                              key={supporter.username}
                              username={supporter.username}
                              cardId={supporter.customCard!.cardId}
                              color={supporter.customCard!.color}
                            />
                          ))}
                      </Box>
                    ) : (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 4,
                          backgroundColor: 'action.hover',
                          textAlign: 'center',
                        }}
                      >
                        <Typography sx={{ fontSize: 48, mb: 2 }}>✨</Typography>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          No Custom Cards Yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Mythic Rare supporters who have ever supported at this tier can select a custom card art and
                          frame color to represent themselves.
                        </Typography>
                      </Paper>
                    )}
                  </Box>

                  {/* Mythic supporters without custom cards */}
                  {supporters.filter((s) => s.highestTier.slug === 'mythic' && !s.customCard).length > 0 && (
                    <Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                          Equally-As-Cool Mythic Supporters
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                        {supporters
                          .filter((s) => s.highestTier.slug === 'mythic' && !s.customCard)
                          .map((supporter) => (
                            <Paper key={supporter.username} elevation={0} sx={{ p: 2 }}>
                              <Typography variant="body1" fontWeight={500}>
                                {supporter.username}
                              </Typography>
                            </Paper>
                          ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              )}

              {/* Rare Supporters */}
              {supporters.filter((s) => s.highestTier.slug === 'rare').length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <TierBadge badgeColor={getBadgeColor('R')}>R</TierBadge>
                    <Typography variant="h5" fontWeight={600} sx={{ color: getBadgeColor('R') }}>
                      Rare Supporters
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {supporters
                      .filter((s) => s.highestTier.slug === 'rare')
                      .map((supporter) => (
                        <Paper key={supporter.username} elevation={0} sx={{ p: 2 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {supporter.username}
                          </Typography>
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}

              {/* Uncommon Supporters */}
              {supporters.filter((s) => s.highestTier.slug === 'uncommon').length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <TierBadge badgeColor={getBadgeColor('U')}>U</TierBadge>
                    <Typography variant="h5" fontWeight={600} sx={{ color: getBadgeColor('U') }}>
                      Uncommon Supporters
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {supporters
                      .filter((s) => s.highestTier.slug === 'uncommon')
                      .map((supporter) => (
                        <Paper key={supporter.username} elevation={0} sx={{ p: 2 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {supporter.username}
                          </Typography>
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}

              {/* Common Supporters */}
              {supporters.filter((s) => s.highestTier.slug === 'common').length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <TierBadge badgeColor={getBadgeColor('C')}>C</TierBadge>
                    <Typography variant="h5" fontWeight={600} sx={{ color: getBadgeColor('C') }}>
                      Common Supporters
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    {supporters
                      .filter((s) => s.highestTier.slug === 'common')
                      .map((supporter) => (
                        <Paper key={supporter.username} elevation={0} sx={{ p: 2 }}>
                          <Typography variant="body1" fontWeight={500}>
                            {supporter.username}
                          </Typography>
                        </Paper>
                      ))}
                  </Box>
                </Box>
              )}
            </Stack>
          )}

          {/* Anonymous supporters message */}
          {supporters.length > 0 && (
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                ... plus many supporters who choose to remain anonymous!
              </Typography>
            </Box>
          )}

          {/* Instructions for missing supporters */}
          <Paper elevation={0} sx={{ p: 3, mt: 4, backgroundColor: 'action.hover' }}>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Don&apos;t see yourself listed? You may need to{' '}
              <Typography
                component={Link}
                href="/account#patreon"
                variant="body2"
                color="primary"
                sx={{ fontWeight: 500 }}
              >
                link your Patreon account
              </Typography>{' '}
              and enable the setting to show yourself on the supporters page.
            </Typography>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
}
