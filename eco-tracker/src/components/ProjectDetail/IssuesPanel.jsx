// IssuesPanel.jsx – Editable Issues, Concerns & Remarks panel with photo attachment support & Lightbox
import { useState, useEffect, useCallback, useRef } from 'react';
import Badge from '../shared/Badge.jsx';
import Avatar from '../shared/Avatar.jsx';
import PasswordModal, { isAuthorized } from '../shared/PasswordModal.jsx';
import {
  addIssue, updateIssue, deleteIssue,
  getComments, addComment, addReply, resolveComment,
  getPersonnel, addPersonnel,
} from '../../data/projectsRepo.js';
import { compressAndConvertToBase64 } from '../../utils/imageUtils.js';

/* ─── Helpers ─────────────────────────────────────────────────── */
function formatTs(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
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

/* ─── Mini personnel picker + comment form ───────────────────── */
function IssueCommentForm({ projectNo, issueId, onSubmit, onCancel, isReply = false }) {
  const [personnel, setPersonnel]       = useState([]);
  const [selectedId, setSelectedId]     = useState('');
  const [text, setText]                 = useState('');
  const [imageUrl, setImageUrl]         = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [addingPerson, setAddingPerson] = useState(false);
  const [newName, setNewName]           = useState('');
  const [newTitle, setNewTitle]         = useState('');

  const fileInputRef = useRef(null);

  const loadPersonnel = useCallback(async () => {
    try {
      const list = await getPersonnel();
      setPersonnel(list);
      if (list.length > 0) setSelectedId(id => id || list[0].personnel_id);
    } catch (e) {
      console.error('loadPersonnel error:', e.message);
    }
  }, []);

  useEffect(() => { loadPersonnel(); }, [loadPersonnel]);

  const selectedPerson = personnel.find(p => p.personnel_id === selectedId);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const base64 = await compressAndConvertToBase64(file);
      setImageUrl(base64);
    } catch (err) {
      alert(`Failed to process image: ${err.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  async function handleAddPerson(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await addPersonnel({ name: newName.trim(), title: newTitle.trim() });
      setNewName(''); setNewTitle(''); setAddingPerson(false);
      await loadPersonnel();
      if (created) setSelectedId(created.personnel_id);
    } catch (err) {
      console.error('addPersonnel error:', err.message);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || !selectedPerson) return;
    onSubmit({ personnelId: selectedPerson.personnel_id, commenterName: selectedPerson.name, text: text.trim(), imageUrl: imageUrl || null });
    setText('');
    setImageUrl('');
    if (onCancel) onCancel();
  }

  return (
    <div style={{ marginTop: 12, padding: 12, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
          {selectedPerson && <Avatar name={selectedPerson.name} size="sm" />}
          <select className="form-select" value={selectedId} onChange={e => setSelectedId(e.target.value)}
            style={{ flex: 1, padding: '4px 8px', fontSize: 11 }}>
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
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <input className="form-input" placeholder="Full Name" value={newName}
              onChange={e => setNewName(e.target.value)} style={{ fontSize: 11 }} />
            <input className="form-input" placeholder="Title (optional)" value={newTitle}
              onChange={e => setNewTitle(e.target.value)} style={{ fontSize: 11 }} />
            <button type="button" className="btn btn-primary btn-xs" onClick={handleAddPerson}>Save</button>
          </div>
        )}

        <textarea className="form-textarea" rows={2} value={text} onChange={e => setText(e.target.value)}
          placeholder={isReply ? 'Write a reply…' : 'Add a comment on this item…'}
          style={{ fontSize: 12, marginBottom: 'var(--sp-2)' }} />

        {imageUrl && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--sp-2)' }}>
            <img src={imageUrl} alt="Attached preview" style={{ maxHeight: 100, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              style={{
                position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >✕</button>
          </div>
        )}

        <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImage}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--blue)',
              border: '1px solid var(--border)',
              background: '#FFFFFF',
              padding: '4px 10px',
              borderRadius: '6px',
              fontWeight: 500,
              fontSize: 12,
              cursor: 'pointer'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>{uploadingImage ? 'Processing…' : (imageUrl ? 'Change Photo' : 'Attach Photo')}</span>
          </button>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {onCancel && (
              <button type="button" className="btn btn-ghost btn-xs" onClick={onCancel}>Cancel</button>
            )}
            <button type="submit" className="btn btn-primary btn-xs" disabled={!text.trim() || !selectedPerson || uploadingImage}>
              {isReply ? 'Reply' : 'Comment'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

/* ─── Single comment bubble ───────────────────────────────────── */
function IssueCommentItem({ comment, replies, projectNo, onReload, onOpenImage }) {
  const [showReply, setShowReply]         = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isResolved = comment.is_resolved;

  function handleReply({ personnelId, commenterName, text, imageUrl }) {
    addReply({ projectNo, personnelId, commenterName, text, parentCommentId: comment.comment_id, imageUrl });
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
    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={doResolve}
        title="Authorization Required"
        description="Enter authorization password to resolve/unresolve this comment."
      />

      <Avatar name={comment.commenter_name} size="sm" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '0 8px 8px 8px', padding: '8px 12px', opacity: isResolved ? 0.6 : 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 12, color: 'var(--navy)' }}>{comment.commenter_name}</span>
            <span style={{ fontSize: 10, color: 'var(--gray)' }}>{formatTs(comment.commented_at)}</span>
            {isResolved && (
              <span className="badge badge-gray" style={{ marginLeft: 'auto', fontSize: 10 }}>Resolved</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--navy)', lineHeight: 1.5 }}>{comment.comment_text}</div>
          {comment.image_url && (
            <div style={{ marginTop: 6 }}>
              <img
                src={comment.image_url}
                alt="Attached photo"
                onClick={() => onOpenImage(comment.image_url)}
                style={{ maxHeight: 120, maxWidth: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer', objectFit: 'cover' }}
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
            <button onClick={() => setShowReply(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--blue)' }}>Reply</button>
            <button onClick={handleResolveClick} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600, color: isResolved ? 'var(--green)' : 'var(--gray)' }}>
              {isResolved ? '✓ Resolved' : 'Mark Resolved'}
            </button>
          </div>
        </div>

        {replies.length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
            {replies.map(rep => (
              <div key={rep.comment_id} style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Avatar name={rep.commenter_name} size="sm" />
                <div style={{ flex: 1, background: '#FFFFFF', border: '1px solid var(--border)', borderRadius: '0 8px 8px 8px', padding: '6px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--navy)' }}>{rep.commenter_name}</span>
                    <span style={{ fontSize: 10, color: 'var(--gray)' }}>{formatTs(rep.commented_at)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--navy)' }}>{rep.comment_text}</div>
                  {rep.image_url && (
                    <div style={{ marginTop: 4 }}>
                      <img
                        src={rep.image_url}
                        alt="Attached photo"
                        onClick={() => onOpenImage(rep.image_url)}
                        style={{ maxHeight: 100, maxWidth: '100%', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', cursor: 'pointer', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {showReply && (
          <IssueCommentForm
            projectNo={projectNo} isReply
            onCancel={() => setShowReply(false)}
            onSubmit={handleReply}
          />
        )}
      </div>
    </div>
  );
}

/* ─── Per-issue comment thread ────────────────────────────────── */
function IssueCommentThread({ projectNo, issueId, onOpenImage }) {
  const [comments, setComments] = useState([]);
  const [open, setOpen]         = useState(false);

  const reload = useCallback(async () => {
    try {
      const all = await getComments(projectNo);
      setComments(all.filter(c => c.target_field === issueId));
    } catch (e) {
      console.error('Failed to load issue comments:', e.message);
    }
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

  const count = topLevel.length;

  return (
    <div style={{ marginTop: 8 }}>
      <button onClick={() => setOpen(v => !v)} className="comment-link-action">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <span>{count > 0 ? `Comments (${count})` : 'Add Comment'}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
          {topLevel.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
              {topLevel.map(c => (
                <IssueCommentItem key={c.comment_id} comment={c}
                  replies={replyMap[c.comment_id] || []} projectNo={projectNo} onReload={reload} onOpenImage={onOpenImage} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted" style={{ marginBottom: 8 }}>No comments yet. Be the first to comment.</p>
          )}
          <IssueCommentForm projectNo={projectNo} issueId={issueId} onSubmit={async ({ personnelId, commenterName, text, imageUrl }) => {
            await addComment({ projectNo, personnelId, commenterName, text, targetField: issueId, imageUrl });
            reload();
          }} />
        </div>
      )}
    </div>
  );
}

/* ─── Issue Row with password-on-save ────────────────────────── */
function IssueRow({ issue, index, projectNo, onChanged, onDeleted, onOpenImage }) {
  const [editing, setEditing]           = useState(false);
  const [draft, setDraft]               = useState(issue.description || '');
  const [draftStatus, setDraftStatus]   = useState(
    (issue.status === 'Resolved' || issue.status === 'Closed') ? 'Resolved' : 'On-going'
  );
  const [draftImageUrl, setDraftImageUrl] = useState(issue.image_url || '');
  const [uploadingImage, setUploadingImage] = useState(false);

  const fileInputRef = useRef(null);

  // Kebab menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('Authorization Required');
  const [authDesc, setAuthDesc]           = useState('Enter password to proceed.');

  const isResolved = (issue.status === 'Resolved' || issue.status === 'Closed');
  const currentStatus = isResolved ? 'Resolved' : 'On-going';

  // Close dropdown on click outside
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const base64 = await compressAndConvertToBase64(file);
      setDraftImageUrl(base64);
    } catch (err) {
      alert(`Failed to process image: ${err.message}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* Opens freely — no password yet */
  function openEdit() {
    setDraft(issue.description || '');
    setDraftStatus(currentStatus);
    setDraftImageUrl(issue.image_url || '');
    setEditing(true);
    setMenuOpen(false);
  }

  /* Execute actions (called after auth) */
  async function executeStatusToggle() {
    const nextStatus = isResolved ? 'On-going' : 'Resolved';
    await updateIssue(projectNo, issue.issue_id, { status: nextStatus });
    onChanged(issue.issue_id, { status: nextStatus });
    setPendingAction(null);
  }

  async function executeSaveEdit() {
    if (!draft.trim()) return;
    const patch = { description: draft.trim(), status: draftStatus, image_url: draftImageUrl || null };
    await updateIssue(projectNo, issue.issue_id, patch);
    onChanged(issue.issue_id, patch);
    setEditing(false);
    setPendingAction(null);
  }

  async function executeDelete() {
    await deleteIssue(projectNo, issue.issue_id);
    onDeleted(issue.issue_id);
    setPendingAction(null);
  }

  /* Kebab menu handlers — open forms freely, password on save/delete */
  function handleStatusMenuClick() {
    setMenuOpen(false);
    const nextStatus = isResolved ? 'On-going' : 'Resolved';
    if (isAuthorized()) {
      executeStatusToggle();
    } else {
      setAuthTitle('Authorization Required');
      setAuthDesc(`Enter password to change status to "${nextStatus}".`);
      setPendingAction(() => executeStatusToggle);
      setShowAuthModal(true);
    }
  }

  function handleDeleteMenuClick() {
    setMenuOpen(false);
    if (!window.confirm('Remove this item?')) return;
    if (isAuthorized()) {
      executeDelete();
    } else {
      setAuthTitle('Authorization Required to Delete');
      setAuthDesc('Enter password to delete this item.');
      setPendingAction(() => executeDelete);
      setShowAuthModal(true);
    }
  }

  /* Save edit form — password checked here */
  function handleSaveEdit() {
    if (!draft.trim()) return;
    if (isAuthorized()) {
      executeSaveEdit();
    } else {
      setAuthTitle('Authorization Required to Save');
      setAuthDesc('Enter password to save changes to this item.');
      setPendingAction(() => executeSaveEdit);
      setShowAuthModal(true);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
    if (e.key === 'Escape') {
      setDraft(issue.description || '');
      setDraftStatus(currentStatus);
      setDraftImageUrl(issue.image_url || '');
      setEditing(false);
    }
  }

  return (
    <div className="issue-card-item">
      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title={authTitle}
        description={authDesc}
      />

      {/* Header row */}
      <div className="issue-card-header">
        <span className="section-label" style={{ marginBottom: 0 }}>ITEM #{index + 1}</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Badge variant={isResolved ? 'green' : 'amber'}>{currentStatus}</Badge>

          {/* Kebab (⋮) Dropdown */}
          <div className="kebab-wrap" ref={menuRef}>
            <button
              className={`kebab-btn${menuOpen ? ' active' : ''}`}
              onClick={() => setMenuOpen(v => !v)}
              title="Actions"
            >
              ⋮
            </button>

            {menuOpen && (
              <div className="kebab-dropdown">
                <button className="kebab-item" onClick={handleStatusMenuClick}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 2 2h14a2 2 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                  <span>Change Status</span>
                </button>

                <button className="kebab-item" onClick={openEdit}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Edit Item</span>
                </button>

                <div className="kebab-divider" />

                <button className="kebab-item danger" onClick={handleDeleteMenuClick}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div style={{ marginTop: 8 }}>
          <textarea
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2} className="form-textarea"
            placeholder="Describe the issue…"
          />

          {draftImageUrl && (
            <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
              <img src={draftImageUrl} alt="Attached preview" style={{ maxHeight: 120, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setDraftImageUrl('')}
                style={{
                  position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>
          )}

          <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--blue)',
                  border: '1px solid var(--border)',
                  background: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontWeight: 500,
                  fontSize: 12,
                  cursor: 'pointer'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span>{uploadingImage ? 'Processing…' : (draftImageUrl ? 'Change Photo' : 'Attach Photo')}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: 'var(--navy)', fontWeight: 600 }}>Status:</label>
                <select className="form-select" value={draftStatus} onChange={e => setDraftStatus(e.target.value)}
                  style={{ padding: '2px 8px', fontSize: 11 }}>
                  <option value="On-going">On-going</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary btn-xs" onClick={handleSaveEdit} disabled={!draft.trim() || uploadingImage}>Save</button>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{ fontSize: 13, color: isResolved ? 'var(--gray)' : 'var(--navy)',
              textDecoration: isResolved ? 'line-through' : 'none', cursor: 'pointer', lineHeight: 1.5 }}
            onClick={openEdit}
            title="Click to edit"
          >
            {issue.description || <span className="text-muted">No description — click to add</span>}
          </div>

          {issue.image_url && (
            <div style={{ marginTop: 8 }}>
              <img
                src={issue.image_url}
                alt="Attached photo"
                onClick={() => onOpenImage(issue.image_url)}
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
        </div>
      )}

      <IssueCommentThread projectNo={projectNo} issueId={issue.issue_id} onOpenImage={onOpenImage} />
    </div>
  );
}

/* ─── Main Panel ──────────────────────────────────────────────── */
export default function IssuesPanel({ projectNo, issues: initialIssues = [], generalRemarks = null }) {
  const [issuesList, setIssuesList]       = useState(initialIssues);
  const [remarks, setRemarks]             = useState(generalRemarks || '');
  const [editingRemarks, setEditingRemarks] = useState(false);
  const [remarksDraft, setRemarksDraft]   = useState(remarks);
  const [showAddForm, setShowAddForm]     = useState(false);
  const [newItemText, setNewItemText]     = useState('');
  const [newItemImage, setNewItemImage]   = useState('');
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [activeLightboxSrc, setActiveLightboxSrc]   = useState(null);

  const addItemFileInputRef = useRef(null);

  // Auth modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [authTitle, setAuthTitle]         = useState('');
  const [authDesc, setAuthDesc]           = useState('');

  useEffect(() => { setIssuesList(initialIssues); }, [initialIssues]);
  useEffect(() => { setRemarks(generalRemarks || ''); }, [generalRemarks]);

  const handleAddItemFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItemImage(true);
    try {
      const base64 = await compressAndConvertToBase64(file);
      setNewItemImage(base64);
    } catch (err) {
      alert(`Failed to process image: ${err.message}`);
    } finally {
      setUploadingItemImage(false);
      if (addItemFileInputRef.current) addItemFileInputRef.current.value = '';
    }
  };

  function handleItemChanged(issueId, patch) {
    setIssuesList(prev => prev.map(item => item.issue_id === issueId ? { ...item, ...patch } : item));
  }

  function handleItemDeleted(issueId) {
    setIssuesList(prev => prev.filter(item => item.issue_id !== issueId));
  }

  async function executeAddItem() {
    if (!newItemText.trim()) return;
    try {
      await addIssue(projectNo, newItemText.trim(), 'Open', newItemImage || null);
      const tempIssue = {
        issue_id: `temp-${Date.now()}`,
        project_no: projectNo,
        description: newItemText.trim(),
        status: 'Open',
        image_url: newItemImage || null
      };
      setIssuesList(prev => [...prev, tempIssue]);
    } catch (e) {
      console.error('Failed to add issue:', e.message);
    }
    setNewItemText('');
    setNewItemImage('');
    setShowAddForm(false);
    setPendingAction(null);
  }

  /* Add item form opens freely — password on submit */
  function handleAddItemSubmit(e) {
    e.preventDefault();
    if (!newItemText.trim()) return;
    if (isAuthorized()) {
      executeAddItem();
    } else {
      setAuthTitle('Authorization Required to Save');
      setAuthDesc('Enter password to add this item.');
      setPendingAction(() => executeAddItem);
      setShowAuthModal(true);
    }
  }

  function executeRemarksEdit() {
    setRemarksDraft(remarks);
    setEditingRemarks(true);
    setPendingAction(null);
  }

  function executeSaveRemarks() {
    setRemarks(remarksDraft.trim());
    setEditingRemarks(false);
    setPendingAction(null);
  }

  /* Remarks edit opens freely — password on save */
  function handleSaveRemarks() {
    if (isAuthorized()) {
      executeSaveRemarks();
    } else {
      setAuthTitle('Authorization Required to Save');
      setAuthDesc('Enter password to save general remarks.');
      setPendingAction(() => executeSaveRemarks);
      setShowAuthModal(true);
    }
  }

  return (
    <div className="card">
      <ImageLightbox
        src={activeLightboxSrc}
        onClose={() => setActiveLightboxSrc(null)}
      />

      <PasswordModal
        isOpen={showAuthModal}
        onClose={() => { setShowAuthModal(false); setPendingAction(null); }}
        onSuccess={() => { if (pendingAction) pendingAction(); }}
        title={authTitle}
        description={authDesc}
      />

      <div className="card-header">
        <h3 className="card-title">Issues, Concerns & Remarks</h3>
        <span className="text-muted text-xs">{issuesList.length} item{issuesList.length === 1 ? '' : 's'}</span>
      </div>

      {issuesList.length > 0 && (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          {issuesList.map((issue, idx) => (
            <IssueRow
              key={issue.issue_id}
              issue={issue}
              index={idx}
              projectNo={projectNo}
              onChanged={handleItemChanged}
              onDeleted={handleItemDeleted}
              onOpenImage={src => setActiveLightboxSrc(src)}
            />
          ))}
        </div>
      )}

      {/* Add Item — form opens freely, password on submit */}
      {showAddForm ? (
        <form onSubmit={handleAddItemSubmit} style={{ padding: 'var(--sp-4)', background: 'var(--gray-light)', borderRadius: 'var(--r-md)', marginBottom: 'var(--sp-4)', border: '1px solid var(--border)' }}>
          <label className="form-label" style={{ fontSize: 11 }}>New Issue / Concern Item</label>
          <textarea autoFocus className="form-textarea" rows={2} value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            placeholder="Describe the issue or concern…"
            style={{ fontSize: 13, marginBottom: 10 }} />

          {newItemImage && (
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 10 }}>
              <img src={newItemImage} alt="Attached preview" style={{ maxHeight: 120, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', objectFit: 'cover' }} />
              <button
                type="button"
                onClick={() => setNewItemImage('')}
                style={{
                  position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%',
                  background: 'var(--red)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >✕</button>
            </div>
          )}

          <input type="file" ref={addItemFileInputRef} accept="image/*" style={{ display: 'none' }} onChange={handleAddItemFileChange} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => addItemFileInputRef.current?.click()}
              disabled={uploadingItemImage}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--blue)',
                border: '1px solid var(--border)',
                background: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: '6px',
                fontWeight: 500,
                fontSize: 12,
                cursor: 'pointer'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>{uploadingItemImage ? 'Processing…' : (newItemImage ? 'Change Photo' : 'Attach Photo')}</span>
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setShowAddForm(false); setNewItemText(''); setNewItemImage(''); }}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={!newItemText.trim() || uploadingItemImage}>
                Add Item
              </button>
            </div>
          </div>
        </form>
      ) : (
        <button className="btn-dashed" onClick={() => setShowAddForm(true)} style={{ marginBottom: 'var(--sp-5)' }}>
          + Add Item
        </button>
      )}

      {/* General Remarks — opens freely, password on save */}
      <div style={{ background: '#FBFBF9', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-4)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="section-label" style={{ marginBottom: 0 }}>GENERAL REMARKS</span>
          {!editingRemarks && (
            <button className="btn-outline-pill" onClick={() => { setRemarksDraft(remarks); setEditingRemarks(true); }}
              style={{ padding: '2px 8px', fontSize: 10 }}>
              ✎ Edit
            </button>
          )}
        </div>

        {editingRemarks ? (
          <div>
            <textarea className="form-textarea" rows={3} value={remarksDraft}
              onChange={e => setRemarksDraft(e.target.value)} style={{ fontSize: 13, marginBottom: 8 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
              <button className="btn btn-ghost btn-xs" onClick={() => setEditingRemarks(false)}>Cancel</button>
              <button className="btn btn-primary btn-xs" onClick={handleSaveRemarks}>Save Remarks</button>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: remarks ? 'var(--navy)' : 'var(--gray)', lineHeight: 1.6 }}>
            {remarks || 'No general remarks entered.'}
          </p>
        )}
      </div>
    </div>
  );
}

