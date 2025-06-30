import { Roommate, Bill } from '../types';
import { User } from '@supabase/supabase-js';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (dateString: string): string => {
  // Handle date strings in YYYY-MM-DD format by adding time to ensure local timezone interpretation
  const date = dateString.includes('T') 
    ? new Date(dateString) 
    : new Date(dateString + 'T00:00:00');
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const isOverdue = (dueDate: string): boolean => {
  return new Date(dueDate) < new Date();
};

export const getRoommateName = (roommateId: string, roommates: Roommate[], user?: User | null): string => {
  // If the roommateId matches the current user, prioritize their Supabase profile name
  if (user && roommateId === user.id) {
    return user.user_metadata?.name || user.email?.split('@')[0] || 'You';
  }
  
  // Look up in roommates array
  const roommate = roommates.find(r => r.id === roommateId);
  if (roommate) {
    return roommate.name;
  }
  
  // If not found in roommates but we have a user ID that looks like a UUID, 
  // it might be a valid user that just hasn't been loaded yet
  if (roommateId && roommateId.length === 36 && roommateId.includes('-')) {
    return 'Roommate'; // More friendly than 'Unknown'
  }
  
  return 'Unknown';
};

export const getRoommateAvatar = (roommateId: string, roommates: Roommate[]): string => {
  const roommate = roommates.find(r => r.id === roommateId);
  return roommate?.avatarUrl || '👤';
};

export const calculateBillAmount = (bill: Bill, forRoommateId: string): number => {
  // If you paid the bill, you're owed money back (negative amount)
  if (bill.paidBy === forRoommateId) {
    if (bill.fullOwedBy && bill.fullOwedBy !== forRoommateId) {
      // Someone else owes the full amount, so you're owed the full amount
      return -bill.totalAmount;
    }
    
    if (bill.splitBetween) {
      // Calculate how much you're owed back from others
      const yourShare = bill.totalAmount / bill.splitBetween.length;
      const othersShare = bill.totalAmount - yourShare;
      return -othersShare; // Negative because you're owed money
    }
    
    return 0;
  }
  
  // If someone else owes the full amount
  if (bill.fullOwedBy === forRoommateId) {
    return bill.totalAmount; // You owe the full amount
  }
  
  // If it's split and you're included
  if (bill.splitBetween && bill.splitBetween.includes(forRoommateId)) {
    return bill.totalAmount / bill.splitBetween.length; // You owe your share
  }
  
  return 0; // You're not involved in this bill
};

export const getTimeAgo = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / 60000);
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return formatDate(timestamp);
};

export const avatarEmojis = [
  '🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐸', '🐷',
  '🐵', '🦔', '🐰', '🐹', '🐭', '🐺', '🦝', '🦓', '🦄', '🐴'
];