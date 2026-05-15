import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessoes } from '../firebase/services';
import { format, startOfWeek, subDays } from 'date-fns';

const MATERIAS = [
  { value: 'dir_const', label: 'Dir. Constitucional', color: '#60a5fa' },
  { value: 'dir_adm', label: 'Dir. Administrativo', color: '#22d3a0' },
  { value: 'dir_civil', label: 'Dir. Civil', color: '#a78bfa' },
  { value: 'dir_penal', label: 'Dir. Penal', color: '#f87171' },
  { value: 'port_log', label: 'Português / Lógica', color: '#fbbf24' },
  { value: 'proc_civil', label: 'Proc. Civil', color: '#f472b6' },
  { value: 'revisao', label: 'Revisão', color: '#94a3b8' },
];

export default function Progresso() {
  const { user } = useAuth();
  const [sessoes, setSessoes] = useState([]);

  useEffect(() => {
    if (!user) return;
    return getSessoes(user.uid, setSessoes);
  }, [user]);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const semanaStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const mesStart = format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd');

  const horasSemana = sessoes.filter(s => s.data >= semanaStart).reduce((a, s) => a + (s.duracao || 0), 0);
  const horasMes = sessoes.filter(s => s.data >= mesStart).reduce((a, s) => a + (s.duracao || 0), 0);
  const horasTotal = sessoes.reduce((a, s) => a + (s.duracao || 0), 0);

  const porMateria = MATERIAS.map(m => {
    const horas = sessoes.filter(s => s.materia === m.value).reduce((a, s) => a + (s.duracao || 0), 0);
    return { ...m, horas };
  }).filter(m => m.horas > 0).sort((a, b) => b.horas - a.horas);

  const maxHoras = Math.max(...porMateria.map(m => m.horas), 1);

  const ultimas7 = Array.from({ length: 7 }, (_, i) => {
    const d = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
    const horas = sessoes.filter(s => s.data === d).reduce((a, s) => a + (s.duracao || 0), 0);
    return { data: d, horas, label: format(subDays(new Date(), 6 - i), 'EEE').slice(0, 3) };
  });
  const maxDia = Math.max(...ultimas7.map(d => d.horas), 1);

  return (
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: '1.25rem' }}>
        Progresso
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: '1.5rem' }}>
        {[
          { label: 'Esta semana', val: horasSemana.toFixed(1) + 'h', sub: 'Meta: 25h', pct: Math.min(horasSemana / 25 * 100, 100) },
          { label: 'Este mês', val: horasMes.toFixed(1) + 'h', sub: 'Meta: 100h', pct: Math.min(horasMes / 100 * 100, 100) },
          { label: 'Total acumulado', val: horasTotal.toFixed(1) + 'h', sub: sessoes.length + ' sessões', pct: null },
        ].map((c, i) => (
          <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '1rem 1.25rem' }}>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{c.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.sub}</div>
            {c.pct !== null && (
              <div style={{ marginTop: 10, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: c.pct + '%', height: '100%', background: 'var(--accent)', borderRadius: 2, transition: 'width 0.5s ease' }} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>Horas por matéria</div>
          {porMateria.length === 0 ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Nenhuma sessão registrada ainda.</div>
          ) : porMateria.map(m => (
            <div key={m.value} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span style={{ color: 'var(--text2)' }}>{m.label}</span>
                <span style={{ fontWeight: 500, color: m.color }}>{m.horas.toFixed(1)}h</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: (m.horas / maxHoras * 100) + '%', height: '100%', background: m.color, borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: '1rem', color: 'var(--text)' }}>Últimos 7 dias</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
            {ultimas7.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{d.horas > 0 ? d.horas.toFixed(1) : ''}</div>
                <div style={{
                  width: '100%', borderRadius: 4,
                  height: Math.max(d.horas / maxDia * 80, d.horas > 0 ? 6 : 2),
                  background: d.data === hoje ? 'var(--accent)' : d.horas > 0 ? 'var(--accent-soft)' : 'var(--bg3)',
                  border: d.data === hoje ? 'none' : d.horas > 0 ? '1px solid rgba(108,99,255,0.3)' : 'none',
                  transition: 'height 0.5s'
                }} />
                <div style={{ fontSize: 10, color: d.data === hoje ? 'var(--accent2)' : 'var(--text3)' }}>{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
