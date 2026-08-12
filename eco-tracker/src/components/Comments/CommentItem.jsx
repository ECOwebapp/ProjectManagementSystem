// CommentItem.jsx — Redesigned card-style comment with fixed metadata and actions
import { useState } from 'react';
import Avatar from '../shared/Avatar.jsx';
import AddCommentForm from './AddCommentForm.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';

function formatTimestamp(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/* ─── Single reply row (compact) ─────────────────────────────── */
function ReplyItem({ reply }) {
  return (
    <div className="comment-reply-item">
      <Avatar name={reply.commenter_name} size="sm" />
      <div className="comment-reply-body">
        <div className="comment-meta-row">
          <span className="comment-author-name">{reply.commenter_name}</span>
          <span className="comment-meta-dot">·</span>
          <span className="comment-timestamp">{formatTimestamp(reply.commented_at)}</span>
        </div>
        <div className="comment-text">{reply.comment_text}</div>
      </div>
    </div>
  );
}

/* ─── Main comment card ───────────────────────────────────────── */
export default function CommentItem({ comment, replies = [], onAddReply, onResolve }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isResolved = Boolean(comment.is_resolved);

  const handleResolveClick = () => {
    if (isAuthorized()) {
      onResolve(comment.comment_id);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="comment-card">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => onResolve(comment.comment_id)}
        title="Authorization Required"
        description="Enter authorization password to toggle comment resolution."
      />

      {/* Avatar + content flex row */}
      <div className="comment-card-row">
        <Avatar name={comment.commenter_name} size="md" />

        <div className="comment-card-content">
          {/* Metadata: Name · Timestamp · [Resolved chip] */}
          <div className="comment-meta-row">
            <span className="comment-author-name">{comment.commenter_name}</span>
            <span className="comment-meta-dot">·</span>
            <span className="comment-timestamp">{formatTimestamp(comment.commented_at)}</span>
            {isResolved && (
              <>
                <span className="comment-meta-dot">·</span>
                <span className="comment-resolved-chip">✓ Resolved</span>
              </>
            )}
          </div>

          {/* Comment body text */}
          <div className="comment-text" style={{ opacity: isResolved ? 0.6 : 1 }}>
            {comment.comment_text}
          </div>

          {/* Action links — plain text, no borders */}
          <div className="comment-actions-row">
            <button
              className="comment-action-link"
              onClick={() => setShowReplyForm(v => !v)}
            >
              Reply
            </button>
            <button
              className={`comment-action-link resolve-link${isResolved ? ' resolved' : ''}`}
              onClick={handleResolveClick}
            >
              {isResolved ? '↺ Mark Unresolved' : '↺ Mark Resolved'}
            </button>
          </div>

          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="comment-replies-list">
              {replies.map(reply => (
                <ReplyItem key={reply.comment_id} reply={reply} />
              ))}
            </div>
          )}

          {/* Reply form */}
          {showReplyForm && (
            <div style={{ marginTop: 12 }}>
              <AddCommentForm
                isReply
                placeholder="Write a reply..."
                buttonText="Reply"
                onCancel={() => setShowReplyForm(false)}
                onSubmit={({ personnelId, commenterName, text }) => {
                  onAddReply({ parentCommentId: comment.comment_id, personnelId, commenterName, text });
                  setShowReplyForm(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
