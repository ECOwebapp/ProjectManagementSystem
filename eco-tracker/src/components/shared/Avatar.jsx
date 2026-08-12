// Avatar.jsx — Initials avatar with deterministic color
const COLORS = [
  '#1d6fa4','#1a9955','#c47b0a','#7c3ab8',
  '#c0392b','#2980b9','#16a085','#8e44ad',
];

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function colorForName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ name, size = 'md' }) {
  const initials = getInitials(name);
  const bg = colorForName(name);
  const cls = `avatar${size === 'sm' ? ' avatar-sm' : ''}`;
  return (
    <div className={cls} style={{ background: bg }} title={name}>
      {initials}
    </div>
  );
}
