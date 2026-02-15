import { Account, MonthKey, ProjectionCategory } from '../types/finance';

export const STORAGE_KEY = 'mente-milionaria-pj-v3';

export const MONTHS: MonthKey[] = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];

export const PROJECTION_CATEGORIES: ProjectionCategory[] = [
  'Payroll',
  'Operations',
  'Taxes & Obligations',
  'Reserves / Stability',
  'Opportunities',
  'Investments',
  'Debt / Loans',
  'Vendors',
  'Marketing',
  'Legal / Compliance'
];

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'pro-labore', name: 'Pro-labore', percentage: 20, balance: 0, color: '#5B8DEF', enabled: true },
  { id: 'operational', name: 'Operational', percentage: 25, balance: 0, color: '#4CB782', enabled: true },
  { id: 'taxes', name: 'Taxes & Obligations', percentage: 25, balance: 0, color: '#F39C4A', enabled: true },
  { id: 'reserves', name: 'Reserves / Stability', percentage: 20, balance: 0, color: '#8E63D9', enabled: true },
  { id: 'opportunities', name: 'Opportunities', percentage: 10, balance: 0, color: '#DE5D83', enabled: true },
  { id: 'profit', name: 'Profit', percentage: 0, balance: 0, color: '#2E4057', enabled: false }
];
