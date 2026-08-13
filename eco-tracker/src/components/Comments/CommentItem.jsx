// CommentItem.jsx — Redesigned card-style comment with fixed metadata, attached photo support, and lightbox
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

/* ─── Lightbox Modal for viewing photos ───────────────────────── */
function ImageLightbox({ src, onClose }) {
  if (!src) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(11, 30, 61, 0.85)',
        backdropFilter: 'blur(4px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        cursor: 'zoom-out',
      }}
    >
      <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={e => e.stopPropagation()}>
        <img
          src={src}
          alt="Enlarged view"
          style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', objectFit: 'contain' }}
        />
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: -12,
            right: -12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#FFFFFF',
            color: 'var(--navy)',
            border: 'none',
            fontSize: 16,
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close photo"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/* ─── Single reply row (compact) ─────────────────────────────── */
function ReplyItem({ reply, onOpenImage }) {
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
        {reply.image_url && (
          <div style={{ marginTop: 8 }}>
            <img
              src={reply.image_url}
              alt="Attached photo"
              onClick={() => onOpenImage(reply.image_url)}
              style={{
                maxHeight: 140,
                maxWidth: '100%',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                objectFit: 'cover',
                transition: 'transform 0.15s ease',
              }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main comment card ───────────────────────────────────────── */
export default function CommentItem({ comment, replies = [], onAddReply, onResolve, onDelete }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeLightboxSrc, setActiveLightboxSrc] = useState(null);

  const isResolved = Boolean(comment.is_resolved);

  const handleResolveClick = () => {
    if (isAuthorized()) {
      onResolve(comment.comment_id);
    } else {
      setShowAuthModal(true);
    }
  };

  const handleDeleteClick = () => {
    if (isAuthorized()) {
      setShowDeleteModal(true);
    } else {
      setShowDeleteModal(true); // password modal will handle auth
    }
  };

  return (
    <div className="comment-card">
      <ImageLightbox
        src={activeLightboxSrc}
        onClose={() => setActiveLightboxSrc(null)}
      />

      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => onResolve(comment.comment_id)}
        title="Authorization Required"
        description="Enter authorization password to toggle comment resolution."
      />

      <PasswordModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={() => onDelete(comment.comment_id)}
        title="Confirm Delete"
        description="Enter authorization password to permanently delete this comment and its replies."
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

          {/* Attached image thumbnail */}
          {comment.image_url && (
            <div style={{ marginTop: 10 }}>
              <img
                src={comment.image_url}
                alt="Attached photo"
                onClick={() => setActiveLightboxSrc(comment.image_url)}
                style={{
                  maxHeight: 180,
                  maxWidth: '100%',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  objectFit: 'cover',
                  transition: 'transform 0.15s ease',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1.0)'}
              />
            </div>
          )}

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
              {isResolved ? '✓ Resolved' : '↺ Mark Resolved'}
            </button>
            {isResolved && (
              <button
                className="comment-action-link"
                onClick={handleDeleteClick}
                style={{ color: 'var(--red, #DC2626)' }}
              >
                Delete
              </button>
            )}
          </div>

          {/* Nested replies */}
          {replies.length > 0 && (
            <div className="comment-replies-list">
              {replies.map(reply => (
                <ReplyItem key={reply.comment_id} reply={reply} onOpenImage={src => setActiveLightboxSrc(src)} />
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
                onSubmit={({ personnelId, commenterName, text, imageUrl }) => {
                  onAddReply({ parentCommentId: comment.comment_id, personnelId, commenterName, text, imageUrl });
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

