'use client';

import {
  AutoAwesome,
  BlockOutlined,
  CheckCircle,
  Flag,
  Groups,
  ImportExport,
  LocationOn,
  Speed,
  Storage,
  TrendingUp,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Grid2 as Grid,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGetPlatformStatisticsQuery } from '@/api/statistics/statisticsApi';
import { PlatformStatisticsReady } from '@/api/statistics/types';
import { Link } from '@/components/ui/link';
import { useAuth } from '@/hooks/useAuth';

const AuthenticatedHomePageClient = dynamic(() => import('./AuthenticatedHomePageClient'), {
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <CircularProgress />
    </Box>
  ),
});

export default function HomePageClient() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isAuthenticated) {
    return <AuthenticatedHomePageClient />;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background:
          theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, #121212, #1e1e1e)'
            : 'linear-gradient(to bottom, #ffffff, #f5f5f5)',
      }}
    >
      <Box
        sx={{
          background:
            theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #050a30 0%, #2e0845 100%)' // Extremely dark blue to purple
              : 'linear-gradient(135deg, #0d1551 0%, #4a148c 100%)', // Darker blue for light mode
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '300px',
            background:
              theme.palette.mode === 'dark'
                ? 'linear-gradient(to bottom, transparent, #1A1B1D)'
                : 'linear-gradient(to bottom, transparent, #ffffff)',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="lg" sx={{ pt: 3, pb: 6, position: 'relative', zIndex: 1 }}>
          <HeroContent isMobile={isMobile} theme={theme} router={router} />
        </Container>
      </Box>

      <Box
        sx={{
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.3)
              : alpha(theme.palette.grey[100], 0.5),
        }}
      >
        <FeaturesSection />
      </Box>

      <Box>
        <BenefitsSection theme={theme} />
      </Box>

      <Box
        sx={{
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.3)
              : alpha(theme.palette.grey[100], 0.5),
        }}
      >
        <CTASection isMobile={isMobile} router={router} />
      </Box>
    </Box>
  );
}

const HeroContent: React.FC<HeroContentProps> = ({ isMobile, theme, router }) => {
  return (
    <Stack spacing={3} alignItems="center" textAlign="center">
      <Box>
        <Box sx={{ mb: 2 }}>
          <Box
            component="img"
            src="https://r2.mtgcollectionbuilder.com/images/mtgcb-logo.png"
            alt="MTG Collection Builder Logo"
            sx={{
              height: isMobile ? 200 : 300,
              width: 'auto',
              filter: 'brightness(1.1) drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
            }}
          />
        </Box>
        {/* <Chip
          icon={<AutoAwesome />}
          label="Version 1.0 Now Live!"
          color="secondary"
          sx={{ mb: 2, fontWeight: 'bold' }}
        /> */}
        <Typography variant={isMobile ? 'h5' : 'h3'} component="h1" fontWeight="bold" gutterBottom>
          MTG Collection Builder
        </Typography>
        <Typography variant={isMobile ? 'body1' : 'h5'} sx={{ opacity: 0.95, mb: 3 }}>
          Track and Complete Your Magic Collection
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} sx={{ maxWidth: 600, mx: 'auto', opacity: 0.9 }}>
          Organize your cards, track values, and easily set and complete your collection goals.
        </Typography>
      </Box>

      <HeroButtons isMobile={isMobile} theme={theme} router={router} />
      <HeroStats theme={theme} />
    </Stack>
  );
};

