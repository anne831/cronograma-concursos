import React from 'react';

export default function Loading({ size = 24, color = 'var(--accent)' }) {
  return (
    <div style={{
      width: size,
      height: size,
      border: `2px solid var(--border2)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
  );
}
