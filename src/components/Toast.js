import React, { useEffect, useState } from 'react';

let toastTimer = null;

export function showToast(message, duration = 2500) {
  const event = new CustomEvent('app-toast', { detail: { message, duration } });
  window.dispatchEvent(event);
}

export default function Toast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      const { message, duration } = e.detail || {};
      if (!message) return;
      setToast(message);
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => setToast(null), duration || 2500);
    };
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, []);

  if (!toast) return null;

  return (
    <div className="toast show" role="status" aria-live="polite">
      {toast}
    </div>
  );
}
