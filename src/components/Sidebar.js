import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { id: 'grade', icon: '📅', label: 'Grade semanal' },
  { id: 'progresso', icon: '📊', label: 'Progresso' },
  { id: 'revisao', icon: '🔄', label: 'Revisão espaçada' },
  { id: 'topicos', icon: '✅', label: 'Tópicos' },
  { id: 'concursos', icon: '🏛️', label: 'Concursos' },
];

export default function Sidebar({ active, onChange }) {
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width: 220, flexShrink: 0, background: 'var(--bg2)',
      borderRight: '1px solid var(--border)', height: '100vh',
      display: 'flex', flexDirection: 'column', position: 'sticky', top: 0
    }}>
      <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
          📚 Cronograma
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Concursos Públicos</div>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {navItems.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10, border: 'none', marginBottom: 2,
            background: active === item.id ? 'var(--accent-soft)' : 'transparent',
            color: active === item.id ? 'var(--accent2)' : 'var(--text2)',
            fontSize: 14, fontWeight: active === item.id ? 500 : 400,
            transition: 'var(--transition)', cursor: 'pointer', textAlign: 'left'
          }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--accent2)', flexShrink: 0
          }}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName || 'Usuário'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
        </div>
        <button onClick={logout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          Sair
        </button>
      </div>
    </aside>
  );
}
