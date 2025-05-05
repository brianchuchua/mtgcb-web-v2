'use client';

/**
 * Formats a number as a USD currency string
 * @param price - The price to format
 * @returns Formatted price string (e.g. "$10.99")
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
};