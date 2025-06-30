import { AppState } from '../types';

const STORAGE_KEY = 'roomie-board-data';

export const loadData = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      // Data migration: ensure assignedTo is always an array
      if (data.chores) {
        data.chores = data.chores.map((chore: any) => ({
          ...chore,
          assignedTo: Array.isArray(chore.assignedTo) 
            ? chore.assignedTo 
            : typeof chore.assignedTo === 'string' 
              ? [chore.assignedTo] 
              : []
        }));
      }
      
      if (data.kitchenItems) {
        data.kitchenItems = data.kitchenItems.map((item: any) => ({
          ...item,
          assignedTo: Array.isArray(item.assignedTo) 
            ? item.assignedTo 
            : typeof item.assignedTo === 'string' 
              ? [item.assignedTo] 
              : []
        }));
      }

      // Data migration: ensure bills have isSettled property
      if (data.bills) {
        data.bills = data.bills.map((bill: any) => ({
          ...bill,
          isSettled: bill.isSettled || false
        }));
      }
      
      // Remove currentUser from localStorage as it's now managed by Supabase
      // Also remove roommates as they're now managed by Supabase
      return {
        ...data,
        currentUser: null,
        roommates: [] // Will be loaded from Supabase
      };
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }

  // Default data with sample content - no roommates as they come from Supabase
  return {
    roommates: [], // Will be loaded from Supabase
    chores: [],
    kitchenItems: [],
    bills: [],
    noiseNotes: [],
    notifications: [],
    currentUser: null
  };
};

export const saveData = (data: AppState): void => {
  try {
    // Don't save currentUser or roommates to localStorage as they're managed by Supabase
    const { currentUser, roommates, ...dataToSave } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};