const HeroButtons: React.FC<HeroButtonsProps> = ({ isMobile, theme, router }) => {
  return (
    <Stack direction={isMobile ? 'column' : 'row'} spacing={2} sx={{ mt: 4 }}>
      <GradientButton size="large" onClick={() => router.push('/signup')}>
        Create Free Account
      </GradientButton>
      <Button
        variant="outlined"
        size="large"
        onClick={() => router.push('/login')}
        sx={{
          fontSize: '1.1rem',
          padding: '12px 30px',
          borderColor: 'rgba(255,255,255,0.7)',
          color: 'white',
          '&:hover': {
            borderColor: 'white',
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
        }}
      >
        Sign In
      </Button>
    </Stack>
  );
};

const HeroStats: React.FC<HeroStatsProps> = ({ theme }) => {
  const { data, isLoading } = useGetPlatformStatisticsQuery();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isReady = data?.success && data.data && !('status' in data.data);
  const stats = isReady ? (data.data as PlatformStatisticsReady) : null;

  return (
    <Stack
      direction={isMobile ? 'column' : 'row'}
      spacing={isMobile ? 2 : 3}
      sx={{
        mt: 4,
        visibility: stats ? 'visible' : 'hidden',
      }}
      divider={
        !isMobile ? <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} /> : undefined
      }
    >
      <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: isMobile ? '1.75rem' : undefined,
            color: 'success.main',
          }}
        >
          {stats ? `${stats.totalCardsTracked.toLocaleString()}` : '71,243,672'}
        </Typography>
        <Typography variant={isMobile ? 'body1' : 'body2'}>Cards Tracked</Typography>
      </Box>
      <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: isMobile ? '1.75rem' : undefined,
            color: 'success.main',
          }}
        >
          {stats ? `${stats.totalCollectors.toLocaleString()}` : '54,573'}
        </Typography>
        <Typography variant={isMobile ? 'body1' : 'body2'}>Collectors</Typography>
      </Box>
      <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{
            fontSize: isMobile ? '1.5rem' : undefined,
            color: 'success.main',
          }}
        >
          {stats ? `$${Math.floor(stats.totalPlatformValue.usd).toLocaleString()}` : '$198,625,973'}
        </Typography>
        <Typography variant={isMobile ? 'body1' : 'body2'}>Total Value Tracked</Typography>
      </Box>
    </Stack>
  );
};

const FeaturesSection: React.FC = () => {
  const isMobile = useMediaQuery(useTheme().breakpoints.down('sm'));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} component="h2" fontWeight="bold" gutterBottom>
          Collection First
        </Typography>
        <Typography variant={isMobile ? 'body2' : 'body1'} color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          Built by collectors, for collectors. Designed to make collecting easier and more fulfilling.
        </Typography>
      </Box>

      <Grid container spacing={isMobile ? 2 : 4}>
        {features.map((feature, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 4 }}>
            <FeatureCard>
              <CardContent>
                <Stack spacing={2}>
                  <Box sx={{ color: 'primary.main' }}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight="bold">
                    {feature.title}
                  </Typography>
                  {typeof feature.description === 'string' ? (
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary" component="div">
                      {feature.description}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </FeatureCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

const BenefitsSection: React.FC<BenefitsSectionProps> = ({ theme }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Grid container spacing={6} alignItems="center">
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" gutterBottom>
            Why Choose MTG CB?
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Honestly, use as many tools and sites that fit your use cases as you want. :) If you want to see progress
            bars for your collection and track progress toward specific goals, MTG CB may be a good addition to your
            toolbelt!
          </Typography>
          <Stack spacing={2} sx={{ mt: 3 }}>
            {benefits.map((benefit, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle color="primary" fontSize="small" />
                <Typography variant="body1">{benefit}</Typography>
              </Box>
            ))}
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <StatsGrid />
        </Grid>
      </Grid>
    </Container>
  );
};

const StatsGrid: React.FC = () => {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatsGridBox>
          <AutoAwesome fontSize="large" color="primary" />
          <StatsGridTitle variant="h5" fontWeight="bold">
            It's Free
          </StatsGridTitle>
          <StatsGridDescription variant="body2" color="text.secondary">
            (Like an ornithopter)
          </StatsGridDescription>
        </StatsGridBox>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <StatsGridBox>
          <BlockOutlined fontSize="large" color="primary" />
          <StatsGridTitle variant="h5" fontWeight="bold">
            No Annoying Ads
          </StatsGridTitle>
          <StatsGridDescription variant="body2" color="text.secondary">
            Thanks to{' '}
            <Link
              href="https://patreon.com/mtgcollectionbuilder"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              Patreon supporters
            </Link>
          </StatsGridDescription>
        </StatsGridBox>
      </Grid>
      <Grid size={12}>
        <StatsGridBox>
          <Groups fontSize="large" color="primary" />
          <StatsGridTitle variant="h5" fontWeight="bold">
            Community-Driven
          </StatsGridTitle>
          <StatsGridDescription variant="body2" color="text.secondary">
            New features added based on community feedback
          </StatsGridDescription>
        </StatsGridBox>
      </Grid>
    </Grid>
  );
};

