import React from 'react';

const avatarColors = [
  ['linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', '#fff'],
  ['linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)', '#fff'],
  ['linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)', '#fff'],
  ['linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)', '#fff'],
  ['linear-gradient(135deg, #ec4899 0%, #f472b6 100%)', '#fff'],
  ['linear-gradient(135deg, #10b981 0%, #34d399 100%)', '#fff'],
  ['linear-gradient(135deg, #ef4444 0%, #f87171 100%)', '#fff'],
  ['linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)', '#fff'],
  ['linear-gradient(135deg, #f97316 0%, #fb923c 100%)', '#fff'],
  ['linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)', '#fff'],
];

function extractInitials(fullName = '') {
  const nameParts = fullName
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);

  if (nameParts.length === 0) return '?';
  if (nameParts.length === 1) return nameParts[0][0].toUpperCase();

  const firstInitial = nameParts[0][0];
  const lastInitial = nameParts[nameParts.length - 1][0];
  return (firstInitial + lastInitial).toUpperCase();
}

function selectColorForName(name = '') {
  let hashValue = 0;

  for (let i = 0; i < name.length; i++) {
    hashValue = name.charCodeAt(i) + ((hashValue << 5) - hashValue);
  }

  const colorIndex = Math.abs(hashValue) % avatarColors.length;
  return colorIndex;
}

const InitialsAvatar = ({
  name = '',
  size = 40,
  fontSize,
  style = {},
  className = '',
}) => {
  const initials = extractInitials(name);
  const colorIndex = selectColorForName(name);
  const [backgroundColor, textColor] = avatarColors[colorIndex];

  const calculatedFontSize = fontSize || Math.round(size * 0.4);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    background: backgroundColor,
    color: textColor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: calculatedFontSize,
    fontFamily: "'Outfit', sans-serif",
    flexShrink: 0,
    userSelect: 'none',
    letterSpacing: '0.5px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    ...style,
  };

  return (
    <div className={className} style={avatarStyle} title={name}>
      {initials}
    </div>
  );
};

export default InitialsAvatar;
