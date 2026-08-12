// CommentItem.jsx — Google Docs style comment with nested replies & resolve toggle
import { useState } from 'react';
import Avatar from '../shared/Avatar.jsx';
import AddCommentForm from './AddCommentForm.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';

function formatTimestamp(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CommentItem({ comment, replies = [], onAddReply, onResolve }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isResolved = comment.is_resolved;

  const handleResolveClick = () => {
    if (isAuthorized()) {
      onResolve(comment.comment_id);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="comment-item">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => onResolve(comment.comment_id)}
        title="Unlock Comment Resolution"
        description="Enter authorization password to resolve/unresolve comment."
      />

      <Avatar name={comment.commenter_name} />
      <div className="comment-body">
        <div className={`comment-bubble${isResolved ? ' resolved' : ''}`}>
          <div className="comment-meta">
            <span className="comment-author">{comment.commenter_name}</span>
            <span className="comment-time">{formatTimestamp(comment.commented_at)}</span>
            {isResolved && (
              <span className="badge badge-gray" style={{ marginLeft: 'auto', fontSize: 10 }}>
                Resolved
              </span>
            )}
          </div>
          <div className="comment-text">{comment.comment_text}</div>
          <div className="comment-actions">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              style={{ color: 'var(--c-primary)' }}
            >
              Reply
            </button>
            <button
              className={`resolve-btn${isResolved ? ' resolved' : ''}`}
              onClick={handleResolveClick}
            >
              {isResolved ? '✓ Resolved' : 'Mark Resolved'}
            </button>
          </div>
        </div>

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="replies-list">
            {replies.map(reply => (
              <div key={reply.comment_id} className="comment-item">
                <Avatar name={reply.commenter_name} size="sm" />
                <div className="comment-body">
                  <div className="comment-bubble">
                    <div className="comment-meta">
                      <span className="comment-author">{reply.commenter_name}</span>
                      <span className="comment-time">{formatTimestamp(reply.commented_at)}</span>
                    </div>
                    <div className="comment-text">{reply.comment_text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reply form */}
        {showReplyForm && (
          <AddCommentForm
            isReply={true}
            placeholder="Write a reply..."
            buttonText="Reply"
            onCancel={() => setShowReplyForm(false)}
            onSubmit={({ personnelId, commenterName, text }) => {
              onAddReply({ parentCommentId: comment.comment_id, personnelId, commenterName, text });
              setShowReplyForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
