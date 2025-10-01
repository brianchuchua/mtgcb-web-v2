/**
 * Parse a date string that may be in MySQL datetime format (UTC) or ISO format
 * @param dateString Date string in various formats
 * @returns Date object
 */
const parseDate = (dateString: string): Date => {
  // Check if it's MySQL datetime format: "2025-10-01 02:00:02.303"
  // Backend sends these as UTC but without timezone indicator
  if (dateString.includes(' ') && !dateString.includes('T')) {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, secondWithMs] = timePart.split(':');
    const [second, ms = 0] = secondWithMs.split('.').map(Number);

    // Parse as UTC
    return new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute), second, ms));
  }

  // Otherwise parse normally (ISO 8601 format with Z or timezone)
  return new Date(dateString);
};

/**
 * Format a date string to a human-readable format
 * @param dateString ISO date string or MySQL datetime format (UTC)
 * @param options DateTimeFormatOptions for customizing the output format
 * @returns Formatted date string or 'Unknown' if the date is invalid
 */
export const formatDate = (
  dateString: string | null | undefined,
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' },
): string => {
  if (!dateString) return 'Unknown';

  try {
    const date = parseDate(dateString);

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
 * Format a date string to YYYY-MM-DD format in the user's local timezone
 * @param dateString ISO date string or MySQL datetime format (UTC)
 * @param fallback Value to return if date is invalid or null (defaults to empty string)
 * @returns Date in YYYY-MM-DD format using local timezone, or fallback value if invalid
 */
export const formatISODate = (
  dateString: string | null | undefined,
  fallback: string = '',
): string => {
  if (!dateString) return fallback;

  try {
    const date = parseDate(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }

    // Format to YYYY-MM-DD using local timezone components
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error('Error formatting ISO date:', e);
    return fallback;
  }
};
