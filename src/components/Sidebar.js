import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
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
      {/* DESKTOP — menu lateral esquerdo */}
      <aside style={{
        width: 220, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '0.5px solid var(--border)', height: '100vh',
        display: 'flex', flexDirection: 'column', position: 'sticky', top: 0
      }} className="hide-mobile">
        <div style={{ padding: '1.25rem 1rem', borderBottom: '0.5px solid var(--border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
            🎯📚 Cronograma
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Concursos Públicos</div>
        </div>

        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => onChange(item.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8, border: 'none', marginBottom: 2,
              background: active === item.id ? 'var(--accent-soft)' : 'transparent',
              color: active === item.id ? 'var(--accent2)' : 'var(--text2)',
              fontSize: 13, fontWeight: active === item.id ? 500 : 400,
              transition: 'var(--transition)', cursor: 'pointer', textAlign: 'left'
            }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '0.5px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'var(--accent-soft)', border: '0.5px solid rgba(124,111,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'var(--accent2)', flexShrink: 0
            }}>
              {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || 'Usuário'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
          <button onClick={logout} style={{
            width: '100%', padding: '7px', borderRadius: 6, border: '0.5px solid var(--border2)',
            background: 'transparent', color: 'var(--text2)', fontSize: 12, cursor: 'pointer'
          }}>
            Sair
          </button>
        </div>
      </aside>

      {/* MOBILE — barra inferior */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg2)', borderTop: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      }} className="show-mobile">
        {navItems.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            padding: '4px 12px', border: 'none', background: 'transparent',
            color: active === item.id ? 'var(--accent2)' : 'var(--text3)',
            fontSize: 10, fontWeight: active === item.id ? 600 : 400,
            transition: 'var(--transition)', cursor: 'pointer'
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            {item.label.split(' ')[0]}