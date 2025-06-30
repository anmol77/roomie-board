import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Plus, User, Calendar, CreditCard, Check, Trash2 } from 'lucide-react';
import { Bill, Comment } from '../types';
import { formatCurrency, formatDate, getRoommateName, getRoommateAvatar, generateId, calculateBillAmount } from '../utils/helpers';
import CommentThread from '../components/CommentThread';
import Modal from '../components/Modal';

const BillsPage: React.FC = () => {
  const { state, setState, addNotification } = useAppState();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    totalAmount: '',
    dueDate: '',
    splitType: 'split' as 'split' | 'full',
    splitBetween: [] as string[],
    fullOwedBy: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.totalAmount || !state.currentUser) return;

    if (formData.splitType === 'split' && formData.splitBetween.length === 0) return;
    if (formData.splitType === 'full' && !formData.fullOwedBy) return;

    const newBill: Bill = {
      id: generateId(),
      description: formData.description.trim(),
      totalAmount: parseFloat(formData.totalAmount),
      paidBy: state.currentUser,
      dueDate: formData.dueDate || undefined,
      splitBetween: formData.splitType === 'split' ? [...formData.splitBetween, state.currentUser] : undefined,
      fullOwedBy: formData.splitType === 'full' ? formData.fullOwedBy : undefined,
      comments: [],
      createdAt: new Date().toISOString(),
      isSettled: false
    };

    setState(prev => ({
      ...prev,
      bills: [newBill, ...prev.bills]
    }));

    const payerName = getRoommateName(state.currentUser, state.roommates, user);
    let notificationMessage = '';
    
    if (formData.splitType === 'split') {
      const allSplitUsers = [...formData.splitBetween, state.currentUser];
      notificationMessage = `${payerName} added bill: ${formData.description} - ${formatCurrency(parseFloat(formData.totalAmount))} split among ${allSplitUsers.length} people`;
    } else {
      const owedByName = getRoommateName(formData.fullOwedBy, state.roommates, user);
      notificationMessage = `${payerName} added bill: ${formData.description} - ${formatCurrency(parseFloat(formData.totalAmount))} owed by ${owedByName}`;
    }
    
    addNotification(notificationMessage, 'bill');

    setFormData({
      description: '',
      totalAmount: '',
      dueDate: '',
      splitType: 'split',
      splitBetween: [],
      fullOwedBy: ''
    });
    setShowAddModal(false);
  };

  const toggleBillSettled = (billId: string) => {
    setState(prev => ({
      ...prev,
      bills: prev.bills.map(bill => {
        if (bill.id === billId) {
          const updated = { ...bill, isSettled: !bill.isSettled };
          const payerName = getRoommateName(bill.paidBy, state.roommates, user);
          addNotification(
            `${payerName} ${updated.isSettled ? 'settled' : 'reopened'} bill: ${bill.description}`,
            'bill'
          );
          return updated;
        }
        return bill;
      })
    }));
  };

  const deleteBill = (billId: string) => {
    const bill = state.bills.find(b => b.id === billId);
    if (!bill) return;

    setState(prev => ({
      ...prev,
      bills: prev.bills.filter(b => b.id !== billId)
    }));

    const payerName = getRoommateName(bill.paidBy, state.roommates, user);
    addNotification(
      `${payerName} deleted bill: ${bill.description}`,
      'bill'
    );
  };

  const addComment = (billId: string, comment: Comment) => {
    const bill = state.bills.find(b => b.id === billId);
    if (!bill) return;

    const commenterName = getRoommateName(comment.authorId, state.roommates, user);
    addNotification(
      `${commenterName} commented on bill: ${bill.description}`,
      'bill'
    );

    setState(prev => ({
      ...prev,
      bills: prev.bills.map(bill => {
        if (bill.id === billId) {
          return { ...bill, comments: [...bill.comments, comment] };
        }
        return bill;
      })
    }));
  };

  const toggleRoommate = (roommateId: string) => {
    if (formData.splitBetween.includes(roommateId)) {
      setFormData(prev => ({
        ...prev,
        splitBetween: prev.splitBetween.filter(id => id !== roommateId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        splitBetween: [...prev.splitBetween, roommateId]
      }));
    }
  };

  const pendingBills = state.bills.filter(bill => !bill.isSettled);

  const totalOwed = pendingBills.reduce((total, bill) => {
    return total + calculateBillAmount(bill, state.currentUser || '');
  }, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-red-500 rounded-lg p-2">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bills</h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Bill</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            <span className="text-sm text-gray-600">Pending Bills</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{pendingBills.length}</p>
        </div>
        
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <DollarSign className={`w-5 h-5 ${totalOwed >= 0 ? 'text-orange-500' : 'text-green-500'}`} />
            <span className="text-sm text-gray-600">{totalOwed >= 0 ? 'You Owe' : 'You\'re Owed'}</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(Math.abs(totalOwed))}</p>
        </div>
      </div>

      {/* Bills List */}
      <div className="space-y-6">
        {/* Pending Bills */}
        {pendingBills.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Bills</h2>
            <div className="space-y-4">
              {pendingBills.map((bill) => (
                <div key={bill.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{bill.description}</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            {formatCurrency(bill.totalAmount)}
                          </span>
                          <button
                            onClick={() => toggleBillSettled(bill.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors text-sm"
                          >
                            <Check className="w-3 h-3" />
                            <span>Settle</span>
                          </button>
                          <button
                            onClick={() => deleteBill(bill.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors text-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span className="text-lg">
                            {getRoommateAvatar(bill.paidBy, state.roommates)}
                          </span>
                          <span>{getRoommateName(bill.paidBy, state.roommates, user)} paid</span>
                        </div>
                        
                        {bill.dueDate && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Due {formatDate(bill.dueDate)}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Bill Breakdown */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Breakdown</h4>
                        {bill.splitBetween ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Split between:</p>
                            <div className="flex flex-wrap gap-2">
                              {bill.splitBetween.map(roommateId => (
                                <div key={roommateId} className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border">
                                  <span className="text-sm">
                                    {getRoommateAvatar(roommateId, state.roommates)}
                                  </span>
                                  <span className="text-sm">
                                    {getRoommateName(roommateId, state.roommates, user)}
                                  </span>
                                  <span className="text-sm font-medium">
                                    {formatCurrency(bill.totalAmount / (bill.splitBetween?.length || 1))}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : bill.fullOwedBy ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Full amount owed by:</span>
                            <div className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full border">
                              <span className="text-sm">
                                {getRoommateAvatar(bill.fullOwedBy, state.roommates)}
                              </span>
                              <span className="text-sm">
                                {getRoommateName(bill.fullOwedBy, state.roommates, user)}
                              </span>
                              <span className="text-sm font-medium">
                                {formatCurrency(bill.totalAmount)}
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                      
                      <CommentThread
                        comments={bill.comments}
                        onAddComment={(comment) => addComment(bill.id, comment)}
                        placeholder="Add a comment about this bill..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state.bills.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bills yet</h3>
            <p className="text-gray-600 mb-4">Add your first bill to track shared expenses!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Add First Bill
            </button>
          </div>
        )}
      </div>

      {/* Add Bill Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Bill"
        size="lg"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="e.g., Electricity, Internet, Groceries"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.totalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitType"
                  value="split"
                  checked={formData.splitType === 'split'}
                  onChange={(e) => setFormData(prev => ({ ...prev, splitType: e.target.value as 'split' | 'full' }))}
                  className="mr-2"
                />
                <span className="text-sm">Split equally</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="splitType"
                  value="full"
                  checked={formData.splitType === 'full'}
                  onChange={(e) => setFormData(prev => ({ ...prev, splitType: e.target.value as 'split' | 'full' }))}
                  className="mr-2"
                />
                <span className="text-sm">One person owes full amount</span>
              </label>
            </div>
          </div>
          
          {formData.splitType === 'split' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Split Between (you are automatically included)
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {state.roommates
                  .filter(roommate => roommate.id !== state.currentUser)
                  .map((roommate) => (
                    <label key={roommate.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.splitBetween.includes(roommate.id)}
                        onChange={() => toggleRoommate(roommate.id)}
                        className="mr-3"
                      />
                      <span className="text-lg mr-2">{roommate.avatarUrl}</span>
                      <span className="text-sm">{roommate.name}</span>
                      {formData.splitBetween.includes(roommate.id) && formData.totalAmount && (
                        <span className="ml-auto text-sm font-medium text-gray-600">
                          {formatCurrency(parseFloat(formData.totalAmount) / (formData.splitBetween.length + 1))}
                        </span>
                      )}
                    </label>
                  ))}
              </div>
              {formData.splitBetween.length === 0 && (
                <p className="text-xs text-red-500 mt-1">Please select at least one roommate</p>
              )}
              <p className="text-xs text-gray-500 mt-1">You will be automatically included in the split.</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who owes the full amount?
              </label>
              <select
                value={formData.fullOwedBy}
                onChange={(e) => setFormData(prev => ({ ...prev, fullOwedBy: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              >
                <option value="">Select roommate...</option>
                {state.roommates
                  .filter(roommate => roommate.id !== state.currentUser)
                  .map((roommate) => (
                    <option key={roommate.id} value={roommate.id}>
                      {roommate.avatarUrl} {roommate.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Add Bill
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillsPage;