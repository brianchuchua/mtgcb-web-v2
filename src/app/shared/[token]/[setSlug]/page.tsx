'use client';

import { useEffect, useState } from 'react';
import { CollectionSetClient } from '@/app/collections/[userId]/[setSlug]/CollectionSetClient';
import { useResolveShareTokenMutation } from '@/api/user/shareLinkApi';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import { Box, CircularProgress } from '@mui/material';
import { smartDecodeToken } from '@/utils/tokenEncoder';

interface SharedSetPageProps {
  params: Promise<{
    token: string;
    setSlug: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function SharedSetPage({ 
  params, 
  searchParams 
}: SharedSetPageProps) {
  const [token, setToken] = useState<string>('');
  const [setSlug, setSetSlug] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<any>(null);
  const [isParamsReady, setIsParamsReady] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  const [resolveShareToken] = useResolveShareTokenMutation();

  useEffect(() => {
    Promise.all([params, searchParams]).then(([p, sp]) => {
      setToken(p.token);
      setSetSlug(p.setSlug);
      setResolvedParams(sp);
      setIsParamsReady(true);
    });
  }, [params, searchParams]);
  
  useEffect(() => {
    if (token) {
      // Decode the token if it's been encoded
      const decodedToken = smartDecodeToken(token);
      
      resolveShareToken({ shareToken: decodedToken })
        .unwrap()
        .then((data) => {
          setShareData(data);
          setIsLoading(false);
          
          // Store the userId in sessionStorage for useShareToken hook
          if (data?.userId) {
            sessionStorage.setItem('mtgcb_share_user', data.userId.toString());
          }
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }
  }, [token, resolveShareToken]);

  if (!isParamsReady || isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !shareData) {
    return (
      <Box sx={{ p: 3 }}>
        <InvalidShareLinkBanner username="" />
      </Box>
    );
  }

  const userId = shareData?.userId ? parseInt(shareData.userId.toString(), 10) : null;

  if (!userId) {
    return (
      <Box sx={{ p: 3 }}>
        <InvalidShareLinkBanner username="" />
      </Box>
    );
  }

  return <CollectionSetClient userId={userId} setSlug={setSlug} />;
}