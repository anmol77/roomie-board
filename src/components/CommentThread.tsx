import React, { useState } from 'react';
import { Comment } from '../types';
import { useAppState } from '../context/AppStateContext';
import { useAuth } from '../context/AuthContext';
import { getRoommateName, getRoommateAvatar, getTimeAgo, generateId } from '../utils/helpers';
import { MessageCircle, Send } from 'lucide-react';

interface CommentThreadProps {
  comments: Comment[];
  onAddComment: (comment: Comment) => void;
  placeholder?: string;
}

const CommentThread: React.FC<CommentThreadProps> = ({ 
  comments, 
  onAddComment, 
  placeholder = "Add a comment..." 
}) => {
  const { state } = useAppState();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !state.currentUser) return;

    const comment: Comment = {
      id: generateId(),
      authorId: state.currentUser,
      text: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    onAddComment(comment);
    setNewComment('');
  };

  return (
    <div className="border-t border-gray-100 pt-3">
      {/* Comment Toggle */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center space-x-2 text-sm text-gray-500 hover:text-gray-700 mb-3"
      >
        <MessageCircle className="w-4 h-4" />
        <span>
          {comments.length === 0 
            ? 'Add comment' 
            : `${comments.length} comment${comments.length === 1 ? '' : 's'}`
          }
        </span>
      </button>

      {/* Comments List */}
      {showComments && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3">
              <div className="text-lg">
                {getRoommateAvatar(comment.authorId, state.roommates)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {getRoommateName(comment.authorId, state.roommates, user)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(comment.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{comment.text}</p>
              </div>
            </div>
          ))}

          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CommentThread;