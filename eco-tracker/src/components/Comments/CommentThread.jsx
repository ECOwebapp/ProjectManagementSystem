// CommentThread.jsx — Threaded discussion backed by Supabase
import { useState, useEffect, useCallback } from 'react';
import { getComments, addComment, addReply, resolveComment } from '../../data/projectsRepo.js';
import CommentItem from './CommentItem.jsx';
import AddCommentForm from './AddCommentForm.jsx';

export default function CommentThread({ projectNo }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showResolved, setShowResolved] = useState(true);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getComments(projectNo);
      setComments(list);
    } catch (e) {
      console.error('Failed to load comments:', e.message);
    } finally {
      setLoading(false);
    }
  }, [projectNo]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleAddTopLevel = async ({ personnelId, commenterName, text }) => {
    await addComment({ projectNo, personnelId, commenterName, text });
    loadComments();
  };

  const handleAddReply = async ({ parentCommentId, personnelId, commenterName, text }) => {
    await addReply({ projectNo, personnelId, commenterName, text, parentCommentId });
    loadComments();
  };

  const handleResolveToggle = async (commentId) => {
    await resolveComment(projectNo, commentId);
    loadComments();
  };

  const topLevel   = comments.filter(c => !c.parent_comment_id);
  const repliesMap = {};
  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
      repliesMap[c.parent_comment_id].push(c);
    }
  });

  const resolvedCount   = topLevel.filter(c => c.is_resolved).length;
  const visibleTopLevel = showResolved ? topLevel : topLevel.filter(c => !c.is_resolved);

  return (
    <div className="card">
      {/* ── Thread Header ── */}
      <div className="discussion-header">
        <div>
          <h3 className="card-title" style={{ marginBottom: 2 }}>Project Discussion</h3>
          <span className="text-muted" style={{ fontSize: 12 }}>
            {loading ? 'Loading…' : `${topLevel.length} thread${topLevel.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {resolvedCount > 0 && (
          <button
            className="btn-outline-pill"
            onClick={() => setShowResolved(v => !v)}
            style={{ fontSize: 12 }}
          >
            {showResolved ? `Hide Resolved (${resolvedCount})` : `Show Resolved (${resolvedCount})`}
          </button>
        )}
      </div>

      {/* Full-width divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '0 0 var(--sp-4) 0' }} />

      {/* ── Comment Cards ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-5)', color: 'var(--gray)', fontSize: 13 }}>
          Loading comments…
        </div>
      ) : visibleTopLevel.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--sp-6) var(--sp-4)',
          color: 'var(--gray)',
          fontSize: 13,
          marginBottom: 'var(--sp-5)',
        }}>
          No comments yet. Start the conversation below!
        </div>
      ) : (
        <div className="comments-list">
          {visibleTopLevel.map(comment => (
            <CommentItem
              key={comment.comment_id}
              comment={comment}
              replies={repliesMap[comment.comment_id] || []}
              onAddReply={handleAddReply}
              onResolve={handleResolveToggle}
            />
          ))}
        </div>
      )}

      {/* ── Composer Card ── */}
      <div>
        <div className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>ADD TO DISCUSSION</div>
        <div className="comment-composer-card">
          <AddCommentForm
            onSubmit={handleAddTopLevel}
            placeholder="Share an update or question about this project..."
          />
        </div>
      </div>
    </div>
  );
}
