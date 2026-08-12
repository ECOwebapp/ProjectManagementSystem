// Badge.jsx — Status badge with SB Admin 2 styling & FontAwesome icons
import React from 'react';

export default function Badge({ children, variant = 'gray' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// Helpers to derive badge variant from data
export function categoryVariant(cat) {
  return cat === 'On-going' ? 'primary' : 'warning';
}

export function progressVariant(slippage) {
  if (slippage === null || slippage === undefined) return 'secondary';
  if (slippage >= 0) return 'success';
  if (slippage >= -10) return 'warning';
  return 'danger';
}

export function progressLabel(slippage) {
  if (slippage === null || slippage === undefined) return 'No Data';
  if (slippage >= 0) return 'On Track';
  if (slippage >= -10) return 'Slightly Behind';
  return 'Behind Schedule';
}

export function voStatusVariant(status = '') {
  const s = status.toLowerCase();
  if (s.includes('approved')) return 'success';
  if (s.includes('bor') || s.includes('pending') || s.includes('subject')) return 'warning';
  if (s.includes('reject') || s.includes('cancel')) return 'danger';
  return 'secondary';
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'N/A';
  return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
