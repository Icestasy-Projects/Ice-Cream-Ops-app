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
    const col = error.match(/column "([^"]+)"/)?.[1];
    return col
      ? `Database error: required field "${col}" is missing a value. Contact support.`
      : `Database error: a required field has no value. ${error}`;
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

// Litres per unit for each known pack format
const LITRES_PER_UNIT: Record<string, number> = {
  '4L Bulk':      4,
  '12 Square':    1.8,   // 12 × 150ml
  '50ml Samples': 0.05,
  '500ml':        0.5,
};

export function litresToUnits(litres: number, unit: string): number {
  const lpu = LITRES_PER_UNIT[unit];
  if (!lpu || lpu <= 0) return litres;
  return Math.floor(litres / lpu);
}

export function unitLabel(unit: string): string {
  if (unit === '4L Bulk') return 'Bulks';
  if (unit === '12 Square') return 'Sq packs';
  if (unit === '50ml Samples') return 'Samples';
  if (unit === '500ml') return 'Units';
  return unit;
}

export function formatNumber(n: number | null | undefined, decimals = 1): string {
  if (n == null || isNaN(n)) return '0';
  if (n === Math.floor(n)) return n.toString();
  return n.toFixed(decimals);
}
