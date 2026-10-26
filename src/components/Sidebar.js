import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LayoutDashboard, CalendarDays, RefreshCw, PencilLine, StickyNote, ClipboardList, Building2, LogOut } from 'lucide-react';

const navItems = [
  { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
  { id: 'grade', icon: <CalendarDays size={20} />, label: 'Grade semanal' },
  { id: 'revisao', icon: <RefreshCw size={20} />, label: 'Revisão' },
  { id: 'topicos', icon: <PencilLine size={20} />, label: 'Tópicos' },
  { id: 'anotacoes', icon: <StickyNote size={20} />, label: 'Anotações' },
  { id: 'simulado', icon: <ClipboardList size={20} />, label: 'Simulado' },
  { id: 'concursos', icon: <Building2 size={20} />, label: 'Concursos' },
];

export default function Sidebar({ active, onChange, onBack }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* DESKTOP — barra lateral só com ícones */}
      <aside style={{
        width: 64, flexShrink: 0, background: 'var(--bg2)',
        borderRight: '0.5px solid var(--border)', height: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        position: 'sticky', top: 0, padding: '12px 0'
      }} className="hide-mobile" aria-label="Menu principal">

        {/* Logo */}
        <div style={{ fontSize: 22, marginBottom: 16 }} aria-hidden="true">🎯</div>

        {/* Botão voltar quando não é dashboard */}
        {onBack && (
          <button onClick={onBack} title="Voltar" aria-label="Voltar para o dashboard" style={{
            width: 44, height: 44, borderRadius: 10, border: 'none',
            background: 'var(--accent-soft)', color: 'var(--accent2)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 8, transition: 'all 0.18s ease'
          }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s' }}>←</span>
          </button>
        )}

        <div style={{ width: '100%', height: '0.5px', background: 'var(--border)', marginBottom: 8 }} aria-hidden="true" />

        {/* Nav ícones */}
        <nav role="navigation" aria-label="Menu principal" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: '100%', padding: '4px' }}>
          {navItems.map(item => (
            <button key={item.id} onClick={() => onChange(item.id)}
              title={item.label}
              className="nav-btn"
              aria-label={item.label}
              aria-current={active === item.id ? 'page' : undefined}
              style={{
                width: 44, height: 44, borderRadius: 10, border: 'none',
                background: active === item.id ? 'var(--accent-soft)' : 'transparent',
                color: active === item.id ? 'var(--accent2)' : 'var(--text2)',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease',
                outline: active === item.id ? '0.5px solid rgba(124,111,255,0.3)' : 'none'
              }}>
              <span style={{ display: 'inline-block', transition: 'transform 0.2s' }}>{item.icon}</span>
            </button>
          ))}
        </nav>

        <div style={{ width: '100%', height: '0.5px', background: 'var(--border)', marginBottom: 8 }} aria-hidden="true" />

        {/* Avatar + Sair */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div title={user?.displayName || user?.email} style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-soft)', border: '0.5px solid rgba(124,111,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: 'var(--accent2)'
          }} aria-label={user?.displayName || user?.email}>
            {user?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <button onClick={logout} title="Sair" aria-label="Sair da conta" style={{
            width: 32, height: 32, borderRadius: 8, border: '0.5px solid var(--border2)',
            background: 'transparent', cursor: 'pointer', color: 'var(--text2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MOBILE — barra no TOPO estilo Pill */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 10px',
      }} className="show-mobile" aria-label="Menu de navegação">
        {onBack && (
          <button onClick={onBack} title="Voltar" aria-label="Voltar para o dashboard" style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: '#7c6fff', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.18s ease',
            boxShadow: '0 2px 8px rgba(124,111,255,0.4)'
          }}>
            <span style={{ display: 'inline-block', transition: 'transform 0.2s' }}>←</span>
          </button>
        )}
        {!onBack && <div style={{ width: 36, flexShrink: 0 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflowX: 'auto', flex: 1, justifyContent: 'center' }}>
          {navItems.map(item => (
          <button key={item.id} onClick={() => onChange(item.id)} aria-label={item.label} aria-current={active === item.id ? 'page' : undefined} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: active === item.id ? '5px 12px' : '5px 8px',
            border: 'none',
            background: active === item.id ? 'var(--accent-soft)' : 'transparent',
            borderRadius: 20,
            color: active === item.id ? 'var(--accent2)' : 'var(--text3)',
            fontSize: 10, fontWeight: active === item.id ? 600 : 400,
            transition: 'all 0.2s ease', cursor: 'pointer',
            outline: active === item.id ? '0.5px solid rgba(124,111,255,0.3)' : 'none'
          }}>
            <span style={{ display: 'inline-block' }}>{item.icon}</span>
            {item.label.split(' ')[0]}
          </button>
        ))}
        </div>
      </nav>
    </>
  );
}