// IssuesPanel.jsx – Editable Issues, Concerns & Remarks panel
import { useState, useEffect, useCallback } from 'react';
import Badge from '../shared/Badge.jsx';
import Avatar from '../shared/Avatar.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';
import {
  addIssue, updateIssue, deleteIssue,
  getComments, addComment, addReply, resolveComment,
  getPersonnel, addPersonnel,
} from '../../data/projectsRepo.js';

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatTs(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

/* ─── Mini personnel picker + comment form ───────────────────── */
function IssueCommentForm({ projectNo, issueId, onSubmit, onCancel, isReply = false }) {
  const [personnel, setPersonnel]       = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [text, setText]                 = useState('');
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName]           = useState('');
  const [newTitle, setNewTitle]         = useState('');

  const loadPersonnel = useCallback(() => {
    const list = getPersonnel();
    setPersonnel(list);
    if (list.length > 0) setSelectedId(id => id || list[0].personnel_id);
  }, []);

  useEffect(() => { loadPersonnel(); }, [loadPersonnel]);

  const selectedPerson = personnel.find(p => p.personnel_id === selectedId);

  function handleAddPerson(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const created = addPersonnel({ name: newName.trim(), title: newTitle.trim() });
    setNewName(''); setNewTitle(''); setAddingPerson(false);
    loadPersonnel();
    setSelectedId(created.personnel_id);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !selectedPerson) return;
    onSubmit({ personnelId: selectedPerson.personnel_id, commenterName: selectedPerson.name, text: text.trim() });
    setText('');
    if (onCancel) onCancel();
  }

  return (
    <div style={styles.commentForm}>
      <form onSubmit={handleSubmit}>
        {/* Person picker row */}
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          {selectedPerson && <Avatar name={selectedPerson.name} size="sm" />}
          <select
            className="form-select"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            style={{ flex: 1, padding: '4px 8px', fontSize: 'var(--text-xs)' }}
          >
            {personnel.map(p => (
              <option key={p.personnel_id} value={p.personnel_id}>
                {p.name}{p.title ? ` (${p.title})` : ''}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setAddingPerson(v => !v)}>
            {addingPerson ? 'Cancel' : '+ New'}
          </button>
        </div>

        {addingPerson && (
          <div style={styles.addPersonMini}>
            <input className="form-input" placeholder="Full Name" value={newName}
              onChange={e => setNewName(e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
            <input className="form-input" placeholder="Title (optional)" value={newTitle}
              onChange={e => setNewTitle(e.target.value)} style={{ fontSize: 'var(--text-xs)' }} />
            <button type="button" className="btn btn-primary btn-xs" onClick={handleAddPerson}>Save</button>
          </div>
        )}

        <textarea
          className="form-textarea"
          rows={2}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={isReply ? 'Write a reply…' : 'Add a comment on this item…'}
          style={{ fontSize: 'var(--text-xs)', marginBottom: 'var(--sp-2)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-xs" onClick={onCancel}>Cancel</button>
          )}
          <button type="submit" className="btn btn-primary btn-xs" disabled={!text.trim() || !selectedPerson}>
            {isReply ? 'Reply' : 'Comment'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Single comment bubble ───────────────────────────────────── */
function IssueCommentItem({ comment, replies, projectNo, onReload }) {
  const [showReply, setShowReply]       = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isResolved = comment.is_resolved;

  function handleReply({ personnelId, commenterName, text }) {
    addReply({ projectNo, personnelId, commenterName, text, parentCommentId: comment.comment_id });
    setShowReply(false);
    onReload();
  }

  function doResolve() {
    resolveComment(projectNo, comment.comment_id);
    onReload();
  }

  function handleResolveClick() {
    if (isAuthorized()) {
      doResolve();
    } else {
      setShowAuthModal(true);
    }
  }

  return (
    <div style={styles.commentItem}>
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={doResolve}
        title="Unlock Comment Resolution"
        description="Enter authorization password to resolve/unresolve comment."
      />

      <Avatar name={comment.commenter_name} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...styles.commentBubble, opacity: isResolved ? 0.55 : 1 }}>
          <div style={styles.commentMeta}>
            <span style={styles.commentAuthor}>{comment.commenter_name}</span>
            <span style={styles.commentTime}>{formatTs(comment.commented_at)}</span>
            {isResolved && (
              <span className="badge badge-gray" style={{ marginLeft: 'auto', fontSize: 10 }}>Resolved</span>
            )}
          </div>
          <div style={styles.commentText}>{comment.comment_text}</div>
          <div style={styles.commentActions}>
            <button onClick={() => setShowReply(v => !v)} style={{ ...styles.actionLink, color: 'var(--c-primary)' }}>Reply</button>
            <button onClick={handleResolveClick} style={{ ...styles.actionLink, color: isResolved ? 'var(--c-green)' : 'var(--c-text-3)' }}>
              {isResolved ? '✓ Resolved' : 'Mark Resolved'}
            </button>
          </div>
        </div>

        {replies.length > 0 && (
          <div style={styles.repliesList}>
            {replies.map(rep => (
              <div key={rep.comment_id} style={styles.commentItem}>
                <Avatar name={rep.commenter_name} size="sm" />
                <div style={{ flex: 1 }}>
                  <div style={styles.commentBubble}>
                    <div style={styles.commentMeta}>
                      <span style={styles.commentAuthor}>{rep.commenter_name}</span>
                      <span style={styles.commentTime}>{formatTs(rep.commented_at)}</span>
                    </div>
                    <div style={styles.commentText}>{rep.comment_text}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showReply && (
          <IssueCommentForm
            projectNo={projectNo}
            isReply
            onCancel={() => setShowReply(false)}
            onSubmit={handleReply}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Per-issue comment thread ────────────────────────────────── */
function IssueCommentThread({ projectNo, issueId }) {
  const [comments, setComments] = useState([]);
  const [open, setOpen]         = useState(false);

  const reload = useCallback(() => {
    const all = getComments(projectNo);
    setComments(all.filter(c => c.target_field === issueId));
  }, [projectNo, issueId]);

  useEffect(() => { reload(); }, [reload]);

  const topLevel = comments.filter(c => !c.parent_comment_id);
  const replyMap = {};
  comments.forEach(c => {
    if (c.parent_comment_id) {
      if (!replyMap[c.parent_comment_id]) replyMap[c.parent_comment_id] = [];
      replyMap[c.parent_comment_id].push(c);
    }
  });

  function handleAddComment({ personnelId, commenterName, text }) {
    addComment({ projectNo, personnelId, commenterName, text, targetField: issueId });
    reload();
  }

  const count = topLevel.length;

  return (
    <div style={styles.threadWrap}>
      <button onClick={() => setOpen(v => !v)} style={styles.commentToggle}>
        <span style={{ fontSize: 13 }}>💬</span>
        <span>{count > 0 ? `Comments (${count})` : 'Add Comment'}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={styles.threadBody}>
          {topLevel.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-3)' }}>
              {topLevel.map(c => (
                <IssueCommentItem
                  key={c.comment_id}
                  comment={c}
                  replies={replyMap[c.comment_id] || []}
                  projectNo={projectNo}
                  onReload={reload}
                />
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginBottom: 'var(--sp-2)' }}>
              No comments yet. Be the first to comment.
            </p>
          )}
          <IssueCommentForm projectNo={projectNo} issueId={issueId} onSubmit={handleAddComment} />
        </div>
      )}
    </div>
  );
}

/* ─── Inline edit row ─────────────────────────────────────────── */
function IssueRow({ issue, index, projectNo, onChanged, onDeleted }) {
  const [editing, setEditing]       = useState(false);
  const [draft, setDraft]           = useState(issue.description || '');
  const [draftStatus, setDraftStatus] = useState(
    (issue.status === 'Resolved' || issue.status === 'Closed') ? 'Resolved' : 'On-going'
  );
  const [busy, setBusy]             = useState(false);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('Authorization Required');
  const [authDesc, setAuthDesc]           = useState('Enter password to proceed.');

  const isResolved = (issue.status === 'Resolved' || issue.status === 'Closed');
  const currentStatus = isResolved ? 'Resolved' : 'On-going';

  function handleSave() {
    if (!draft.trim()) return;
    setBusy(true);
    updateIssue(projectNo, issue.issue_id, { description: draft.trim(), status: draftStatus });
    onChanged(issue.issue_id, { description: draft.trim(), status: draftStatus });
    setEditing(false);
    setBusy(false);
  }

  function doToggleStatus() {
    const nextStatus = isResolved ? 'On-going' : 'Resolved';
    updateIssue(projectNo, issue.issue_id, { status: nextStatus });
    onChanged(issue.issue_id, { status: nextStatus });
  }

  function handleToggleStatus(e) {
    if (e) e.stopPropagation();
    const nextStatus = isResolved ? 'On-going' : 'Resolved';
    if (isAuthorized()) {
      doToggleStatus();
    } else {
      setAuthTitle('Unlock Status Change');
      setAuthDesc(`Enter authorization password to change status to ${nextStatus}.`);
      setPendingAction(() => doToggleStatus);
      setShowAuthModal(true);
    }
  }

  function doDelete() {
    if (!window.confirm('Remove this item?')) return;
    deleteIssue(projectNo, issue.issue_id);
    onDeleted(issue.issue_id);
  }

  function handleDelete() {
    if (isAuthorized()) {
      doDelete();
    } else {
      setAuthTitle('Unlock Item Deletion');
      setAuthDesc('Enter authorization password to delete this item.');
      setPendingAction(() => doDelete);
      setShowAuthModal(true);
    }
  }

  function doEdit() {
    setDraft(issue.description || '');
    setDraftStatus(currentStatus);
    setEditing(true);
  }

  function handleEditClick() {
    if (isAuthorized()) {
      doEdit();
    } else {
      setAuthTitle('Unlock Item Editing');
      setAuthDesc('Enter authorization password to edit this item.');
      setPendingAction(() => doEdit);
      setShowAuthModal(true);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave(); }
    if (e.key === 'Escape') {
      setDraft(issue.description || '');
      setDraftStatus(currentStatus);
      setEditing(false);
    }
  }

  return (
    <div style={styles.row}>
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title={authTitle}
        description={authDesc}
      />

      {/* Header row */}
      <div style={styles.rowHeader}>
        <span style={styles.itemLabel}>Item #{index + 1}</span>
        <div style={styles.rowActions}>
          {/* Quick status toggle icon */}
          <button
            onClick={handleToggleStatus}
            title={isResolved ? 'Reopen as On-going' : 'Mark as Resolved'}
            style={{ ...styles.iconBtn, color: isResolved ? 'var(--c-green)' : 'var(--c-amber)' }}
          >
            <i className={`fas ${isResolved ? 'fa-check-circle' : 'fa-circle'}`}></i>
          </button>
          {/* Edit pencil */}
          {!editing && (
            <button
              onClick={handleEditClick}
              style={styles.iconBtn}
              title="Edit"
            >
              <i className="fas fa-edit"></i>
            </button>
          )}
          {/* Delete */}
          <button onClick={handleDelete} style={{ ...styles.iconBtn, color: 'var(--c-red)' }} title="Remove item">
            <i className="fas fa-trash-alt"></i>
          </button>
          {/* Clickable Badge */}
          <span
            onClick={handleToggleStatus}
            style={{ cursor: 'pointer' }}
            title={`Click to change status to ${isResolved ? 'On-going' : 'Resolved'}`}
          >
            <Badge variant={isResolved ? 'green' : 'amber'}>{currentStatus}</Badge>
          </span>
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div style={{ marginTop: 6 }}>
          <textarea
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            style={styles.textarea}
            placeholder="Describe the issue…"
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--sp-2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', fontWeight: 600 }}>Status:</label>
              <select
                className="form-select"
                value={draftStatus}
                onChange={e => setDraftStatus(e.target.value)}
                style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}
              >
                <option value="On-going">On-going</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div style={styles.editButtons}>
              <button onClick={handleSave} disabled={busy || !draft.trim()} style={styles.saveBtn}>Save</button>
              <button
                onClick={() => {
                  setDraft(issue.description || '');
                  setDraftStatus(currentStatus);
                  setEditing(false);
                }}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            ...styles.description,
            textDecoration: isResolved ? 'line-through' : 'none',
            color: isResolved ? 'var(--c-text-3)' : 'var(--c-text)',
          }}
          onClick={() => {
            setDraft(issue.description || '');
            setDraftStatus(currentStatus);
            setEditing(true);
          }}
          title="Click to edit"
        >
          {issue.description || <span style={{ color: 'var(--c-text-3)' }}>No description — click to add</span>}
        </div>
      )}

      {/* Per-issue comment thread */}
      <IssueCommentThread projectNo={projectNo} issueId={issue.issue_id} />
    </div>
  );
}

/* ─── Add-new form ────────────────────────────────────────────── */
function AddIssueForm({ projectNo, onAdded }) {
  const [text, setText]         = useState('');
  const [status, setStatus]     = useState('On-going');
  const [visible, setVisible]   = useState(false);

  function handleAdd() {
    const trimmed = text.trim();
    if (!trimmed) return;
    const newIssue = addIssue(projectNo, trimmed, status);
    onAdded(newIssue);
    setText('');
    setStatus('On-going');
    setVisible(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
    if (e.key === 'Escape') { setText(''); setVisible(false); }
  }

  if (!visible) {
    return (
      <button onClick={() => setVisible(true)} style={styles.addBtn}>
        <i className="fas fa-plus mr-1"></i> Add Item
      </button>
    );
  }

  return (
    <div style={styles.addForm}>
      <textarea
        autoFocus
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        style={styles.textarea}
        placeholder="Describe the concern, issue, or remark… (Enter to save, Esc to cancel)"
      />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'var(--sp-2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <label style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', fontWeight: 600 }}>Status:</label>
          <select
            className="form-select"
            value={status}
            onChange={e => setStatus(e.target.value)}
            style={{ padding: '2px 8px', fontSize: 'var(--text-xs)' }}
          >
            <option value="On-going">On-going</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>

        <div style={styles.editButtons}>
          <button onClick={handleAdd} disabled={!text.trim()} style={styles.saveBtn}>Add</button>
          <button onClick={() => { setText(''); setVisible(false); }} style={styles.cancelBtn}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main panel ──────────────────────────────────────────────── */
export default function IssuesPanel({ projectNo, issues: initialIssues = [], generalRemarks = null }) {
  const [issues, setIssues] = useState(initialIssues);

  function handleChanged(issueId, patch) {
    setIssues(prev => prev.map(iss => iss.issue_id === issueId ? { ...iss, ...patch } : iss));
  }

  function handleDeleted(issueId) {
    setIssues(prev => prev.filter(iss => iss.issue_id !== issueId));
  }

  function handleAdded(newIssue) {
    setIssues(prev => [...prev, newIssue]);
  }

  return (
    <div className="card" style={{ marginBottom: 'var(--sp-4)' }}>
      <div className="card-header" style={styles.header}>
        <h3 className="card-title">
          <i className="fas fa-exclamation-circle mr-2 text-warning" style={{ fontSize: '0.95rem' }}></i>
          Issues, Concerns &amp; Remarks
        </h3>
        <span style={styles.countPill}>{issues.length} item{issues.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ padding: '0 var(--sp-4) var(--sp-4)' }}>
        {issues.length === 0 && (
          <div className="empty-state" style={{ marginBottom: 'var(--sp-3)' }}>
            No active issues or remarks — add one below.
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
          {issues.map((iss, i) => (
            <IssueRow
              key={iss.issue_id || i}
              issue={iss}
              index={i}
              projectNo={projectNo}
              onChanged={handleChanged}
              onDeleted={handleDeleted}
            />
          ))}
        </div>

        {generalRemarks && (
          <div style={styles.remarksBox}>
            <span className="section-label">General Remarks</span>
            <div className="text-sm mt-2">{generalRemarks}</div>
          </div>
        )}

        <div style={{ marginTop: 'var(--sp-4)' }}>
          <AddIssueForm projectNo={projectNo} onAdded={handleAdded} />
        </div>
      </div>
    </div>
  );
}

/* ─── Inline styles ───────────────────────────────────────────── */
const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  countPill: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    background: 'var(--c-gray-bg)',
    color: 'var(--c-text-3)',
    padding: '2px 8px',
    borderRadius: 20,
  },
  row: {
    background: 'var(--c-gray-bg)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-md)',
    padding: 'var(--sp-3)',
    transition: 'box-shadow .15s',
  },
  rowHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--c-text-3)',
    textTransform: 'uppercase',
    letterSpacing: '.04em',
  },
  rowActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-2)',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    color: 'var(--c-text-3)',
    padding: '2px 4px',
    borderRadius: 4,
    lineHeight: 1,
    transition: 'color .15s',
  },
  description: {
    fontSize: 'var(--text-sm)',
    lineHeight: 1.5,
    cursor: 'pointer',
    borderRadius: 4,
    padding: '2px 0',
    minHeight: 22,
  },
  textarea: {
    width: '100%',
    border: '1px solid var(--c-primary)',
    borderRadius: 'var(--r-sm)',
    padding: 'var(--sp-2)',
    fontSize: 'var(--text-sm)',
    fontFamily: 'var(--font)',
    color: 'var(--c-text)',
    background: 'var(--c-surface)',
    resize: 'vertical',
    outline: 'none',
    boxShadow: '0 0 0 3px var(--c-primary-bg)',
  },
  editButtons: {
    display: 'flex',
    gap: 'var(--sp-2)',
    marginTop: 'var(--sp-2)',
  },
  saveBtn: {
    background: 'var(--c-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--r-sm)',
    padding: '4px 14px',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
  },
  cancelBtn: {
    background: 'var(--c-gray-bg)',
    color: 'var(--c-text-2)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-sm)',
    padding: '4px 12px',
    fontSize: 'var(--text-sm)',
    cursor: 'pointer',
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: '1.5px dashed var(--c-border-md)',
    borderRadius: 'var(--r-md)',
    width: '100%',
    padding: 'var(--sp-3)',
    color: 'var(--c-primary)',
    fontSize: 'var(--text-sm)',
    fontWeight: 600,
    cursor: 'pointer',
    justifyContent: 'center',
    transition: 'border-color .15s, background .15s',
  },
  addForm: {
    background: 'var(--c-gray-bg)',
    border: '1px solid var(--c-border)',
    borderRadius: 'var(--r-md)',
    padding: 'var(--sp-3)',
  },
  remarksBox: {
    marginTop: 'var(--sp-4)',
    padding: 'var(--sp-3)',
    background: 'var(--c-gray-bg)',
    borderRadius: 'var(--r-sm)',
  },
  // ── Comment thread ──
  threadWrap: {
    marginTop: 'var(--sp-3)',
    borderTop: '1px solid var(--c-border)',
    paddingTop: 'var(--sp-2)',
  },
  commentToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-2)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    color: 'var(--c-primary)',
    fontWeight: 600,
    padding: '2px 0',
    width: '100%',
    textAlign: 'left',
  },
  threadBody: {
    marginTop: 'var(--sp-2)',
    padding: 'var(--sp-3)',
    background: 'var(--c-surface)',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--c-border)',
  },
  commentItem: {
    display: 'flex',
    gap: 'var(--sp-2)',
    alignItems: 'flex-start',
  },
  commentBubble: {
    background: 'var(--c-gray-bg)',
    borderRadius: 'var(--r-md)',
    padding: 'var(--sp-2) var(--sp-3)',
    flex: 1,
  },
  commentMeta: {
    display: 'flex',
    gap: 'var(--sp-2)',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentAuthor: {
    fontWeight: 600,
    fontSize: 'var(--text-xs)',
    color: 'var(--c-text)',
  },
  commentTime: {
    fontSize: 'var(--text-xs)',
    color: 'var(--c-text-3)',
  },
  commentText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--c-text)',
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  },
  commentActions: {
    display: 'flex',
    gap: 'var(--sp-3)',
    marginTop: 'var(--sp-1)',
  },
  actionLink: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    padding: 0,
  },
  repliesList: {
    marginTop: 'var(--sp-2)',
    marginLeft: 'var(--sp-4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
  },
  commentForm: {
    marginTop: 'var(--sp-2)',
    background: 'var(--c-bg)',
    borderRadius: 'var(--r-sm)',
    padding: 'var(--sp-2)',
    border: '1px solid var(--c-border)',
  },
  addPersonMini: {
    display: 'flex',
    gap: 'var(--sp-2)',
    alignItems: 'center',
    marginBottom: 'var(--sp-2)',
    padding: 'var(--sp-2)',
    background: 'var(--c-surface)',
    borderRadius: 'var(--r-sm)',
    border: '1px solid var(--c-border)',
  },
};
