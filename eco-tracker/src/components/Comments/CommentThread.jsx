// CommentThread.jsx — Manages comment tree state for a project
import { useState, useEffect } from 'react';
import { getComments, addComment, addReply, resolveComment } from '../../data/projectsRepo.js';
import CommentItem from './CommentItem.jsx';
import AddCommentForm from './AddCommentForm.jsx';

export default function CommentThread({ projectNo }) {
  const [comments, setComments] = useState([]);
  const [showResolved, setShowResolved] = useState(true);

  const loadComments = () => {
    const list = getComments(projectNo);
    setComments(list);
  };

  useEffect(() => {
    loadComments();
  }, [projectNo]);

  const handleAddTopLevel = ({ personnelId, commenterName, text }) => {
    addComment({ projectNo, personnelId, commenterName, text });
    loadComments();
  };

  const handleAddReply = ({ parentCommentId, personnelId, commenterName, text }) => {
    addReply({ projectNo, personnelId, commenterName, text, parentCommentId });
    loadComments();
  };

  const handleResolveToggle = (commentId) => {
    resolveComment(projectNo, commentId);
    loadComments();
  };

  // Build tree: top-level comments vs replies
  const topLevel = comments.filter(c => !c.parent_comment_id);
  const repliesMap = {};
  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (!repliesMap[c.parent_comment_id]) repliesMap[c.parent_comment_id] = [];
      repliesMap[c.parent_comment_id].push(c);
    }
  });

  const visibleTopLevel = showResolved ? topLevel : topLevel.filter(c => !c.is_resolved);
  const resolvedCount = topLevel.filter(c => c.is_resolved).length;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3 className="card-title">Project Discussion</h3>
          <span className="text-muted text-xs">
            {topLevel.length} thread{topLevel.length === 1 ? '' : 's'}
          </span>
        </div>

        {resolvedCount > 0 && (
          <button
            className="btn btn-ghost btn-xs"
            onClick={() => setShowResolved(!showResolved)}
          >
            {showResolved ? `Hide Resolved (${resolvedCount})` : `Show Resolved (${resolvedCount})`}
          </button>
        )}
      </div>

      {visibleTopLevel.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: 'var(--sp-6) var(--sp-4)',
          color: 'var(--gray)',
          fontSize: 13,
          borderBottom: '1px solid var(--border)',
          marginBottom: 'var(--sp-5)',
        }}>
          No comments yet. Start the conversation below!
        </div>
      ) : (
        <div className="comments-list" style={{ marginBottom: 'var(--sp-5)', paddingBottom: 'var(--sp-5)', borderBottom: '1px solid var(--border)' }}>
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

      <div>
        <div className="section-label" style={{ marginBottom: 'var(--sp-3)' }}>ADD TO DISCUSSION</div>
        <AddCommentForm onSubmit={handleAddTopLevel} placeholder="Share an update or question about this project..." />
      </div>
    </div>
  );
}
