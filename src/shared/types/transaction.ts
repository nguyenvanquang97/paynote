export interface ParsedTransaction {
  amount: number;
  balanceAfter?: number;
  description?: string;
  transactionType: 'income' | 'expense';
  timestamp: number;
  rawText: string;
}

export interface Transaction extends ParsedTransaction {
  id: string;
  bank: string;
  category?: string;
  isSuspectedGap: boolean;
  createdAt: number;
}

export interface BankNotification {
  packageName: string;
  title: string | null;
  text: string | null;
}
