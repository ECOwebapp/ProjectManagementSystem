// AddPersonnelForm.jsx — Standalone or inline form to manage personnel
import { useState } from 'react';
import { addPersonnel } from '../../data/projectsRepo.js';

export default function AddPersonnelForm({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = addPersonnel({ name: name.trim(), title: title.trim() });
    onSaved(created);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Register Personnel</h2>
          <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Ar. Maria Santos"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Title / Role</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Architect, Project Engineer"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
              Save Personnel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
