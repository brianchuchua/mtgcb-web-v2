'use client';

import {
  AutoAwesome,
  Dashboard as DashboardIcon,
  Iso as IsoIcon,
  ImportContacts as LibraryIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid2 as Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PieChart } from '@mui/x-charts/PieChart';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useGetHomeStatisticsQuery } from '@/api/statistics/statisticsApi';
import { HomeStatisticsData } from '@/api/statistics/types';
import { useDisplaySettings } from '@/contexts/DisplaySettingsContext';
import { useAuth } from '@/hooks/useAuth';

export default function AuthenticatedHomePageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const { user } = useAuth();
  const { settings } = useDisplaySettings();
  const [isNewUser] = useState(() => searchParams.get('new') === 'true');

  const { data, isLoading, error } = useGetHomeStatisticsQuery({ priceType: settings.priceType });
  const stats = data?.success && data.data ? data.data : null;

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  if (isLoading && !data && !error) {
    return <LoadingState isMobile={isMobile} isNewUser={isNewUser} />;
  }

  if (error || !stats) {
    return <ErrorState isMobile={isMobile} />;
  }

  const hasCollectionData = stats.collectionOverview.totalCardsCollected > 0;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <WelcomeSection user={user} stats={stats} isMobile={isMobile} isNewUser={isNewUser} />
      <ActionButtonsSection router={router} isMobile={isMobile} userId={user?.userId} />
      {!hasCollectionData && (
        <Container maxWidth="lg" sx={{ mb: 4 }}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom>
                Your Collection Awaits!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Start adding cards to see detailed statistics, value distributions, and track your progress.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => router.push('/collections/edit-cards')}
                startIcon={<IsoIcon />}
              >
                Add Your First Cards
              </Button>
            </CardContent>
          </Card>
        </Container>
      )}
      <StatisticsSection stats={stats} isMobile={isMobile} theme={theme} />
      <QuickWinsSection stats={stats} router={router} isMobile={isMobile} userId={user?.userId || 0} />
      <Container maxWidth="lg" sx={{ mt: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          (Statistics update hourly)
        </Typography>
      </Container>
    </Box>
  );
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({ user, stats, isMobile, isNewUser }) => {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            {isNewUser ? 'Welcome' : 'Welcome back'}, {user?.username}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {isNewUser ? "Let's get started with your collection" : "Here's your collection overview"}
          </Typography>
        </Box>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  $
                  {stats.collectionOverview.totalValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Collection Value
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {stats.collectionOverview.totalCardsCollected.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Total Cards Collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {stats.collectionOverview.uniquePrintingsCollected.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Unique Printings Collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {stats.collectionOverview.percentageCollected.toFixed(2)}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  of All Magic Cards Collected
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
};

const ActionButtonsSection: React.FC<ActionButtonsSectionProps> = ({ router, isMobile, userId }) => {
  return (
    <Container maxWidth="lg" sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quick Actions
      </Typography>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActionCard onClick={() => router.push(`/collections/${userId}`)}>
            <LibraryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              View My Collection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browse your entire collection, track values, and monitor your progress
            </Typography>
          </ActionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActionCard onClick={() => router.push('/collections/edit-cards')}>
            <IsoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Add or Remove Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Quickly update card quantities in your collection with our dedicated editor
            </Typography>
          </ActionCard>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ActionCard onClick={() => router.push('/browse')}>
            <DashboardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Browse Magic Cards
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Explore all Magic cards and sets with advanced search and filters
            </Typography>
          </ActionCard>
        </Grid>
      </Grid>
    </Container>
  );
};

const StatisticsSection: React.FC<StatisticsSectionProps> = ({ stats, isMobile, theme }) => {
  const router = useRouter();
  const { user } = useAuth();

  // Check if user has any collection data
  const hasCollectionData = stats.collectionOverview.totalCardsCollected > 0;

  // Don't render statistics section if there's no data
  if (!hasCollectionData) {
    return null;
  }

  const pieData = [
    {
      id: 0,
      value: stats.valueDistribution.moneyCards.totalValue,
      label: `Money Cards ($20+)`,
      color: theme.palette.success.main,
    },
    {
      id: 1,
      value: stats.valueDistribution.midRangeCards.totalValue,
      label: `Mid-Range ($1-19)`,
      color: theme.palette.warning.main,
    },
    {
      id: 2,
      value: stats.valueDistribution.bulkCards.totalValue,
      label: `Bulk Cards (<$1)`,
      color: theme.palette.info.main,
    },
  ].map((item) => ({
    ...item,
    formattedValue: `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${((item.value / stats.collectionOverview.totalValue) * 100).toFixed(1)}%)`,
  }));

  const totalCards =
    stats.valueDistribution.moneyCards.count +
    stats.valueDistribution.midRangeCards.count +
    stats.valueDistribution.bulkCards.count;

  const countPieData = [
    {
      id: 0,
      value: stats.valueDistribution.moneyCards.count,
      label: `Money Cards ($20+)`,
      color: theme.palette.success.main,
    },
    {
      id: 1,
      value: stats.valueDistribution.midRangeCards.count,
      label: `Mid-Range ($1-19)`,
      color: theme.palette.warning.main,
    },
    {
      id: 2,
      value: stats.valueDistribution.bulkCards.count,
      label: `Bulk Cards (<$1)`,
      color: theme.palette.info.main,
    },
  ].map((item) => ({
    ...item,
    formattedValue: `${item.value.toLocaleString()} cards (${((item.value / totalCards) * 100).toFixed(1)}%)`,
  }));

  return (
    <Container maxWidth="lg" sx={{ mb: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Collection Statistics
      </Typography>
      <Grid container spacing={3}>
        {stats.trophyCard && (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <TrophyCard
              onClick={() => {
                if (!stats.trophyCard) return;
                const cardSlug = stats.trophyCard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                router.push(`/collections/${user?.userId}/cards/${cardSlug}/${stats.trophyCard.cardId}`);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AutoAwesome color="warning" />
                  <Typography variant="h6" fontWeight="bold">
                    Most Valuable Card
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 120,
                      flexShrink: 0,
                      position: 'relative',
                      height: 167,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <img
                      src={`https://r2.mtgcollectionbuilder.com/cards/images/normal/${stats.trophyCard.cardId}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`}
                      alt={stats.trophyCard.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: stats.trophyCard.setName === 'Limited Edition Alpha' ? '7%' : '5%',
                        display: 'block',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </Box>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.trophyCard.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.trophyCard.setName}
                    </Typography>
                    <Typography variant="h5" color="success.main" fontWeight="bold">
                      $
                      {stats.trophyCard.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </TrophyCard>
          </Grid>
        )}

        {stats.mostCollectedCard && (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <MostCollectedCard
              onClick={() => {
                if (!stats.mostCollectedCard) return;
                const cardSlug = stats.mostCollectedCard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                router.push(`/collections/${user?.userId}/cards/${cardSlug}/${stats.mostCollectedCard.cardId}`);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Most Collected
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 120,
                      flexShrink: 0,
                      position: 'relative',
                      height: 167,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <img
                      src={`https://r2.mtgcollectionbuilder.com/cards/images/normal/${stats.mostCollectedCard.cardId}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`}
                      alt={stats.mostCollectedCard.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: stats.mostCollectedCard.setName === 'Limited Edition Alpha' ? '7%' : '5%',
                        display: 'block',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </Box>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.mostCollectedCard.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.mostCollectedCard.setName}
                    </Typography>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      {stats.mostCollectedCard.totalQuantity}x
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </MostCollectedCard>
          </Grid>
        )}

        {stats.leastValuableMythic && (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
            <LeastValuableCard
              onClick={() => {
                if (!stats.leastValuableMythic) return;
                const cardSlug = stats.leastValuableMythic.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                router.push(`/collections/${user?.userId}/cards/${cardSlug}/${stats.leastValuableMythic.cardId}`);
              }}
              sx={{ cursor: 'pointer' }}
            >
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Least Valuable Mythic
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 120,
                      flexShrink: 0,
                      position: 'relative',
                      height: 167,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <img
                      src={`https://r2.mtgcollectionbuilder.com/cards/images/normal/${stats.leastValuableMythic.cardId}.jpg?v=${process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220'}`}
                      alt={stats.leastValuableMythic.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: stats.leastValuableMythic.setName === 'Limited Edition Alpha' ? '7%' : '5%',
                        display: 'block',
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </Box>
                  <Stack spacing={1} sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.leastValuableMythic.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.leastValuableMythic.setName}
                    </Typography>
                    <Typography variant="h5" color="error.main" fontWeight="bold">
                      $
                      {stats.leastValuableMythic.value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </Typography>
                  </Stack>
                </Box>
              </CardContent>
            </LeastValuableCard>
          </Grid>
        )}

        <Grid size={{ xs: 12, lg: 6 }}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Money vs Bulk Card Quantity
              </Typography>
              <Box sx={{ height: isMobile ? 250 : 350 }}>
                <PieChart
                  series={[
                    {
                      data: countPieData,
                      highlightScope: { fade: 'global', highlight: 'item' },
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 5,
                      arcLabel: (item) => {
                        return item.value.toLocaleString();
                      },
                      arcLabelMinAngle: 45,
                      valueFormatter: (value: any) => {
                        const numValue = typeof value === 'number' ? value : value.value;
                        const percentage = ((numValue / totalCards) * 100).toFixed(1);
                        return `${numValue.toLocaleString()} cards (${percentage}%)`;
                      },
                    },
                  ]}
                  height={isMobile ? 250 : 350}
                  hideLegend={isMobile}
                  slotProps={{
                    legend: {
                      position: { vertical: 'middle', horizontal: 'end' },
                      direction: 'vertical',
                    },
                  }}
                  margin={
                    isMobile
                      ? { top: 10, bottom: 10, left: 10, right: 10 }
                      : { top: 10, bottom: 10, left: 10, right: 10 }
                  }
                  sx={{
                    '& .MuiChartsArcLabel-root': {
                      fill: 'white',
                      fontSize: 13,
                      fontWeight: 'bold',
                    },
                    '& .MuiChartsArcLabel-root tspan': {
                      textAnchor: 'middle',
                    },
                  }}
                />
              </Box>
              {isMobile && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {countPieData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: item.color, borderRadius: 0.5 }} />
                      <Typography variant="body2">{item.label}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Money vs Bulk Card Value
              </Typography>
              <Box sx={{ height: isMobile ? 250 : 350 }}>
                <PieChart
                  series={[
                    {
                      data: pieData,
                      highlightScope: { fade: 'global', highlight: 'item' },
                      innerRadius: 30,
                      paddingAngle: 2,
                      cornerRadius: 5,
                      arcLabel: (item) => {
                        return `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                      },
                      arcLabelMinAngle: 45,
                      valueFormatter: (value: any) => {
                        const numValue = typeof value === 'number' ? value : value.value;
                        const percentage = ((numValue / stats.collectionOverview.totalValue) * 100).toFixed(1);
                        return `$${numValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${percentage}%)`;
                      },
                    },
                  ]}
                  height={isMobile ? 250 : 350}
                  hideLegend={isMobile}
                  slotProps={{
                    legend: {
                      position: { vertical: 'middle', horizontal: 'end' },
                      direction: 'vertical',
                    },
                  }}
                  margin={
                    isMobile
                      ? { top: 10, bottom: 10, left: 10, right: 10 }
                      : { top: 10, bottom: 10, left: 10, right: 10 }
                  }
                  sx={{
                    '& .MuiChartsArcLabel-root': {
                      fill: 'white',
                      fontSize: 13,
                      fontWeight: 'bold',
                    },
                    '& .MuiChartsArcLabel-root tspan': {
                      textAnchor: 'middle',
                    },
                  }}
                />
              </Box>
              {isMobile && (
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {pieData.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: item.color, borderRadius: 0.5 }} />
                      <Typography variant="body2">{item.label}</Typography>
                    </Box>
                  ))}
                </Stack>
              )}
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </Container>
  );
};

const QuickWinsSection: React.FC<QuickWinsSectionProps> = ({ stats, router, isMobile, userId }) => {
  if (!stats.quickWins.closestSetByCost && !stats.quickWins.secondClosestSetByCost) {
    return null;
  }

  return (
    <Container maxWidth="lg">
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quick Wins
      </Typography>
      <Grid container spacing={3}>
        {stats.quickWins.closestSetByCost && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <QuickWinCard>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Closest Set to Complete
                  </Typography>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.quickWins.closestSetByCost.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.quickWins.closestSetByCost.cardsOwned} / {stats.quickWins.closestSetByCost.totalCards}{' '}
                      cards
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.quickWins.closestSetByCost.percentageComplete}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Complete
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        $
                        {stats.quickWins.closestSetByCost.costToComplete.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        To Complete
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => router.push(`/collections/${userId}/${stats.quickWins.closestSetByCost?.slug}`)}
                    fullWidth
                  >
                    View Set
                  </Button>
                </Stack>
              </CardContent>
            </QuickWinCard>
          </Grid>
        )}

        {stats.quickWins.secondClosestSetByCost && (
          <Grid size={{ xs: 12, lg: 6 }}>
            <QuickWinCard>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6" fontWeight="bold">
                    Closest Normal Set to Complete
                  </Typography>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {stats.quickWins.secondClosestSetByCost.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stats.quickWins.secondClosestSetByCost.cardsOwned} /{' '}
                      {stats.quickWins.secondClosestSetByCost.totalCards} cards
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h4" color="primary.main" fontWeight="bold">
                        {stats.quickWins.secondClosestSetByCost.percentageComplete}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Complete
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h5" color="success.main" fontWeight="bold">
                        $
                        {stats.quickWins.secondClosestSetByCost.costToComplete.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        To Complete
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() =>
                      router.push(`/collections/${userId}/${stats.quickWins.secondClosestSetByCost?.slug}`)
                    }
                    fullWidth
                  >
                    View Set
                  </Button>
                </Stack>
              </CardContent>
            </QuickWinCard>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

const LoadingState: React.FC<{ isMobile: boolean; isNewUser: boolean }> = ({ isMobile, isNewUser }) => {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 4 }}>
      <Container maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
              {isNewUser ? 'Welcome' : 'Welcome back'}, {user?.username}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {isNewUser ? "Let's get started with your collection" : "Here's your collection overview"}
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {[
              { width: '40%', label: 'Collection Value' },
              { width: '30%', label: 'Total Cards Collected' },
              { width: '35%', label: 'Unique Printings Collected' },
              { width: '25%', label: 'of All Magic Cards Collected' },
            ].map((item, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color="primary.main">
                      <Skeleton variant="text" width={item.width} sx={{ mx: 'auto' }} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {item.label}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ActionCard onClick={() => router.push(`/collections/${user?.userId}`)}>
              <LibraryIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                View My Collection
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse your entire collection, track values, and monitor your progress
              </Typography>
            </ActionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ActionCard onClick={() => router.push('/collections/edit-cards')}>
              <IsoIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Add or Remove Cards
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Quickly update card quantities in your collection with our dedicated editor
              </Typography>
            </ActionCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <ActionCard onClick={() => router.push('/browse')}>
              <DashboardIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Browse Magic Cards
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Explore all Magic cards and sets with advanced search and filters
              </Typography>
            </ActionCard>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Collection Statistics
        </Typography>
        <Grid container spacing={3}>
          {[
            { Component: TrophyCard, icon: <AutoAwesome color="warning" />, title: 'Most Valuable Card' },
            { Component: MostCollectedCard, icon: null, title: 'Most Collected' },
            { Component: LeastValuableCard, icon: null, title: 'Least Valuable Mythic' },
          ].map((item, i) => {
            const CardComponent = item.Component;
            return (
              <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                <CardComponent sx={{ height: '100%' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {item.icon && item.icon}
                      <Typography variant="h6" fontWeight="bold">
                        {item.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Skeleton variant="rectangular" width={120} height={167} sx={{ borderRadius: 1 }} />
                      <Stack spacing={1} sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" sx={{ fontSize: '1.5rem' }} />
                      </Stack>
                    </Box>
                  </CardContent>
                </CardComponent>
              </Grid>
            );
          })}
          <Grid size={{ xs: 12, lg: 6 }}>
            <StatsCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Money vs Bulk Card Quantity
                </Typography>
                <Box sx={{ height: isMobile ? 250 : 350 }}>
                  <Skeleton variant="rectangular" width="100%" height="100%" />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
          <Grid size={{ xs: 12, lg: 6 }}>
            <StatsCard>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Money vs Bulk Card Value
                </Typography>
                <Box sx={{ height: isMobile ? 250 : 350 }}>
                  <Skeleton variant="rectangular" width="100%" height="100%" />
                </Box>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>
      </Container>

      <Container maxWidth="lg">
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Quick Wins
        </Typography>
        <Grid container spacing={3}>
          {['Closest Set to Complete', 'Second Closest Set to Complete'].map((title, i) => (
            <Grid key={i} size={{ xs: 12, lg: 6 }}>
              <QuickWinCard>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6" fontWeight="bold">
                      {title}
                    </Typography>
                    <Box>
                      <Typography variant="body1" fontWeight="bold">
                        <Skeleton variant="text" width="70%" />
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        <Skeleton variant="text" width="40%" />
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="h4" color="primary.main" fontWeight="bold">
                          <Skeleton variant="text" width={60} />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Complete
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h5" color="success.main" fontWeight="bold">
                          <Skeleton variant="text" width={80} />
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          To Complete
                        </Typography>
                      </Box>
                    </Box>
                    <Skeleton variant="rectangular" height={36.5} sx={{ borderRadius: 1 }} />
                  </Stack>
                </CardContent>
              </QuickWinCard>
            </Grid>
          ))}
        </Grid>
      </Container>

      <Container maxWidth="lg" sx={{ mt: 1, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          (Statistics update hourly)
        </Typography>
      </Container>
    </Box>
  );
};

const ErrorState: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Alert severity="error">
        <Typography variant="h6">Unable to load statistics</Typography>
        <Typography variant="body2">Please try refreshing the page or check back later.</Typography>
      </Alert>
    </Container>
  );
};

// Styled Components
const ActionCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  cursor: 'pointer',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
    backgroundColor: alpha(theme.palette.primary.main, 0.02),
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[8],
  },
}));

const TrophyCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background:
    theme.palette.mode === 'dark' ? alpha(theme.palette.warning.dark, 0.08) : alpha(theme.palette.warning.light, 0.06),
  border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[6],
    borderColor: alpha(theme.palette.warning.main, 0.4),
  },
}));

const QuickWinCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background:
    theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.1) : alpha(theme.palette.primary.light, 0.05),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[8],
    borderColor: theme.palette.primary.main,
  },
}));

const MostCollectedCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background:
    theme.palette.mode === 'dark' ? alpha(theme.palette.primary.dark, 0.08) : alpha(theme.palette.primary.light, 0.06),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: theme.shadows[6],
    borderColor: alpha(theme.palette.primary.main, 0.4),
  },
}));

const LeastValuableCard = styled(Card)(({ theme }) => ({
  height: '100%',
  background: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[800], 0.3) : alpha(theme.palette.grey[100], 0.5),
  border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
  opacity: 0.95,
  transition: 'all 0.3s',
  '&:hover': {
    opacity: 1,
    boxShadow: theme.shadows[4],
    borderColor: alpha(theme.palette.grey[600], 0.4),
  },
}));

// Interfaces
interface WelcomeSectionProps {
  user: any;
  stats: HomeStatisticsData;
  isMobile: boolean;
  isNewUser: boolean;
}

interface ActionButtonsSectionProps {
  router: any;
  isMobile: boolean;
  userId?: number;
}

interface StatisticsSectionProps {
  stats: HomeStatisticsData;
  isMobile: boolean;
  theme: any;
}

interface QuickWinsSectionProps {
  stats: HomeStatisticsData;
  router: any;
  isMobile: boolean;
  userId: number;
}
