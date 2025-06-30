export interface Roommate {
  id: string;
  name: string;
  avatarUrl: string;
  joinedDate: string;
}

export interface Comment {
  id: string;
  authorId: string;
  text: string;
  timestamp: string;
}

export interface Chore {
  id: string;
  description: string;
  dueDate: string;
  assignedTo: string[]; // Changed from string to string[] for multi-selection
  isDone: boolean;
  comments: Comment[];
  createdAt: string;
}

export interface KitchenItem {
  id: string;
  name: string;
  quantity?: string;
  assignedTo: string[];
  comments: Comment[];
  createdAt: string;
  createdBy?: string; // Added to track who added the item
}

export interface Bill {
  id: string;
  description: string;
  totalAmount: number;
  paidBy: string;
  splitBetween?: string[];
  fullOwedBy?: string;
  comments: Comment[];
  createdAt: string;
  dueDate?: string;
  isSettled?: boolean; // Added to track settlement status
}

export interface NoiseNote {
  id: string;
  description: string;
  date: string;
  comments: Comment[];
  createdAt: string;
  createdBy?: string; // Added to track who created the note
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  type: 'chore' | 'kitchen' | 'bill' | 'noise' | 'roommate';
  read: boolean;
}

export interface AppState {
  roommates: Roommate[];
  chores: Chore[];
  kitchenItems: KitchenItem[];
  bills: Bill[];
  noiseNotes: NoiseNote[];
  notifications: Notification[];
  currentUser: string | null;
}