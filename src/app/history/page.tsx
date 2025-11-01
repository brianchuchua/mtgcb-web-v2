'use client';

import { Box, Typography, Paper, Chip, Divider, CircularProgress, Alert, Pagination, Button } from '@mui/material';
import { styled } from '@mui/material/styles';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useGetCollectionHistoryQuery } from '@/api/collections/collectionsApi';
import type { HistoryEntry, OperationType } from '@/api/collections/types';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Upload as ImportIcon,
  RemoveCircle as NukeIcon,
  Place as LocationIcon,
  GridOn as MassIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import { generateCardSlug } from '@/utils/cards/generateCardSlug';
import { getCollectionCardUrl, getCollectionSetUrl, getCollectionUrl } from '@/utils/collectionUrls';
import { useRouter } from 'next/navigation';

const ITEMS_PER_PAGE = 5;

const OperationChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'operationType',
})<{ operationType: OperationType }>(({ theme, operationType }) => {
  const colorMap: Record<OperationType, { bg: string; text: string }> = {
    update: { bg: theme.palette.primary.main, text: theme.palette.primary.contrastText },
    'mass-update': { bg: theme.palette.secondary.main, text: theme.palette.secondary.contrastText },
    'mass-entry': { bg: theme.palette.secondary.main, text: theme.palette.secondary.contrastText },
    import: { bg: theme.palette.success.main, text: theme.palette.success.contrastText },
    nuke: { bg: theme.palette.error.main, text: theme.palette.error.contrastText },
    'location-assign': { bg: theme.palette.info.main, text: theme.palette.info.contrastText },
    'location-update': { bg: theme.palette.info.main, text: theme.palette.info.contrastText },
    'location-remove': { bg: theme.palette.warning.main, text: theme.palette.warning.contrastText },
    'location-mass-update': { bg: theme.palette.info.dark, text: theme.palette.info.contrastText },
  };

  const colors = colorMap[operationType];
  return {
    fontWeight: 600,
    backgroundColor: colors.bg,
    color: colors.text,
  };
});

const ModeChip = styled(Chip)(({ theme }) => ({
  fontWeight: 500,
  backgroundColor: theme.palette.grey[700],
  color: theme.palette.common.black,
}));

const EntryItem = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(1.5),
  paddingBottom: theme.spacing(1.5),
  borderBottom: `1px solid ${theme.palette.divider}`,
  '&:last-child': {
    borderBottom: 'none',
    marginBottom: 0,
    paddingBottom: 0,
  },
}));

const formatDate = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const getDateKey = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const getOperationIcon = (operationType: OperationType) => {
  const iconMap: Record<OperationType, React.ReactElement> = {
    update: <EditIcon fontSize="small" />,
    'mass-update': <MassIcon fontSize="small" />,
    'mass-entry': <MassIcon fontSize="small" />,
    import: <ImportIcon fontSize="small" />,
    nuke: <NukeIcon fontSize="small" />,
    'location-assign': <AddIcon fontSize="small" />,
    'location-update': <EditIcon fontSize="small" />,
    'location-remove': <DeleteIcon fontSize="small" />,
    'location-mass-update': <LocationIcon fontSize="small" />,
  };
  return iconMap[operationType];
};

const getOperationLabel = (operationType: OperationType) => {
  const labelMap: Record<OperationType, string> = {
    update: 'Update',
    'mass-update': 'Mass Update',
    'mass-entry': 'Mass Entry',
    import: 'Import',
    nuke: 'Nuke',
    'location-assign': 'Location Assign',
    'location-update': 'Location Update',
    'location-remove': 'Location Remove',
    'location-mass-update': 'Location Mass Update',
  };
  return labelMap[operationType];
};

