export type MonthKey =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

export type ProjectionCategory =
  | 'Payroll'
  | 'Operations'
  | 'Taxes & Obligations'
  | 'Reserves / Stability'
  | 'Opportunities'
  | 'Investments'
  | 'Debt / Loans'
  | 'Vendors'
  | 'Marketing'
  | 'Legal / Compliance';

export interface Account {
  id: string;
  name: string;
  percentage: number;
  balance: number;
  color: string;
  enabled: boolean;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  date: string;
  distributions: Record<string, number>;
  createdAt: string;
}

export interface Payment {
  id: string;
  accountId: string;
  amount: number;
  description: string;
  date: string;
  projectionId?: string;
  createdAt: string;
}

export interface Projection {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ProjectionCategory;
  kind: 'fixed' | 'installment';
  accountId: string;
  month: MonthKey;
  paidAmount: number;
  groupId: string;
  installmentIndex: number;
  installmentTotal: number;
  createdAt: string;
}

export interface MentorMessage {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'success';
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'income' | 'payment' | 'projection' | 'settings';
  description: string;
  createdAt: string;
}

export interface DeletedItem {
  id: string;
  entityType: 'income' | 'payment' | 'projection';
  data: Income | Payment | Projection;
  deletedAt: string;
}

export interface FinanceState {
  accounts: Account[];
  incomes: Income[];
  payments: Payment[];
  projections: Projection[];
  mentorMessages: MentorMessage[];
  activities: Activity[];
  deletedItems: DeletedItem[];
}
