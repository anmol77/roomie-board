import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { Volume2, Plus, Calendar, User, Trash2 } from 'lucide-react';
import { NoiseNote, Comment } from '../types';
import { formatDate, getRoommateName, getRoommateAvatar, generateId } from '../utils/helpers';
import CommentThread from '../components/CommentThread';
import Modal from '../components/Modal';

const NoisePage: React.FC = () => {
  const { state, setState, addNotification } = useAppState();
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    date: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description.trim() || !formData.date || !user) return;

    const newNote: NoiseNote = {
      id: generateId(),
      description: formData.description.trim(),
      date: formData.date,
      comments: [],
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    setState(prev => ({
      ...prev,
      noiseNotes: [newNote, ...prev.noiseNotes]
    }));

    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
    addNotification(
      `${userName} added a Noise note: ${formData.description}`,
      'noise'
    );

    setFormData({ description: '', date: '' });
    setShowAddModal(false);
  };

  const deleteNote = (noteId: string) => {
    const note = state.noiseNotes.find(n => n.id === noteId);
    if (!note) return;

    setState(prev => ({
      ...prev,
      noiseNotes: prev.noiseNotes.filter(n => n.id !== noteId)
    }));

    const creatorName = note.createdBy ? getRoommateName(note.createdBy, state.roommates, user) : 'Someone';
    addNotification(
      `${creatorName} deleted a noise note`,
      'noise'
    );
  };

  const addComment = (noteId: string, comment: Comment) => {
    const note = state.noiseNotes.find(n => n.id === noteId);
    if (!note) return;

    const commenterName = getRoommateName(comment.authorId, state.roommates, user);
    addNotification(
      `${commenterName} commented on noise note: ${note.description.substring(0, 50)}...`,
      'noise'
    );

    setState(prev => ({
      ...prev,
      noiseNotes: prev.noiseNotes.map(note => {
        if (note.id === noteId) {
          return { ...note, comments: [...note.comments, comment] };
        }
        return note;
      })
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-500 rounded-lg p-2">
            <Volume2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Noise Notes</h1>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Note</span>
        </button>
      </div>

      {/* Description */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
        <p className="text-purple-800 text-sm">
          <strong>Noise Notes</strong> help communicate quiet time requests and noise considerations with all your roommates. 
          Perfect for exam periods, work calls, or when you need some peaceful time.
        </p>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center space-x-2">
          <Volume2 className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-gray-600">Total Notes</span>
        </div>
        <p className="text-2xl font-bold text-gray-900 mt-1">{state.noiseNotes.length}</p>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {state.noiseNotes.length === 0 ? (
          <div className="text-center py-12">
            <Volume2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No noise notes yet</h3>
            <p className="text-gray-600 mb-4">Add your first note to communicate noise considerations!</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add First Note
            </button>
          </div>
        ) : (
          state.noiseNotes.map((note) => (
            <div key={note.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{note.description}</h3>
                    <button
                      onClick={() => deleteNote(note.id)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    {note.createdBy && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4" />
                        <span className="text-lg">
                          {getRoommateAvatar(note.createdBy, state.roommates)}
                        </span>
                        <span>Added by {getRoommateName(note.createdBy, state.roommates, user)}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(note.date)}</span>
                    </div>
                    
                    <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      For all roommates
                    </div>
                  </div>
                  
                  <CommentThread
                    comments={note.comments}
                    onAddComment={(comment) => addComment(note.id, comment)}
                    placeholder="Acknowledge or discuss this noise request..."
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Note Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Noise Note"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              placeholder="e.g., Exam tomorrow, please keep it down after 10 PM!"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <p className="text-sm text-purple-700">
              This note will be visible to all roommates in the house.
            </p>
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
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Note
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NoisePage;