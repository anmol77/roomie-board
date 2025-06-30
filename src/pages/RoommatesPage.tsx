import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { Users, Crown, Calendar, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

const RoommatesPage: React.FC = () => {
  const { state, setState } = useAppState();
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshRoommates = async () => {
    setIsRefreshing(true);
    try {
      console.log('Manually refreshing roommates...');
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) {
        console.error('Error refreshing roommates:', error);
        
        if (error.message.includes('relation "public.profiles" does not exist')) {
          toast.error('Profiles table not found. Please run the database migration in Supabase.');
        } else {
          toast.error('Failed to refresh roommates');
        }
        return;
      }

      console.log('Refreshed profiles:', profiles);

      if (profiles) {
        const roommates = profiles.map((profile: { id: string; name: string; avatar_url: string; joined_date: string }) => ({
          id: profile.id,
          name: profile.name,
          avatarUrl: profile.avatar_url,
          joinedDate: profile.joined_date
        }));

        setState(prev => ({
          ...prev,
          roommates
        }));

        toast.success(`Refreshed! Found ${roommates.length} roommate(s)`);
      }
    } catch (error) {
      console.error('Error refreshing roommates:', error);
      toast.error('Failed to refresh roommates');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-lg p-2">
            <Users className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roommates</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={refreshRoommates}
            disabled={isRefreshing}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800 text-sm">
          <strong>Roommates</strong> are managed through user registration. New roommates can join by creating an account and signing in to the app.
          If you don't see expected roommates, they may need to verify their email or the profiles table may need to be created.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-gray-600">Total Roommates</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-1">{state.roommates.length}</p>
      </div>

      {/* No Roommates Message */}
      {state.roommates.length === 0 && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No roommates found</h3>
          <p className="text-gray-600 mb-4">
            This could mean:
          </p>
          <ul className="text-sm text-gray-500 mb-6 space-y-1">
            <li>• The profiles table doesn't exist in your database</li>
            <li>• No users have signed up yet</li>
            <li>• Users haven't verified their email addresses</li>
            <li>• There's a database connection issue</li>
          </ul>
          <div className="space-y-3">
            <button
              onClick={refreshRoommates}
              disabled={isRefreshing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh Roommates'}
            </button>
            <div className="text-sm text-gray-500">
              <p>Need to create the profiles table?</p>
              <a 
                href={`${import.meta.env.VITE_SUPABASE_URL?.replace('/rest/v1', '')}/project/default/sql`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800"
              >
                <span>Open Supabase SQL Editor</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Roommates Grid */}
      {state.roommates.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.roommates.map((roommate) => (
            <div
              key={roommate.id}
              className={`bg-white rounded-lg p-6 shadow-sm border transition-all ${
                roommate.id === user?.id
                  ? 'border-blue-300 ring-2 ring-blue-100'
                  : 'border-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="relative">
                  <div className="text-6xl mb-4">{roommate.avatarUrl}</div>
                </div>
                
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{roommate.name}</h3>
                  {roommate.id === user?.id && (
                    <Crown className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(roommate.joinedDate)}</span>
                </div>
                
                {roommate.id === user?.id && (
                  <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                    You
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RoommatesPage;