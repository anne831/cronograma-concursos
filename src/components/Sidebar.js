import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'grade', icon: '📅', label: 'Grade semanal' },
  { id: 'progresso', icon: '📊', label: 'Progresso' },
  { id: 'revisao', icon: '🔄', label: 'Revisão' },
  { id: 'topicos', icon: '✅', label: 'Tópicos' },
  { id: 'concursos', icon: '🏛️', label: 'Concursos' },
];

export default function Sidebar({ active, onChange }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* DESKTOP — barra lateral só com ícones */}
      <aside style={{
        width: 64, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '0.5px solid var(--border)', height: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'sticky', top: 0, padding: '12px 0'
      }} className="hide-mobile">

        {/* Logo */}
        <div style={{ fontSize: 22, marginBottom: 16 }}>🎯</div>

        <div style={{ width: '100%', height: '0.5px', background: 'var(--border)', marginBottom: 8 }} />

        {/* Nav ícones */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', padding: '4px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => onChange(item.id)}
              title={item.label}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                background: active === item.id ? 'var(--accent-soft)' : 'transparent',
                fontSize: 20, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'var(--transition)',
                outline: active === item.id ? '0.5px solid rgba(124,111,255,0.3)' : 'none'
              }}>
              {item.icon}
            </button>
          ))}
        </nav>

        <div style={{ width: '100%', height: '0.5px', background: 'var(--border)', marginBottom: 8 }} />

        {/* Avatar + Sair */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div title={user?.displayName || user?.email} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '0.5px solid rgba(124,111,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent2)'
          }}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <button onClick={logout} title="Sair" style={{
            width: 32, height: 32, borderRadius: 8, border: '0.5px solid var(--border2)',
            background: 'transparent', fontSize: 14, cursor: 'pointer', color: 'var(--text2)'
          }}>
            ↩
          </button>
        </div>
      </aside>

      {/* MOBILE — barra no TOPO */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0',
      }} className="show-mobile">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '4px 8px', border: 'none', background: 'transparent',
            color: active === item.id ? 'var(--accent2)' : 'var(--text3)',
            fontSize: 10, fontWeight: active === item.id ? 600 : 400,
            transition: 'var(--transition)', cursor: 'pointer'
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            {item.label.split(' ')[0]}
          </button>
        ))}
      </nav>
    </>
  );
}