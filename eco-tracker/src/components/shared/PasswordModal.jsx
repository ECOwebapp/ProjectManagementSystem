// PasswordModal.jsx — Password protection modal for administrative actions
import { useState } from 'react';

const ADMIN_PASSWORD = 'INFRATRACK2026';
const AUTH_STORAGE_KEY = 'eco_admin_unlocked';

export function isAuthorized() {
  return sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
}

export function setAuthorized() {
  sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
}

export default function PasswordModal({ isOpen, onClose, onSuccess, title = 'Authorization Required', description = 'Enter password to make changes.' }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthorized();
      setPassword('');
      setError('');
      onSuccess();
      onClose();
    } else {
      setError('Incorrect password. Access denied.');
    }
  };

  const handleClose = () => {
    setPassword('');
    setError('');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <i className="fas fa-lock text-primary"></i>
          </div>
          <div>
            <h4 style={styles.title}>{title}</h4>
            <p style={styles.desc}>{description}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ marginTop: 'var(--sp-3)' }}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={{ marginBottom: 'var(--sp-4)' }}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              autoFocus
              className="form-input"
              placeholder="Enter password..."
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              style={{ width: '100%', fontSize: 'var(--text-sm)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--sp-2)' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={!password}>
              Unlock Access
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(2px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--sp-4)',
  },
  modal: {
    background: 'var(--c-surface)',
    borderRadius: 'var(--r-md)',
    boxShadow: 'var(--shadow-md)',
    width: '100%',
    maxWidth: '400px',
    padding: 'var(--sp-5)',
    border: '1px solid var(--c-border)',
  },
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--sp-3)',
  },
  iconWrap: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'var(--c-primary-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  title: {
    fontSize: 'var(--text-md)',
    fontWeight: 700,
    color: 'var(--c-text)',
    margin: 0,
  },
  desc: {
    fontSize: 'var(--text-xs)',
    color: 'var(--c-text-3)',
    marginTop: '2px',
  },
  label: {
    display: 'block',
    fontSize: 'var(--text-xs)',
    fontWeight: 600,
    color: 'var(--c-text-2)',
    marginBottom: 'var(--sp-1)',
  },
  errorBox: {
    background: 'var(--c-red-bg)',
    color: 'var(--c-red)',
    padding: 'var(--sp-2) var(--sp-3)',
    borderRadius: 'var(--r-sm)',
    fontSize: 'var(--text-xs)',
    fontWeight: 500,
    marginBottom: 'var(--sp-3)',
  },
};
