export type PaymentType = 0 | 1; // 0 = Income, 1 = Expense

export type Record = {
  id: number;
  title: string;
  category: string;
  description: string;
  amount: number;
  paymentType: PaymentType;
  date: string; // YYYY-MM-DD
  createdAt: string;
  updatedAt: string;
  firstImageUri?: string | null;
  hasImages?: boolean;
};

export type RecordImage = {
  id: number;
  recordId: number;
  uri: string;
  sortOrder: number;
};

export type Category = {
  id: number;
  name: string;
  sortOrder: number;
};

export type RecordFilter = {
  titleQuery?: string;
  categoryFilter?: string;
  paymentTypeFilter?: PaymentType | null;
  descriptionQuery?: string;
  amountMin?: number | null;
  amountMax?: number | null;
  dateStart?: string | null;
  dateEnd?: string | null;
  sortBy?: 'date' | 'title' | 'amount' | 'category' | 'type';
  sortDescending?: boolean;
};
