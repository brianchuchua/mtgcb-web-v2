'use client';

import { Box, Button, Paper, TextField, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState } from 'react';

export default function TestOGPage() {
  const [userId, setUserId] = useState('1337');
  const [shareToken, setShareToken] = useState('');
  const [setSlug, setSetSlug] = useState('');
  const [cardId, setCardId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [previewType, setPreviewType] = useState('collection');
  const [imageUrl, setImageUrl] = useState('');

  const generatePreview = () => {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (shareToken) {
      params.set('shareToken', shareToken);
    }

    let url = '';
    switch (previewType) {
      case 'collection':
        url = `/api/og/collection?${params.toString()}`;
        break;
      case 'set':
        if (!setSlug) {
          alert('Please enter a set slug');
          return;
        }
        params.set('setSlug', setSlug);
        url = `/api/og/set?${params.toString()}`;
        break;
      case 'card':
        if (!cardId) {
          alert('Please enter a card ID');
          return;
        }
        params.set('cardId', cardId);
        url = `/api/og/card?${params.toString()}`;
        break;
      case 'goal':
        if (!goalId) {
          alert('Please enter a goal ID');
          return;
        }
        params.set('goalId', goalId);
        url = `/api/og/goal?${params.toString()}`;
        break;
    }

    setImageUrl(url);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        OpenGraph Preview Tester
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Preview Type</InputLabel>
            <Select
              value={previewType}
              label="Preview Type"
              onChange={(e) => setPreviewType(e.target.value)}
            >
              <MenuItem value="collection">Collection</MenuItem>
              <MenuItem value="set">Set</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="goal">Goal</MenuItem>
            </Select>
          </FormControl>

          <TextField 
            label="User ID" 
            value={userId} 
            onChange={(e) => setUserId(e.target.value)} 
            size="small" 
          />

          {previewType === 'set' && (
            <TextField
              label="Set Slug (e.g., foundations)"
              value={setSlug}
              onChange={(e) => setSetSlug(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
          )}

          {previewType === 'card' && (
            <TextField
              label="Card ID"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            />
          )}

          {previewType === 'goal' && (
            <TextField
              label="Goal ID"
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              size="small"
              sx={{ minWidth: 150 }}
            />
          )}

          <TextField
            label="Share Token (optional)"
            value={shareToken}
            onChange={(e) => setShareToken(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />

          <Button variant="contained" onClick={generatePreview}>
            Generate Preview
          </Button>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Test different preview types: Collection overview, specific set, or specific card. Add a share token if
          testing private collection access.
        </Typography>

        {previewType === 'set' && (
          <Typography variant="body2" color="text.secondary">
            Example set slugs: foundations, duskmourn-house-of-horror, the-lost-caverns-of-ixalan
          </Typography>
        )}

        {previewType === 'card' && (
          <Typography variant="body2" color="text.secondary">
            Enter a card ID to preview how it appears in the collection
          </Typography>
        )}

        {previewType === 'goal' && (
          <Typography variant="body2" color="text.secondary">
            Enter a goal ID to preview the goal progress
          </Typography>
        )}
      </Paper>

      {imageUrl && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Preview (1200x630)
          </Typography>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 1200,
              aspectRatio: '1200/630',
              border: '1px solid #ddd',
              borderRadius: 1,
              overflow: 'hidden',
            }}
          >
            <img
              src={imageUrl}
              alt="OpenGraph Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Direct URL: <code>{imageUrl}</code>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {previewType === 'collection' && `Collection Page: /collections/${userId}`}
              {previewType === 'set' && `Set Page: /collections/${userId}/${setSlug}`}
              {previewType === 'card' && `Card Page: /collections/${userId}/cards/[cardSlug]/${cardId}`}
              {previewType === 'goal' && `Goal Page: /collections/${userId}?goalId=${goalId}`}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}