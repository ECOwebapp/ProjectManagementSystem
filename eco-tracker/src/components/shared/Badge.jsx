// Badge.jsx — Status badge & helper utilities
export default function Badge({ children, variant = 'gray' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

// Helpers to derive badge variant from data
export function categoryVariant(cat) {
  if (cat === 'On-going') return 'green';
  if (cat === 'Proposed') return 'amber';
  if (cat === 'Completed') return 'gray';
  return 'blue';
}

export function progressVariant(slippage) {
  if (slippage === null || slippage === undefined) return 'gray';
  if (slippage >= 0) return 'green';
  if (slippage >= -10) return 'amber';
  return 'red';
}

export function progressLabel(slippage) {
  if (slippage === null || slippage === undefined) return 'No Data';
  if (slippage >= 0) return 'On Track';
  if (slippage >= -10) return 'Slightly Behind';
  return 'Behind Schedule';
}

export function voStatusVariant(status = '') {
  const s = status.toLowerCase();
  if (s.includes('approved') && !s.includes('subject') && !s.includes('bor')) return 'green';
  if (s.includes('bor') || s.includes('pending') || s.includes('subject')) return 'amber';
  if (s.includes('reject') || s.includes('cancel')) return 'red';
  return 'gray';
}

export function formatCurrency(amount) {
  if (amount === null || amount === undefined) return 'N/A';
  return '₱' + Number(amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
