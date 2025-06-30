import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { ChefHat, Plus, User, Trash2 } from 'lucide-react';
import { KitchenItem, Comment } from '../types';
import { getRoommateName, getRoommateAvatar, generateId } from '../utils/helpers';
import CommentThread from '../components/CommentThread';
import Modal from '../components/Modal';

const KitchenPage: React.FC = () => {
  const { state, setState, addNotification } = useAppState();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    quantity: '',
    assignedTo: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || formData.assignedTo.length === 0 || !user) return;

    const newItem: KitchenItem = {
      id: generateId(),
      name: formData.name.trim(),
      quantity: formData.quantity.trim() || undefined,
      assignedTo: formData.assignedTo,
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    setState(prev => ({
      ...prev,
      kitchenItems: [newItem, ...prev.kitchenItems]
    }));

    const assigneeNames = formData.assignedTo.map(id => getRoommateName(id, state.roommates, user)).join(', ');
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    addNotification(
      `${userName} added kitchen item: ${formData.name} (assigned to ${assigneeNames})`,
      'kitchen'
    );

    setFormData({ name: '', quantity: '', assignedTo: [] });
    setShowAddModal(false);
  };

  const deleteItem = (itemId: string) => {
    const item = state.kitchenItems.find(i => i.id === itemId);
    if (!item) return;

    setState(prev => ({
      ...prev,
      kitchenItems: prev.kitchenItems.filter(item => item.id !== itemId)
    }));

    const creatorName = item.createdBy ? getRoommateName(item.createdBy, state.roommates, user) : 'Someone';
    addNotification(
      `${creatorName} removed kitchen item: ${item.name}`,
      'kitchen'
    );
  };

  const addComment = (itemId: string, comment: Comment) => {
    const item = state.kitchenItems.find(i => i.id === itemId);
    if (!item) return;

    const commenterName = getRoommateName(comment.authorId, state.roommates, user);
    addNotification(
      `${commenterName} commented on kitchen item: ${item.name}`,
      'kitchen'
    );

    setState(prev => ({
      ...prev,
      kitchenItems: prev.kitchenItems.map(item => {
        if (item.id === itemId) {
          return { ...item, comments: [...item.comments, comment] };
        }
        return item;
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

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-orange-500 rounded-lg p-2">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Kitchen Inventory</h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-2">
          <ChefHat className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-gray-600">Total Items</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-1">{state.kitchenItems.length}</p>
      </div>

      {/* Items List */}
      <div className="space-y-4">
        {state.kitchenItems.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No kitchen items yet</h3>
            <p className="text-gray-600 mb-4">Add your first item to track kitchen inventory!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add First Item
            </button>
          </div>
        ) : (
          state.kitchenItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    {item.createdBy && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">Added by:</span>
                        <span className="text-lg">
                          {getRoommateAvatar(item.createdBy, state.roommates)}
                        </span>
                        <span>{getRoommateName(item.createdBy, state.roommates, user)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span className="text-xs text-gray-500">Assigned to:</span>
                      <div className="flex items-center space-x-1">
                        {item.assignedTo.map((roommateId, index) => (
                          <div key={roommateId} className="flex items-center space-x-1">
                            <span className="text-lg">
                              {getRoommateAvatar(roommateId, state.roommates)}
                            </span>
                            <span>{getRoommateName(roommateId, state.roommates, user)}</span>
                            {index < item.assignedTo.length - 1 && <span className="text-gray-400">,</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {item.quantity && (
                      <div className="bg-gray-100 px-2 py-1 rounded-full text-xs">
                        {item.quantity}
                      </div>
                    )}
                  </div>
                  
                  <CommentThread
                    comments={item.comments}
                    onAddComment={(comment) => addComment(item.id, comment)}
                    placeholder="Add a comment about this item..."
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Kitchen Item"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Item Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., Milk, Bread, Coffee"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity (Optional)
            </label>
            <input
              type="text"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="e.g., 1 gallon, 2 loaves, 500g"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned To (select one or more)
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Add Item
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KitchenPage;