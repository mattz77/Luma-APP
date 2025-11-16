export type HouseMemberRole = 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

export interface House {
  id: string;
  name: string;
  address: string | null;
  photoUrl: string | null;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface HouseMember {
  id: string;
  houseId: string;
  userId: string;
  role: HouseMemberRole;
  joinedAt: string;
  isActive: boolean;
}

export interface HouseMemberWithUser extends HouseMember {
  user: User;
}

export interface UserHouse {
  house: House;
  membership: HouseMember;
}

export interface ExpenseCategory {
  id: string;
  houseId: string;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  houseId: string;
  categoryId: string | null;
  createdById: string;
  amount: string;
  description: string;
  expenseDate: string;
  receiptUrl: string | null;
  isRecurring: boolean;
  recurrencePeriod: string | null;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  category?: ExpenseCategory | null;
  splits?: ExpenseSplit[];
  createdBy?: User | null;
}

export interface ExpenseSplit {
  id: string;
  expenseId: string;
  userId: string;
  amount: string;
  isPaid: boolean;
  user?: User | null;
}

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Task {
  id: string;
  houseId: string;
  createdById: string;
  assignedToId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  isRecurring: boolean;
  recurrence: string | null;
  tags: string[];
  points: number;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  creator?: User | null;
}

export interface Conversation {
  id: string;
  houseId: string;
  userId: string;
  message: string;
  response: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

