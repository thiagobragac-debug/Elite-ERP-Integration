/**
 * Returns today's date in YYYY-MM-DD format using local time (system timezone).
 * This avoids the timezone offset shift caused by new Date().toISOString().
 */
export const getTodayStr = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts a given Date or string to a local date string in YYYY-MM-DD format.
 */
export const getLocalDateStr = (dateInput?: Date | string | null): string => {
  if (!dateInput) return getTodayStr();
  // If it's a YYYY-MM-DD string already, return it directly to avoid parser timezone shift
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return getTodayStr();
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
