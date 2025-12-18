'use client';

import {
  CheckCircle as CheckCircleIcon,
  HourglassEmpty as HourglassIcon,
  RadioButtonUnchecked as RadioButtonIcon,
} from '@mui/icons-material';
import { alpha, Box, Chip, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Link } from '@/components/ui/link';
import { roadmapItems, RoadmapStatus } from './roadmapData';

const getStatusConfig = (status: RoadmapStatus) => {
  switch (status) {
    case 'completed':
      return {
        label: 'Completed',
        color: 'success' as const,
        Icon: CheckCircleIcon,
      };
    case 'in-progress':
      return {
        label: 'In Progress',
        color: 'primary' as const,
        Icon: HourglassIcon,
      };
    case 'upcoming':
      return {
        label: 'Upcoming',
        color: 'default' as const,
        Icon: RadioButtonIcon,
      };
  }
};

const TimelineContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingLeft: theme.spacing(4),
  [theme.breakpoints.up('sm')]: {
    paddingLeft: theme.spacing(5),
  },
}));

const TimelineLine = styled(Box)(({ theme }) => ({
  position: 'absolute',
  left: 11,
  top: 0,
  bottom: 0,
  width: 2,
  background: `linear-gradient(to bottom, ${theme.palette.success.main} 0%, ${theme.palette.primary.main} 30%, ${theme.palette.grey[600]} 60%)`,
  [theme.breakpoints.up('sm')]: {
    left: 15,
  },
}));

const TimelineItem = styled(Box)(({ theme }) => ({
  position: 'relative',
  paddingBottom: theme.spacing(2),
  '&:last-child': {
    paddingBottom: 0,
  },
}));

const TimelineDot = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: RoadmapStatus }>(({ theme, status }) => {
  const getColor = () => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'in-progress':
        return theme.palette.primary.main;
      default:
        return theme.palette.grey[600];
    }
  };

  return {
    position: 'absolute',
    left: -28,
    top: 16,
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: theme.palette.background.paper,
    border: `3px solid ${getColor()}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    [theme.breakpoints.up('sm')]: {
      left: -32,
      width: 28,
      height: 28,
    },
    '& svg': {
      fontSize: 14,
      color: getColor(),
      [theme.breakpoints.up('sm')]: {
        fontSize: 16,
      },
    },
  };
});

const RoadmapCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: RoadmapStatus }>(({ theme, status }) => {
  const isActive = status === 'in-progress';
  const isCompleted = status === 'completed';

  return {
    padding: theme.spacing(2),
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
    border: isActive ? `2px solid ${theme.palette.primary.main}` : 'none',
    opacity: isCompleted ? 0.85 : 1,
    background: isActive
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 1)} 100%)`
      : theme.palette.background.paper,
    [theme.breakpoints.up('sm')]: {
      padding: theme.spacing(2.5),
    },
    '&:hover': {
      transform: 'translateX(4px)',
      boxShadow: theme.shadows[4],
    },
  };
});

const StatusChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'status',
})<{ status: RoadmapStatus }>(({ theme, status }) => {
  const getColors = () => {
    switch (status) {
      case 'completed':
        return {
          bg: theme.palette.success.main,
          text: theme.palette.success.contrastText,
        };
      case 'in-progress':
        return {
          bg: theme.palette.primary.main,
          text: theme.palette.primary.contrastText,
        };
      default:
        return {
          bg: theme.palette.grey[700],
          text: theme.palette.common.white,
        };
    }
  };

  const colors = getColors();
  return {
    fontWeight: 600,
    fontSize: '0.7rem',
    height: 22,
    backgroundColor: colors.bg,
    color: colors.text,
  };
});

export default function RoadmapPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant={isMobile ? 'h4' : 'h3'} component="h1" sx={{ fontWeight: 700, mb: 1 }}>
          Roadmap
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Follow along with MTG Collection Builder&apos;s development journey.
        </Typography>
      </Box>

      <TimelineContainer>
        <TimelineLine />
        {roadmapItems.map((item) => {
          const { label, Icon } = getStatusConfig(item.status);

          return (
            <TimelineItem key={item.id}>
              <TimelineDot status={item.status}>
                <Icon />
              </TimelineDot>
              <RoadmapCard elevation={item.status === 'in-progress' ? 2 : 0} status={item.status}>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                    <Typography
                      variant={isMobile ? 'subtitle1' : 'h6'}
                      component="h2"
                      sx={{
                        fontWeight: 600,
                        color: item.status === 'in-progress' ? 'primary.main' : 'text.primary',
                      }}
                    >
                      {item.title}
                    </Typography>
                    <StatusChip label={label} size="small" status={item.status} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {item.description}
                  </Typography>
                </Stack>
              </RoadmapCard>
            </TimelineItem>
          );
        })}
      </TimelineContainer>

      <Box sx={{ mt: { xs: 3, sm: 4 }, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', fontStyle: 'italic' }}>
          Have ideas for future features? <Link href="/contact">Feel free to reach out!</Link>
        </Typography>
      </Box>
    </Box>
  );
}
