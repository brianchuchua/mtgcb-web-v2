export const formatDistanceToNow = (date: Date | string, options?: { addSuffix?: boolean }): string => {
  // If it's a string, assume it's UTC from the database
  let targetDate: Date;
  if (typeof date === 'string') {
    // Backend sends format like "2025-08-06 23:59:42.449" in UTC
    // Parse as UTC using Date.UTC
    const [datePart, timePart] = date.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, secondWithMs] = timePart.split(':');
    const [second, ms = 0] = secondWithMs.split('.').map(Number);
    
    targetDate = new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute), second, ms));
  } else {
    targetDate = date;
  }
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  const isPast = diffMs < 0;
  const addSuffix = options?.addSuffix !== false; // Default to true if not specified
  const prefix = addSuffix ? (isPast ? '' : 'in ') : '';
  const suffix = addSuffix ? (isPast ? ' ago' : '') : '';
  
  if (diffYears > 0) {
    return `${prefix}${diffYears} year${diffYears === 1 ? '' : 's'}${suffix}`;
  }
  if (diffMonths > 0) {
    return `${prefix}${diffMonths} month${diffMonths === 1 ? '' : 's'}${suffix}`;
  }
  if (diffDays > 0) {
    return `${prefix}${diffDays} day${diffDays === 1 ? '' : 's'}${suffix}`;
  }
  if (diffHours > 0) {
    return `${prefix}${diffHours} hour${diffHours === 1 ? '' : 's'}${suffix}`;
  }
  if (diffMinutes > 0) {
    return `${prefix}${diffMinutes} minute${diffMinutes === 1 ? '' : 's'}${suffix}`;
  }
  return `${prefix}a few seconds${suffix}`;
};

export const parseISO = (dateString: string): Date => {
  // If it looks like "2025-08-06 23:59:42.449", parse as UTC
  if (dateString.includes(' ')) {
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, secondWithMs] = timePart.split(':');
    const [second, ms = 0] = secondWithMs.split('.').map(Number);
    
    return new Date(Date.UTC(year, month - 1, day, Number(hour), Number(minute), second, ms));
  }
  
  // Otherwise parse normally (for ISO format)
  return new Date(dateString);
};

export const format = (date: Date | string, formatStr: string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Simple format implementation
  if (formatStr === 'PPP') {
    // Long date format
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  return d.toLocaleDateString();
};