'use client';

import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CollectionClient } from '@/app/collections/[userId]/CollectionClient';
import { useResolveShareTokenMutation } from '@/api/user/shareLinkApi';
import { InvalidShareLinkBanner } from '@/components/collections/InvalidShareLinkBanner';
import { Box, CircularProgress } from '@mui/material';
import { smartDecodeToken } from '@/utils/tokenEncoder';

interface SharedCollectionPageProps {
  params: Promise<{
    token: string;
  }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function SharedCollectionPage({ 
  params, 
  searchParams 
}: SharedCollectionPageProps) {
  const [token, setToken] = useState<string>('');
  const [resolvedParams, setResolvedParams] = useState<any>(null);
  const [isParamsReady, setIsParamsReady] = useState(false);
  const [shareData, setShareData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  
  const [resolveShareToken] = useResolveShareTokenMutation();

  useEffect(() => {
    Promise.all([params, searchParams]).then(([p, sp]) => {
      setToken(p.token);
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

  return <CollectionClient userId={userId} />;
}