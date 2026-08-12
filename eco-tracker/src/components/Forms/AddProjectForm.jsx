// AddProjectForm.jsx — Modal form to create local project with redesigned layout
import { useState } from 'react';
import { addProject } from '../../data/projectsRepo.js';

export default function AddProjectForm({ onClose, onSaved }) {
  const [formData, setFormData] = useState({
    project_name: '',
    project_id_code: '',
    category: 'Proposed', // Default set to Proposed per user specification
    contractor_name: '',
    original_contract_amount: '',
    original_completion_date: '',
    general_remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.project_name.trim()) return;

    setSubmitting(true);
    try {
      await addProject({
        project_name: formData.project_name.trim(),
        project_id_code: formData.project_id_code.trim() || null,
        category: formData.category,
        contractor_names: formData.contractor_name.trim() ? [formData.contractor_name.trim()] : [],
        original_contract_amount: formData.original_contract_amount ? parseFloat(formData.original_contract_amount) : null,
        original_completion_date: formData.original_completion_date || null,
        general_remarks: formData.general_remarks.trim() || null,
      });
      onSaved();
    } catch (err) {
      alert(`Failed to add project: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-project-modal" onClick={e => e.stopPropagation()}>
        {/* Sticky Header */}
        <div className="modal-header-sticky">
          <div>
            <h2 className="modal-header-title">Add New Project</h2>
            <div className="modal-header-subtitle">Fill in the project details below</div>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Scrollable Body Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className="modal-body-scroll">
            {/* Section 1: Basic Info */}
            <div className="form-section">
              <div className="form-section-header">
                <span>BASIC INFO</span>
                <div className="form-section-line" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Project Name *</label>
                <input
                  type="text"
                  name="project_name"
                  className="form-input-custom"
                  required
                  placeholder="e.g. Construction of Solar Farm Phase I"
                  value={formData.project_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="form-label-custom">Project ID Code</label>
                  <input
                    type="text"
                    name="project_id_code"
                    className="form-input-custom"
                    placeholder="e.g. 25CSU06"
                    value={formData.project_id_code}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="form-label-custom">Category</label>
                  <select
                    name="category"
                    className="form-select-custom"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="On-going">On-going</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Contract Details */}
            <div className="form-section" style={{ marginTop: 24 }}>
              <div className="form-section-header">
                <span>CONTRACT DETAILS</span>
                <div className="form-section-line" />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label-custom">Awarded Contractor</label>
                <input
                  type="text"
                  name="contractor_name"
                  className="form-input-custom"
                  placeholder="e.g. Acme Builders Inc."
                  value={formData.contractor_name}
                  onChange={handleChange}
                />
              </div>

              <div className="form-grid-2">
                <div>
                  <label className="form-label-custom">Contract Amount (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="original_contract_amount"
                    className="form-input-custom"
                    placeholder="e.g. 15000000"
                    value={formData.original_contract_amount}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="form-label-custom">Original Completion Date</label>
                  <input
                    type="date"
                    name="original_completion_date"
                    className="form-input-custom"
                    value={formData.original_completion_date}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Notes */}
            <div className="form-section" style={{ marginTop: 24 }}>
              <div className="form-section-header">
                <span>NOTES</span>
                <div className="form-section-line" />
              </div>

              <div>
                <label className="form-label-custom">Remarks / Notes</label>
                <textarea
                  name="general_remarks"
                  className="form-textarea-custom"
                  placeholder="Any initial remarks or scope notes..."
                  value={formData.general_remarks}
                  onChange={handleChange}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="modal-footer-sticky">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting || !formData.project_name.trim()}>
              {submitting ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
