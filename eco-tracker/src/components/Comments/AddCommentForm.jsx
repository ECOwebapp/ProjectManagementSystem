// AddCommentForm.jsx — Form for adding comments / replies with personnel selector & inline add & photo attachment
import { useState, useEffect, useRef } from 'react';
import { getPersonnel, addPersonnel } from '../../data/projectsRepo.js';
import Avatar from '../shared/Avatar.jsx';
import { compressAndConvertToBase64 } from '../../utils/imageUtils.js';

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
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showAddInline, setShowAddInline] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonTitle, setNewPersonTitle] = useState('');

  const fileInputRef = useRef(null);

  const loadPersonnel = async () => {
    try {
      const list = await getPersonnel();
      setPersonnelList(list);
      if (list.length > 0 && !selectedPersonnelId) {
        setSelectedPersonnelId(list[0].personnel_id);
      }
    } catch (e) {
      console.error('Failed to load personnel:', e.message);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const selectedPerson = personnelList.find(p => p.personnel_id === selectedPersonnelId);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedPerson) return;
    onSubmit({
      personnelId: selectedPerson.personnel_id,
      commenterName: selectedPerson.name,
      text: text.trim(),
      imageUrl: imageUrl || null,
    });
    setText('');
    setImageUrl('');
    if (onCancel) onCancel();
  };

  const handleAddInlinePerson = async (e) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;
    try {
      const created = await addPersonnel({ name: newPersonName.trim(), title: newPersonTitle.trim() });
      setNewPersonName('');
      setNewPersonTitle('');
      setShowAddInline(false);
      await loadPersonnel();
      if (created) setSelectedPersonnelId(created.personnel_id);
    } catch (err) {
      console.error('Failed to add personnel:', err.message);
    }
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

        {/* Image Attachment Preview */}
        {imageUrl && (
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 'var(--sp-3)' }}>
            <img
              src={imageUrl}
              alt="Attached preview"
              style={{ maxHeight: 120, borderRadius: 'var(--r-md)', border: '1px solid var(--border)', objectFit: 'cover' }}
            />
            <button
              type="button"
              onClick={() => setImageUrl('')}
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--red)',
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
              title="Remove photo"
            >
              ✕
            </button>
          </div>
        )}

        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

        {/* Action Toolbar */}
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
              <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={!text.trim() || !selectedPerson || uploadingImage}
              style={{ boxShadow: '0 1px 2px rgba(36, 81, 184, 0.2)', fontWeight: 600 }}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

