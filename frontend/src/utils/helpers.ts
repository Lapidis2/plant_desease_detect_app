import { format, formatDistanceToNow } from 'date-fns';

// Format date for display
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy');
  } catch {
    return dateString;
  }
};

// Format date relative (e.g., "2 hours ago")
export const formatRelativeDate = (dateString: string): string => {
  try {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  } catch {
    return dateString;
  }
};

// Get severity color based on level
export const getSeverityColor = (
  severity: 'mild' | 'moderate' | 'severe',
  colors: { severityMild: string; severityModerate: string; severitySevere: string }
): string => {
  switch (severity) {
    case 'mild':
      return colors.severityMild;
    case 'moderate':
      return colors.severityModerate;
    case 'severe':
      return colors.severitySevere;
    default:
      return colors.severityModerate;
  }
};

// Get health status color
export const getHealthColor = (
  score: number,
  colors: { success: string; warning: string; error: string }
): string => {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.error;
};

// Truncate text with ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
};

// Clean base64 string
export const cleanBase64 = (base64: string): string => {
  if (base64.includes(',')) {
    return base64.split(',')[1];
  }
  return base64;
};

// Get priority color
export const getPriorityColor = (
  priority: 'high' | 'medium' | 'low',
  colors: { error: string; warning: string; info: string }
): string => {
  switch (priority) {
    case 'high':
      return colors.error;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.info;
    default:
      return colors.info;
  }
};
