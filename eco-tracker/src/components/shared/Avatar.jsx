// Avatar.jsx — Initials avatar with deterministic gradient background
const GRADIENTS = [
  'linear-gradient(135deg, #3B6BD9, #2451B8)',
  'linear-gradient(135deg, #10B981, #0E9F6E)',
  'linear-gradient(135deg, #F59E0B, #D97706)',
  'linear-gradient(135deg, #8B5CF6, #6D28D9)',
  'linear-gradient(135deg, #EF4444, #DC2626)',
  'linear-gradient(135deg, #06B6D4, #0891B2)',
];

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function gradientForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function Avatar({ name, size = 'md' }) {
  const initials = getInitials(name);
  const bg = gradientForName(name);
  const cls = `avatar${size === 'sm' ? ' avatar-sm' : ''}`;
  return (
    <div className={cls} style={{ background: bg }} title={name}>
      {initials}
    </div>
  );
}
