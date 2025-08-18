'use client';

import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useState } from 'react';

export default function TestOGPage() {
  const [userId, setUserId] = useState('1337');
  const [shareToken, setShareToken] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const generatePreview = () => {
    const params = new URLSearchParams();
    params.set('userId', userId);
    if (shareToken) {
      params.set('shareToken', shareToken);
    }
    setImageUrl(`/api/og/collection?${params.toString()}`);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1400, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        OpenGraph Preview Tester
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} size="small" />
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
          Test different user IDs to see how the OpenGraph image looks for different collections. Add a share token if
          testing private collection access.
        </Typography>
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
              Collection Page: <code>/collections/{userId}</code>
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