const CTASection: React.FC<CTASectionProps> = ({ isMobile, router }) => {
  return (
    <Box sx={{ py: 3, textAlign: 'center' }}>
      <Container maxWidth="sm">
        <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight="bold" gutterBottom>
          Ready to Build Your Collection?
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Join tens of thousands of collectors already using MTG Collection Builder to track, organize, and complete
          their Magic collections.
        </Typography>
        <Stack direction={isMobile ? 'column' : 'row'} spacing={2} justifyContent="center" sx={{ mt: 4 }}>
          <GradientButton size="large" onClick={() => router.push('/signup')}>
            Create Free Account
          </GradientButton>
          <Button
            variant="outlined"
            size="large"
            onClick={() => router.push('/collections/1337?includeCompletionStatus=complete%7Cpartial&contentType=sets')}
          >
            See Sample Collection
          </Button>
        </Stack>
      </Container>
    </Box>
  );
};

// Interfaces
interface HeroContentProps {
  isMobile: boolean;
  theme: any;
  router: any;
}

interface HeroButtonsProps {
  isMobile: boolean;
  theme: any;
  router: any;
}

interface HeroStatsProps {
  theme: any;
}

interface BenefitsSectionProps {
  theme: any;
}

interface CTASectionProps {
  isMobile: boolean;
  router: any;
}

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`,
  backgroundColor:
    theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.8) : theme.palette.background.paper,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  },
}));

const StatsGridBox = styled(Box)(({ theme }) => ({
  textAlign: 'center',
  padding: theme.spacing(3),
  borderRadius: theme.shape.borderRadius,
  background:
    theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.primary.main, 0.05),
  border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.3 : 0.1)}`,
}));

const StatsGridTitle = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const StatsGridDescription = styled(Typography)(() => ({}));

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.primary.main} 90%)`,
  border: 0,
  borderRadius: theme.shape.borderRadius,
  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
  color: 'white',
  padding: '12px 30px',
  fontSize: '1.1rem',
  transition: 'all 0.3s',
  '&:hover': {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
    transform: 'scale(1.05)',
    boxShadow: '0 5px 15px 2px rgba(33, 150, 243, .4)',
  },
}));

// Data
const features = [
  {
    icon: <TrendingUp fontSize="large" />,
    title: 'Collection Tracking',
    description:
      'See your collection progress holistically by tracking its value, completion percentages and costs to complete. Complete entire sets with a single click.',
  },
  {
    icon: <Flag fontSize="large" />,
    title: 'Custom Goals',
    description: 'Set and track custom goals so you can collect what you care about most.',
  },
  {
    icon: <LocationOn fontSize="large" />,
    title: 'Physical Location Tracking',
    description: 'Organize your cards by binders, boxes, and exact locations for easy retrieval.',
  },
  {
    icon: <ImportExport fontSize="large" />,
    title: 'Flexible Import/Export',
    description: 'Import from many different platforms. Export to any format you need.',
  },
  {
    icon: <Speed fontSize="large" />,
    title: 'Lightning Fast',
    description: 'Built with modern tech for live searching and updates across massive collections.',
  },
  {
    icon: <Storage fontSize="large" />,
    title: 'Binder Templates',
    description: (
      <>
        <Link href="/binder-templates" style={{ color: 'inherit', textDecoration: 'underline' }}>
          Printable templates
        </Link>{' '}
        for three-ring binders, perfect for organizing your collection physically.
      </>
    ),
  },
];

const benefits = ["It's free", 'No annoying ads', 'Community-driven development'];
