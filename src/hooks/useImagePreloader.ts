'use client';

import { useEffect, useRef } from 'react';
import { CardItemProps } from '@/components/cards/CardItem';

const getCardImageUrl = (id: string, cacheBuster: string) =>
  `https://mtgcb-images.s3.amazonaws.com/cards/images/normal/${id}.jpg?v=${cacheBuster}`;

export function useImagePreloader(
  nextPageCards: CardItemProps[] | null | undefined,
  isLoading: boolean,
  maxImagesToPreload = 8,
  cacheBuster = process.env.NEXT_PUBLIC_IMAGE_CACHE_DATE || '20241220',
) {
  const preloadedImagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!nextPageCards || isLoading || typeof window === 'undefined') return;

    const preloadTimer = setTimeout(() => {
      const cardsToPreload = nextPageCards.slice(0, maxImagesToPreload);

      cardsToPreload.forEach((card) => {
        const { id, name } = card;

        if (preloadedImagesRef.current.has(id)) return;

        const img = new Image();

        img.onload = () => preloadedImagesRef.current.add(id);
        img.onerror = () => preloadedImagesRef.current.add(id);
        img.src = getCardImageUrl(id, cacheBuster);
      });
    }, 1000);

    return () => clearTimeout(preloadTimer);
  }, [nextPageCards, isLoading, maxImagesToPreload, cacheBuster]);
}
