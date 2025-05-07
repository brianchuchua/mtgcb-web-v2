/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string or any valid date format
 * @param options DateTimeFormatOptions for customizing the output format
 * @returns Formatted date string or 'Unknown' if the date is invalid
 */
export const formatDate = (
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string => {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }

    return date.toLocaleDateString('en-US', options);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid date';
  }
};

/**
 * Format a date string to YYYY-MM-DD format (ISO date without time)
 * @param dateString ISO date string or any valid date format
 * @param fallback Value to return if date is invalid or null (defaults to empty string)
 * @returns Date in YYYY-MM-DD format or fallback value if invalid
 */
export const formatISODate = (
  dateString: string | null | undefined,
  fallback: string = '',
): string => {
  if (!dateString) return fallback;

  try {
    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }

    // Format to YYYY-MM-DD by splitting ISO string at 'T'
    return date.toISOString().split('T')[0];
  } catch (e) {
    console.error('Error formatting ISO date:', e);
    return fallback;
  }
};
