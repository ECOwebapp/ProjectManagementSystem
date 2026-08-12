// AddCommentForm.jsx — Form for adding comments / replies with personnel selector & inline add
import { useState, useEffect } from 'react';
import { getPersonnel, addPersonnel } from '../../data/projectsRepo.js';
import Avatar from '../shared/Avatar.jsx';

export default function AddCommentForm({
  onSubmit,
  onCancel = null,
  placeholder = "Add a comment...",
  buttonText = "Comment",
  isReply = false
}) {
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [text, setText] = useState('');
  const [showAddInline, setShowAddInline] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonTitle, setNewPersonTitle] = useState('');

  const loadPersonnel = () => {
    const list = getPersonnel();
    setPersonnelList(list);
    if (list.length > 0 && !selectedPersonnelId) {
      setSelectedPersonnelId(list[0].personnel_id);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const selectedPerson = personnelList.find(p => p.personnel_id === selectedPersonnelId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedPerson) return;
    onSubmit({
      personnelId: selectedPerson.personnel_id,
      commenterName: selectedPerson.name,
      text: text.trim(),
    });
    setText('');
    if (onCancel) onCancel();
  };

  const handleAddInlinePerson = (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    const created = addPersonnel({ name: newPersonName.trim(), title: newPersonTitle.trim() });
    setNewPersonName('');
    setNewPersonTitle('');
    setShowAddInline(false);
    loadPersonnel();
    setSelectedPersonnelId(created.personnel_id);
  };

  return (
    <div className={isReply ? "reply-form-wrap" : "add-comment-form"}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          {selectedPerson && <Avatar name={selectedPerson.name} size="sm" />}
          <div style={{ flex: 1 }}>
            <select
              className="form-select"
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              style={{ padding: '4px 8px', fontSize: 'var(--text-sm)' }}
            >
              {personnelList.map(p => (
                <option key={p.personnel_id} value={p.personnel_id}>
                  {p.name} {p.title ? `(${p.title})` : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs"
            onClick={() => setShowAddInline(!showAddInline)}
          >
            {showAddInline ? 'Cancel' : '+ New Person'}
          </button>
        </div>

        {showAddInline && (
          <div className="card" style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-3)', background: 'var(--c-bg)' }}>
            <span className="section-label">Add New Personnel</span>
            <div className="inline-add-person">
              <input
                type="text"
                className="form-input"
                placeholder="Full Name (e.g. Engr. Jane Doe)"
                value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Title/Role (optional)"
                value={newPersonTitle}
                onChange={e => setNewPersonTitle(e.target.value)}
                style={{ fontSize: 'var(--text-xs)' }}
              />
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={handleAddInlinePerson}
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: 'var(--sp-3)' }}>
          <textarea
            className="form-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={isReply ? 2 : 3}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!text.trim() || !selectedPerson}
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
