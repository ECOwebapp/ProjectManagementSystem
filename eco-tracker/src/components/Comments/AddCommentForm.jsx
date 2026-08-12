// AddCommentForm.jsx — Form for adding comments / replies with personnel selector & inline add
import { useState, useEffect } from 'react';
import { getPersonnel, addPersonnel } from '../../data/projectsRepo.js';
import Avatar from '../shared/Avatar.jsx';

export default function AddCommentForm({
  onSubmit,
  onCancel = null,
  placeholder = "Share an update or question about this project...",
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
    <div style={{ marginTop: isReply ? 8 : 0 }}>
      <form onSubmit={handleSubmit}>
        {/* Person Selector Row */}
        <div style={{ display: 'flex', gap: 'var(--sp-3)', alignItems: 'center', marginBottom: 'var(--sp-3)' }}>
          {selectedPerson ? (
            <Avatar name={selectedPerson.name} size="sm" />
          ) : (
            <div className="avatar avatar-sm" style={{ background: 'var(--gray)' }}>?</div>
          )}
          <div style={{ flex: 1 }}>
            <select
              className="form-select"
              value={selectedPersonnelId}
              onChange={(e) => setSelectedPersonnelId(e.target.value)}
              style={{ padding: '6px 10px', fontSize: 13, height: 36 }}
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

        {/* Inline Add Person Form */}
        {showAddInline && (
          <div style={{ padding: 'var(--sp-3)', marginBottom: 'var(--sp-3)', background: 'var(--gray-light)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
            <span className="section-label" style={{ fontSize: 10 }}>ADD NEW PERSONNEL</span>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 4 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Full Name (e.g. Engr. Jane Doe)"
                value={newPersonName}
                onChange={e => setNewPersonName(e.target.value)}
                style={{ fontSize: 12 }}
              />
              <input
                type="text"
                className="form-input"
                placeholder="Title/Role (optional)"
                value={newPersonTitle}
                onChange={e => setNewPersonTitle(e.target.value)}
                style={{ fontSize: 12 }}
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

        {/* Textarea */}
        <div style={{ marginBottom: 'var(--sp-3)' }}>
          <textarea
            className="form-textarea"
            placeholder={placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={isReply ? 2 : 3}
            style={{ minHeight: 80, padding: 12, borderRadius: 'var(--r-md)' }}
          />
        </div>

        {/* Right-aligned Submit Button */}
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
            style={{ boxShadow: '0 1px 2px rgba(36, 81, 184, 0.2)', fontWeight: 600 }}
          >
            {buttonText}
          </button>
        </div>
      </form>
    </div>
  );
}
