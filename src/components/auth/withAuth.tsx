'use client';

import { Box, CircularProgress } from '@mui/material';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function WithAuthComponent(props: T) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        const currentPath =
          pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
        const encodedPath = encodeURIComponent(currentPath);
        router.push(`/login?redirectTo=${encodedPath}`);
      }
    }, [isAuthenticated, isLoading, router, pathname, searchParams]);

    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
