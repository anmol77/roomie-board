import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, Notification, Roommate } from '../types';
import { loadData, saveData } from '../utils/storage';
import { generateId } from '../utils/helpers';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface AppStateContextType {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  addNotification: (message: string, type: Notification['type']) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

interface AppStateProviderProps {
  children: React.ReactNode;
}

export const AppStateProvider: React.FC<AppStateProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(() => {
    const data = loadData();
    return {
      ...data,
      currentUser: user?.id || null,
      roommates: [] // Start with empty array, will be loaded from Supabase
    };
  });

  // Load roommates from Supabase
  useEffect(() => {
    const loadRoommates = async () => {
      if (!user) return;

      try {
        console.log('Loading roommates from Supabase...');
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) {
          console.error('Error loading roommates:', error);
          
          // If table doesn't exist, show helpful message
          if (error.message.includes('relation "public.profiles" does not exist')) {
            toast.error('Profiles table not found. Please run the database migration.');
            console.log('Run this SQL in your Supabase SQL editor to create the profiles table.');
          } else {
            toast.error('Failed to load roommates from database');
          }
          return;
        }

        console.log('Loaded profiles from Supabase:', profiles);

        if (profiles) {
          const roommates: Roommate[] = profiles.map((profile: { id: string; name: string; avatar_url: string; joined_date: string }) => ({
            id: profile.id,
            name: profile.name,
            avatarUrl: profile.avatar_url,
            joinedDate: profile.joined_date
          }));

          console.log('Converted to roommates:', roommates);

          setState(prev => ({
            ...prev,
            roommates,
            currentUser: user.id
          }));
        }
      } catch (error) {
        console.error('Error loading roommates:', error);
        toast.error('Failed to connect to database');
      }
    };

    loadRoommates();

    // Set up real-time subscription for profile changes (only if supabase is properly configured)
    let subscription: { unsubscribe: () => void } | null = null;
    
    try {
      if ('channel' in supabase) {
        subscription = supabase
          .channel('profiles_changes')
          .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'profiles' },
            (payload: { [key: string]: unknown }) => {
              console.log('Profile change detected:', payload);
              loadRoommates(); // Reload roommates when changes occur
            }
          )
          .subscribe();
      }
    } catch (error) {
      console.warn('Real-time subscriptions not available:', error);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [user]);

  // Save data to localStorage (excluding roommates which are now in Supabase)
  useEffect(() => {
    const dataToSave = {
      chores: state.chores,
      kitchenItems: state.kitchenItems,
      bills: state.bills,
      noiseNotes: state.noiseNotes,
      notifications: state.notifications,
      currentUser: state.currentUser,
      roommates: [] // Save empty roommates array to localStorage
    };
    saveData(dataToSave);
  }, [state]);

  const addNotification = (message: string, type: Notification['type']) => {
    const notification: Notification = {
      id: generateId(),
      message,
      timestamp: new Date().toISOString(),
      type,
      read: false
    };

    setState(prev => ({
      ...prev,
      notifications: [notification, ...prev.notifications]
    }));

    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const value = {
    state,
    setState,
    addNotification
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}; 