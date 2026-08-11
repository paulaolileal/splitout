export type SplitType = "equal" | "exclusive" | "custom";

/** Only meaningful when `splitType === "custom"`. */
export type CustomMode = "amount" | "percentage";

export interface Participant {
  id: string;
  name: string;
  /** Optional — copied from a registered `Person` (or typed ad-hoc), never a live reference. */
  phone?: string;
}

export interface Allocation {
  participantId: string;
  /** cents */
  amount: number;
}

export interface Percentage {
  participantId: string;
  /** 0-100 */
  percent: number;
}

export interface Expense {
  id: string;
  description: string;
  emoji: string;
  /** cents */
  totalAmount: number;
  paidBy: string;
  splitType: SplitType;
  /** used by "equal" (any size) and "exclusive" (exactly one id) */
  sharedWith: string[];
  /** meaningful only when splitType === "custom" */
  customMode: CustomMode;
  /** used by "custom" + "amount" */
  allocations: Allocation[];
  /** used by "custom" + "percentage" */
  percentages: Percentage[];
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

/** A person registered once and reusable across parties — copied into a
 * `Participant` (name + phone) when added to a party, never referenced live. */
export interface Person {
  id: string;
  name: string;
  phone?: string;
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
