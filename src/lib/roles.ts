export type AppRole = 'kitchen' | 'factory' | 'super_admin';

export interface NavItem {
  href: string;
  label: string;
  group: string;
}

const ALL_NAV: NavItem[] = [
  // Kitchen
  { href: '/dashboards/raw-materials', label: 'RM Stock', group: 'Kitchen' },
  { href: '/receive', label: 'Receive Ingredients', group: 'Kitchen' },
  { href: '/make-prep', label: 'Make Kitchen Mix', group: 'Kitchen' },
  { href: '/transfer', label: 'Transfer to Factory', group: 'Kitchen' },
  // Factory
  { href: '/dashboards/prep', label: 'Prep Stock', group: 'Factory' },
  { href: '/make-tubs', label: 'Make Tubs', group: 'Factory' },
  { href: '/break-bulk', label: 'Break Bulk', group: 'Factory' },
  { href: '/dashboards/finished-goods', label: 'FG Stock', group: 'Factory' },
  { href: '/dispatch', label: 'Dispatch Order', group: 'Factory' },
  // Admin
  { href: '/admin/flavours', label: 'Manage Flavours', group: 'Admin' },
  { href: '/admin/users', label: 'Manage Employees', group: 'Admin' },
];

const KITCHEN_HREFS = new Set([
  '/dashboards/raw-materials',
  '/receive',
  '/make-prep',
  '/transfer',
]);

const FACTORY_HREFS = new Set([
  '/dashboards/prep',
  '/make-tubs',
  '/break-bulk',
  '/dashboards/finished-goods',
  '/dispatch',
]);

const ADMIN_HREFS = new Set(['/admin/flavours', '/admin/users']);

export function getNavItemsForRole(role: AppRole | null): NavItem[] {
  if (!role) return [];
  if (role === 'super_admin') return ALL_NAV;
  if (role === 'kitchen') return ALL_NAV.filter(n => KITCHEN_HREFS.has(n.href));
  if (role === 'factory') return ALL_NAV.filter(n => FACTORY_HREFS.has(n.href));
  return [];
}

export function canAccess(role: AppRole | null, href: string): boolean {
  if (!role) return false;
  if (role === 'super_admin') return true;
  if (role === 'kitchen') return KITCHEN_HREFS.has(href) || href === '/dashboard';
  if (role === 'factory') return FACTORY_HREFS.has(href) || href === '/dashboard';
  return false;
}

export const ROLE_LABELS: Record<AppRole, string> = {
  kitchen: 'Kitchen Staff',
  factory: 'Factory Staff',
  super_admin: 'Super Admin',
};
