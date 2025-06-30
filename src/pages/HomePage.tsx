import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, ChefHat, DollarSign, Volume2, Bell, Users, AlertCircle, X } from 'lucide-react';
import { formatCurrency, getTimeAgo, isOverdue, calculateBillAmount } from '../utils/helpers';
import Modal from '../components/Modal';

const HomePage: React.FC = () => {
  const { state, setState } = useAppState();
  const { user } = useAuth();
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  const overdueTasks = state.chores.filter(chore => !chore.isDone && isOverdue(chore.dueDate)).length;
  const pendingChores = state.chores.filter(chore => !chore.isDone).length;
  const totalOwed = state.bills.reduce((total, bill) => {
    return total + calculateBillAmount(bill, state.currentUser || '');
  }, 0);

  const recentNotifications = state.notifications.slice(0, 5);

  const deleteNotification = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId)
    }));
  };

  const stats = [
    {
      title: 'Roommates',
      value: state.roommates.length,
      icon: Users,
      color: 'bg-blue-500',
      link: '/roommates'
    },
    {
      title: 'Chores',
      value: pendingChores,
      icon: CheckSquare,
      color: 'bg-green-500',
      link: '/chores'
    },
    {
      title: 'Kitchen Items',
      value: state.kitchenItems.length,
      icon: ChefHat,
      color: 'bg-orange-500',
      link: '/kitchen'
    },
    {
      title: totalOwed >= 0 ? 'You Owe' : 'You\'re Owed',
      value: formatCurrency(Math.abs(totalOwed)),
      icon: DollarSign,
      color: totalOwed >= 0 ? 'bg-red-500' : 'bg-green-500',
      link: '/bills'
    }
  ];

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-8 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {userName}! 
          <span className="ml-2 text-3xl">👋</span>
        </h1>
        <p className="text-blue-100">
          Managing your shared space, one task at a time.
        </p>
        
        {overdueTasks > 0 && (
          <div className="mt-4 bg-red-500 bg-opacity-20 border border-red-300 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>You have {overdueTasks} overdue task{overdueTasks === 1 ? '' : 's'}!</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-3">
              <div className={`${stat.color} rounded-lg p-2`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <Bell className="w-5 h-5" />
              <span>Recent Activity</span>
            </h2>
            {state.notifications.length > 5 && (
              <button
                onClick={() => setShowNotificationsModal(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View all
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {recentNotifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentNotifications.map((notification) => (
                <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg group">
                  <Bell className="w-4 h-4 mt-0.5 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/chores"
              className="flex flex-col items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <CheckSquare className="w-6 h-6 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-800">Add Chore</span>
            </Link>
            
            <Link
              to="/kitchen"
              className="flex flex-col items-center p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <ChefHat className="w-6 h-6 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-800">Add Item</span>
            </Link>
            
            <Link
              to="/bills"
              className="flex flex-col items-center p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              <DollarSign className="w-6 h-6 text-red-600 mb-2" />
              <span className="text-sm font-medium text-red-800">Add Bill</span>
            </Link>
            
            <Link
              to="/noise"
              className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Volume2 className="w-6 h-6 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-800">Add Note</span>
            </Link>
          </div>
        </div>
      </div>

      {/* All Notifications Modal */}
      <Modal
        isOpen={showNotificationsModal}
        onClose={() => setShowNotificationsModal(false)}
        title="All Notifications"
        size="lg"
      >
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {state.notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No notifications</p>
          ) : (
            state.notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg group">
                <Bell className="w-4 h-4 mt-0.5 text-gray-400" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTimeAgo(notification.timestamp)}
                  </p>
                </div>
                <button
                  onClick={() => deleteNotification(notification.id)}
                  className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default HomePage;