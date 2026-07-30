export type Role = 'admin' | 'accountant' | 'teacher' | 'parent' | 'student' | 'transport';

export interface RoleConfig {
  id: Role;
  label: string;
  description: string;
  icon: string;
  gradient: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
}

export interface GoogleAccount {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface StatCard {
  id: string;
  label: string;
  value: string;
  delta?: string;
  deltaPositive?: boolean;
  icon: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  type: 'credit' | 'debit';
  date: string;
  status: 'success' | 'pending' | 'failed';
  category?: string;
  avatar?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: string;
}

export interface StudentRecord {
  id: string;
  name: string;
  avatar: string;
  className: string;
  rollNo: string;
  feeStatus: 'paid' | 'due' | 'overdue';
  feeDue: number;
  attendance: number;
  guardian: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'exam' | 'holiday' | 'event' | 'meeting';
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
