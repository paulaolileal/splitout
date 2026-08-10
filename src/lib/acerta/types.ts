export type SplitType = "equal" | "item" | "custom" | "weight";

export interface Participant {
  id: string;
  name: string;
}

export interface ExpenseItem {
  id: string;
  description: string;
  /** cents */
  amount: number;
  participantIds: string[];
}

export interface Allocation {
  participantId: string;
  /** cents */
  amount: number;
}

export interface Weight {
  participantId: string;
  weight: number;
}

export interface Expense {
  id: string;
  description: string;
  emoji: string;
  /** cents */
  totalAmount: number;
  paidBy: string;
  splitType: SplitType;
  /** used by "equal" */
  sharedWith: string[];
  items: ExpenseItem[];
  /** used by "custom" */
  allocations: Allocation[];
  /** used by "weight" */
  weights: Weight[];
}

export interface Party {
  id: string;
  name: string;
  emoji: string;
  /** ISO yyyy-mm-dd */
  date: string;
  participants: Participant[];
  expenses: Expense[];
  createdAt: number;
  updatedAt: number;
}

export interface Balance {
  participantId: string;
  paid: number;
  owed: number;
  /** paid - owed */
  balance: number;
}

export interface Transfer {
  from: string;
  to: string;
  amount: number;
}