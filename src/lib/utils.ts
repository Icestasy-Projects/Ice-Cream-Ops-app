import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseSupabaseError(error: string | null | undefined): string {
  if (!error) return 'Something went wrong. Please try again.';

  const stockMatch = error.match(/Insufficient stock.*?(\w+_product_id|ingredient_id)\s+(\d+)\s+at\s+(\w+)\s+would go to\s+([-\d.]+)/i);
  if (stockMatch) {
    const location = stockMatch[3] === 'factory' ? 'factory' : 'kitchen';
    return `Not enough stock at the ${location} to complete this action. Check the stock dashboard and either transfer more or make a new batch first.`;
  }

  if (error.toLowerCase().includes('insufficient stock')) {
    return 'Not enough stock to complete this action. Check the stock levels and try again.';
  }

  if (error.toLowerCase().includes('violates foreign key')) {
    return 'One of the items selected no longer exists. Please refresh and try again.';
  }

  if (error.toLowerCase().includes('violates not-null')) {
    return 'Some required information is missing. Please fill in all fields.';
  }

  return 'Something went wrong. Please try again or contact support.';
}

export function formatNumber(n: number, decimals = 1): string {
  if (n === Math.floor(n)) return n.toString();
  return n.toFixed(decimals);
}
