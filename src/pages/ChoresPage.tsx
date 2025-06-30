import React, { useState, useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Plus, Calendar, User, AlertTriangle, Check } from 'lucide-react';
import { Chore, Comment } from '../types';
import { formatDate, getRoommateName, getRoommateAvatar, generateId, isOverdue } from '../utils/helpers';
import CommentThread from '../components/CommentThread';
import Modal from '../components/Modal';

const ChoresPage: React.FC = () => {
  const { state, setState, addNotification } = useAppState();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    dueDate: '',
    assignedTo: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.dueDate || formData.assignedTo.length === 0) return;

    const newChore: Chore = {
      id: generateId(),
      description: formData.description.trim(),
      dueDate: formData.dueDate,
      assignedTo: formData.assignedTo,
      isDone: false,
      comments: [],
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      chores: [newChore, ...prev.chores]
    }));

    const assigneeNames = formData.assignedTo.map(id => getRoommateName(id, state.roommates, user)).join(', ');
    addNotification(
      `New chore assigned to ${assigneeNames}: ${formData.description}`,
      'chore'
    );

    setFormData({ description: '', dueDate: '', assignedTo: [] });
    setShowAddModal(false);
  };

  const toggleChore = (choreId: string) => {
    setState(prev => ({
      ...prev,
      chores: prev.chores.map(chore => {
        if (chore.id === choreId) {
          const updated = { ...chore, isDone: !chore.isDone };
          const assigneeNames = chore.assignedTo.map(id => getRoommateName(id, state.roommates, user)).join(', ');
          addNotification(
            `${assigneeNames} ${updated.isDone ? 'completed' : 'reopened'} chore: ${chore.description}`,
            'chore'
          );
          return updated;
        }
        return chore;
      })
    }));
  };

  // Auto-remove completed chores after 3 seconds
  useEffect(() => {
    const completedChores = state.chores.filter(chore => chore.isDone);
    
    completedChores.forEach(chore => {
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          chores: prev.chores.filter(c => c.id !== chore.id)
        }));
      }, 3000);
    });
  }, [state.chores]);

  const addComment = (choreId: string, comment: Comment) => {
    const chore = state.chores.find(c => c.id === choreId);
    if (!chore) return;

    const commenterName = getRoommateName(comment.authorId, state.roommates, user);
    addNotification(
      `${commenterName} commented on chore: ${chore.description}`,
      'chore'
    );

    setState(prev => ({
      ...prev,
      chores: prev.chores.map(chore => {
        if (chore.id === choreId) {
          return { ...chore, comments: [...chore.comments, comment] };
        }
        return chore;
      })
    }));
  };

  const toggleRoommate = (roommateId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedTo: prev.assignedTo.includes(roommateId)
        ? prev.assignedTo.filter(id => id !== roommateId)
        : [...prev.assignedTo, roommateId]
    }));
  };

  const pendingChores = state.chores.filter(chore => !chore.isDone);
  const completedChores = state.chores.filter(chore => chore.isDone);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500 rounded-lg p-2">
            <CheckSquare className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Chores</h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Chore</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingChores.length}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completedChores.length}</p>
        </div>
      </div>

      {/* Chores List */}
      <div className="space-y-6">
        {/* Pending Chores */}
        {pendingChores.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Chores</h2>
            <div className="space-y-4">
              {pendingChores.map((chore) => (
                <div key={chore.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => toggleChore(chore.id)}
                          className="w-5 h-5 border-2 border-gray-300 rounded hover:border-green-500 transition-colors"
                        />
                        <h3 className="text-lg font-medium text-gray-900">{chore.description}</h3>
                        {isOverdue(chore.dueDate) && (
                          <div className="flex items-center space-x-1 bg-red-50 text-red-700 px-2 py-1 rounded-full text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <div className="flex items-center space-x-1">
                            {chore.assignedTo.map((roommateId, index) => (
                              <div key={roommateId} className="flex items-center space-x-1">
                                <span className="text-lg">
                                  {getRoommateAvatar(roommateId, state.roommates)}
                                </span>
                                <span>{getRoommateName(roommateId, state.roommates, user)}</span>
                                {index < chore.assignedTo.length - 1 && <span className="text-gray-400">,</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span className={isOverdue(chore.dueDate) ? 'text-red-600' : ''}>
                            Due {formatDate(chore.dueDate)}
                          </span>
                        </div>
                      </div>
                      
                      <CommentThread
                        comments={chore.comments}
                        onAddComment={(comment) => addComment(chore.id, comment)}
                        placeholder="Add a comment about this chore..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Chores */}
        {completedChores.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Completed Chores (will be removed automatically)
            </h2>
            <div className="space-y-4">
              {completedChores.map((chore) => (
                <div key={chore.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 opacity-75 animate-pulse">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button
                          onClick={() => toggleChore(chore.id)}
                          className="w-5 h-5 bg-green-500 rounded flex items-center justify-center hover:bg-green-600 transition-colors"
                        >
                          <Check className="w-3 h-3 text-white" />
                        </button>
                        <h3 className="text-lg font-medium text-gray-900 line-through">{chore.description}</h3>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <div className="flex items-center space-x-1">
                            {chore.assignedTo.map((roommateId, index) => (
                              <div key={roommateId} className="flex items-center space-x-1">
                                <span className="text-lg">
                                  {getRoommateAvatar(roommateId, state.roommates)}
                                </span>
                                <span>{getRoommateName(roommateId, state.roommates, user)}</span>
                                {index < chore.assignedTo.length - 1 && <span className="text-gray-400">,</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Completed</span>
                        </div>
                      </div>
                      
                      <CommentThread
                        comments={chore.comments}
                        onAddComment={(comment) => addComment(chore.id, comment)}
                        placeholder="Add a comment about this chore..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.chores.length === 0 && (
          <div className="text-center py-12">
            <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No chores yet</h3>
            <p className="text-gray-600 mb-4">Add your first chore to get started!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add First Chore
            </button>
          </div>
        )}
      </div>

      {/* Add Chore Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Chore"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Take out the trash"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign To (select one or more)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {state.roommates.map((roommate) => (
                <label key={roommate.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.assignedTo.includes(roommate.id)}
                    onChange={() => toggleRoommate(roommate.id)}
                    className="mr-3"
                  />
                  <span className="text-lg mr-2">{roommate.avatarUrl}</span>
                  <span className="text-sm">{roommate.name}</span>
                </label>
              ))}
            </div>
            {formData.assignedTo.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Please select at least one roommate</p>
            )}
          </div>
          
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Chore
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChoresPage;