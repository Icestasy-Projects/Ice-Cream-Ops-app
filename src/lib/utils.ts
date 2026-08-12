import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSupabaseError(error: string | null | undefined): string {
  if (!error) return 'Something went wrong. Please try again.';

  const lower = error.toLowerCase();

  // Insufficient stock — extract item name / qty if present
  const stockMatch = error.match(/Insufficient stock[^:]*:\s*(.+)/i);
  if (stockMatch) return `Not enough stock — ${stockMatch[1].trim()}`;

  if (lower.includes('insufficient stock') || lower.includes('not enough stock')) {
    return `Not enough RM stock to make this batch. Check raw material levels before proceeding.`;
  }

  if (lower.includes('violates foreign key')) {
    return 'One of the items selected no longer exists. Please refresh and try again.';
  }

  if (lower.includes('violates not-null')) {
    return 'Some required information is missing. Please fill in all fields.';
  }

  if (lower.includes('does not exist') || lower.includes('relation') || lower.includes('undefined function')) {
    return `Database error: ${error}`;
  }

  if (lower.includes('permission denied')) {
    return `Permission denied: ${error}`;
  }

  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return `Duplicate entry — ${error}`;
  }

  // Pass through the raw message so users/admins can see what actually failed
  return error.length < 300 ? error : error.slice(0, 300) + '…';
}

export function formatNumber(n: number, decimals = 1): string {
  if (n === Math.floor(n)) return n.toString();
  return n.toFixed(decimals);
}