const getModeLabel = (mode: string, entry: HistoryEntry) => {
  // Map backend mode names to frontend-friendly labels
  const modeLabels: Record<string, string> = {
    merge: 'add mode',
    set: 'set mode',
    replace: 'replace mode',
    remove: 'remove mode',
  };

  // For increment mode, determine if quantities went up or down
  if (mode === 'increment') {
    // Check single-card quantities
    if (entry.quantities) {
      const regChange = (entry.quantities.regular.after ?? 0) - (entry.quantities.regular.before ?? 0);
      const foilChange = (entry.quantities.foil.after ?? 0) - (entry.quantities.foil.before ?? 0);

      // If either quantity decreased, it's a remove
      if (regChange < 0 || foilChange < 0) {
        return 'remove mode';
      }
      // Otherwise it's an add
      return 'add mode';
    }

    // Check bulk operation quantities (for location-mass-update)
    if (entry.bulkSummary && (entry.bulkSummary.quantityReg !== undefined || entry.bulkSummary.quantityFoil !== undefined)) {
      const regQty = entry.bulkSummary.quantityReg ?? 0;
      const foilQty = entry.bulkSummary.quantityFoil ?? 0;

      // If either quantity is negative, it's a remove
      if (regQty < 0 || foilQty < 0) {
        return 'remove mode';
      }
      // Otherwise it's an add
      return 'add mode';
    }

    // Default to add mode if we can't determine
    return 'add mode';
  }

  return modeLabels[mode] || `${mode} mode`;
};

