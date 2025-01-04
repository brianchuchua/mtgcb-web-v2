'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function WithAuthComponent(props: T) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return null; // TODO: Bring in a loading spinner
    }

    if (!isAuthenticated) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
