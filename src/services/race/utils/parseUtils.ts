/**
 * Utility functions for parsing race data values
 */

export const parseNumber = (value: any): number => {
  if (!value || value === 'NR' || value === '-') {
    return 0; // Default value for non-runners or invalid numbers
  }
  const parsed = parseInt(value);
  return isNaN(parsed) ? 0 : parsed;
};