const formatBulkOperationSummary = (entry: HistoryEntry, userId: number) => {
  if (!entry.bulkSummary) return null;

  const { bulkSummary, operationType, mode, location } = entry;

  // For mass-update, mass-entry, and location-mass-update, create a natural sentence
  if (operationType === 'mass-update' || operationType === 'mass-entry' || operationType === 'location-mass-update') {
    // Determine action verb based on mode
    let action = 'Updated';
    let isIncrement = false;
    if (mode === 'set') {
      action = 'Set';
    } else if (mode === 'increment') {
      isIncrement = true;
      const regQty = bulkSummary.quantityReg ?? 0;
      const foilQty = bulkSummary.quantityFoil ?? 0;
      if (regQty < 0 || foilQty < 0) {
        action = 'Removed';
      } else {
        action = 'Added';
      }
    } else if (mode === 'remove') {
      action = 'Removed';
    }

    // Build rarity text (only for mass-update and mass-entry, not location operations)
    let rarityText = 'cards';
    if (bulkSummary.rarity && operationType !== 'location-mass-update') {
      rarityText = bulkSummary.rarity === 'all'
        ? 'cards'
        : bulkSummary.rarity === 'mythic'
          ? 'mythic cards'
          : `${bulkSummary.rarity} cards`;
    }

    // Build quantity text
    const regQty = bulkSummary.quantityReg ?? 0;
    const foilQty = bulkSummary.quantityFoil ?? 0;
    let quantityText = '';
    if (regQty !== 0 || foilQty !== 0) {
      const qtyParts: string[] = [];
      if (regQty !== 0) {
        qtyParts.push(`${Math.abs(regQty)} regular`);
      }
      if (foilQty !== 0) {
        qtyParts.push(`${Math.abs(foilQty)} foil`);
      }
      quantityText = qtyParts.join(' and ');
    }

    // For location-mass-update
    if (operationType === 'location-mass-update') {
      // For remove mode, don't show quantities
      if (mode === 'remove') {
        if (location) {
          return (
            <Typography variant="body2" component="span">
              Removed {bulkSummary.cardsAffected} cards from{' '}
              <Link
                href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${location.id}`}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {location.name}
              </Link>
            </Typography>
          );
        } else {
          return (
            <Typography variant="body2" component="span">
              Removed {bulkSummary.cardsAffected} cards from all locations
            </Typography>
          );
        }
      }

      // For operations with a specific location
      if (location) {
        // For increment mode (Added/Removed), put quantity first
        if (isIncrement && quantityText) {
          const preposition = action === 'Removed' ? 'from' : 'to';
          return (
            <Typography variant="body2" component="span">
              {action} {quantityText} {preposition} {bulkSummary.cardsAffected} cards in{' '}
              <Link
                href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${location.id}`}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {location.name}
              </Link>
            </Typography>
          );
        }

        // For set mode
        return (
          <Typography variant="body2" component="span">
            {action} {bulkSummary.cardsAffected} cards in{' '}
            <Link
              href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${location.id}`}
              style={{ color: 'inherit', textDecoration: 'underline' }}
            >
              {location.name}
            </Link>
            {quantityText ? ` to ${quantityText}` : ''}
          </Typography>
        );
      }
    }

    // For mass-update with set, include set in the sentence
    if (operationType === 'mass-update' && (bulkSummary.setName || bulkSummary.setCode)) {
      // For increment mode (Added/Removed), put quantity first: "Added 2 regular to 116 rare cards in LEA"
      // For set mode, keep original order: "Set 116 rare cards in LEA to 2 regular"
      if (isIncrement && quantityText) {
        return (
          <Typography variant="body2" component="span">
            {action} {quantityText} to {bulkSummary.cardsAffected} {rarityText} in{' '}
            {bulkSummary.setSlug ? (
              <Link
                href={getCollectionSetUrl(userId.toString(), bulkSummary.setSlug)}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {bulkSummary.setName || bulkSummary.setCode}
              </Link>
            ) : (
              bulkSummary.setName || bulkSummary.setCode
            )}
          </Typography>
        );
      } else {
        return (
          <Typography variant="body2" component="span">
            {action} {bulkSummary.cardsAffected} {rarityText} in{' '}
            {bulkSummary.setSlug ? (
              <Link
                href={getCollectionSetUrl(userId.toString(), bulkSummary.setSlug)}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {bulkSummary.setName || bulkSummary.setCode}
              </Link>
            ) : (
              bulkSummary.setName || bulkSummary.setCode
            )}
            {quantityText ? ` to ${quantityText}` : ''}
          </Typography>
        );
      }
    }

    // For mass-entry (no set)
    if (isIncrement && quantityText) {
      return (
        <Typography variant="body2" component="span">
          {action} {quantityText} to {bulkSummary.cardsAffected} {rarityText}
        </Typography>
      );
    } else {
      return (
        <Typography variant="body2" component="span">
          {action} {bulkSummary.cardsAffected} {rarityText}{quantityText ? ` to ${quantityText}` : ''}
        </Typography>
      );
    }
  }

  // For other operations (import), keep the existing format
  return null;
};

const HistoryEntryItem = ({ entry, userId }: { entry: HistoryEntry; userId: number }) => {
  return (
    <EntryItem>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: '60px', flexShrink: 0 }}>
          {formatTime(entry.timestamp)}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', flexGrow: 1 }}>
          <OperationChip
            label={getOperationLabel(entry.operationType)}
            size="small"
            operationType={entry.operationType}
          />
          {entry.mode && <ModeChip label={getModeLabel(entry.mode, entry)} size="small" />}
        </Box>
      </Box>

      {/* Only show description for nuke operations */}
      {entry.operationType === 'nuke' && (
        <Typography variant="body2" sx={{ mb: 1, ml: '76px' }}>
          {entry.description}
        </Typography>
      )}

      {(entry.operationType === 'import' || entry.card || entry.location || entry.quantities || (entry.bulkSummary && entry.operationType !== 'nuke')) && (
        <Box sx={{ ml: '76px', display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {entry.card && entry.set && (
            <Typography variant="body2" component="span">
              <Link
                href={getCollectionCardUrl(userId, generateCardSlug(entry.card.name), entry.card.id)}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {entry.card.name}
              </Link>
              {' '}(
              <Link
                href={getCollectionSetUrl(userId.toString(), entry.set.slug)}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {entry.set.name}
              </Link>
              )
            </Typography>
          )}
          {/* Show location bullet only for single-card location operations, not bulk operations */}
          {entry.location && entry.operationType !== 'location-mass-update' && (
            <Typography variant="body2" component="span">
              •{' '}
              <Link
                href={`${getCollectionUrl({ userId, contentType: 'cards' })}&locationId=${entry.location.id}`}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {entry.location.name}
              </Link>
            </Typography>
          )}
          {entry.quantities && (
            <>
              {(entry.quantities.regular.before !== entry.quantities.regular.after) && (
                <Typography variant="body2" component="span">
                  • Regular: {entry.quantities.regular.before ?? 0} → {entry.quantities.regular.after ?? 0}
                </Typography>
              )}
              {(entry.quantities.foil.before !== entry.quantities.foil.after) && (
                <Typography variant="body2" component="span">
                  • Foil: {entry.quantities.foil.before ?? 0} → {entry.quantities.foil.after ?? 0}
                </Typography>
              )}
            </>
          )}
          {/* Use natural sentence format for mass-update, mass-entry, and location-mass-update */}
          {(entry.operationType === 'mass-update' || entry.operationType === 'mass-entry' || entry.operationType === 'location-mass-update') &&
           formatBulkOperationSummary(entry, userId)}
          {/* Keep bullet format for import only */}
          {entry.bulkSummary && entry.operationType === 'import' && (
            <Typography variant="body2" component="span">
              • {entry.bulkSummary.cardsAffected} cards
            </Typography>
          )}
        </Box>
      )}
    </EntryItem>
  );
};

interface GroupedHistory {
  date: string;
  dateKey: string;
  entries: HistoryEntry[];
}

const DayGroup = ({ group, userId }: { group: GroupedHistory; userId: number }) => {
  return (
    <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 2 }}>
        {group.date}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box>
        {group.entries.map((entry) => (
          <HistoryEntryItem key={entry.id} entry={entry} userId={userId} />
        ))}
      </Box>
    </Paper>
  );
};

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const router = useRouter();
  const { data, isLoading, isError, error } = useGetCollectionHistoryQuery({ limit: 100 });

  const history = data?.data?.history || [];

  // Group history by date and merge consecutive imports
  const groupedHistory = useMemo(() => {
    const groups: Record<string, GroupedHistory> = {};

    // First, merge consecutive imports within 1 minute
    const mergedHistory: HistoryEntry[] = [];
    let i = 0;

    while (i < history.length) {
      const entry = history[i];

      // Check if this is an import and if we should merge with following imports
      if (entry.operationType === 'import' && entry.bulkSummary) {
        const importGroup: HistoryEntry[] = [entry];
        let totalCards = entry.bulkSummary.cardsAffected;
        let j = i + 1;

        // Look ahead for consecutive imports within 1 minute with the same mode
        while (j < history.length) {
          const nextEntry = history[j];
          if (nextEntry.operationType === 'import' && nextEntry.bulkSummary && nextEntry.mode === entry.mode) {
            const timeDiff = Math.abs(
              new Date(entry.timestamp).getTime() - new Date(nextEntry.timestamp).getTime()
            );
            // Within 1 minute (60000 ms) and same mode
            if (timeDiff <= 60000) {
              importGroup.push(nextEntry);
              totalCards += nextEntry.bulkSummary.cardsAffected;
              j++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        // Create merged import entry
        const mergedEntry: HistoryEntry = {
          ...entry,
          bulkSummary: {
            ...entry.bulkSummary,
            cardsAffected: totalCards,
          },
        };

        mergedHistory.push(mergedEntry);
        i = j;
      } else {
        mergedHistory.push(entry);
        i++;
      }
    }

    // Then group by date
    mergedHistory.forEach((entry) => {
      const dateKey = getDateKey(entry.timestamp);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: formatDate(entry.timestamp),
          dateKey,
          entries: [],
        };
      }
      groups[dateKey].entries.push(entry);
    });

    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => {
      return new Date(b.dateKey).getTime() - new Date(a.dateKey).getTime();
    });
  }, [history]);

  const totalPages = Math.ceil(groupedHistory.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedGroups = groupedHistory.slice(startIndex, endIndex);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Alert severity="error">
          Failed to load collection history. {error && 'message' in error ? String(error.message) : 'Please try again later.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
        Collection History
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Your most recent collection changes. Only the last 100 operations are saved.
      </Typography>

      {groupedHistory.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <HistoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No collection history yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start making changes to your collection to see them tracked here.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push('/collections/edit-cards')}
          >
            Add or Remove Cards
          </Button>
        </Paper>
      ) : (
        <>
          {paginatedGroups.map((group) => (
            <DayGroup key={group.dateKey} group={group} userId={user?.userId || 0} />
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
        </>
      )}
    </Box>
  );
}
