import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessoes, getRevisoes, getTopicos } from '../firebase/services';
import { format, differenceInDays, parseISO, startOfWeek, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard({ concursos, onNavigate }) {
  const { user } = useAuth();
  const [sessoes, setSessoes] = useState([]);
  const [revisoes, setRevisoes] = useState([]);
  const [topicos, setTopicos] = useState([]);

  useEffect(() => {
    if (!user) return;
    const u1 = getSessoes(user.uid, setSessoes);
    const u2 = getRevisoes(user.uid, setRevisoes);
    const u3 = getTopicos(user.uid, setTopicos);
    return () => { u1(); u2(); u3(); };
  }, [user]);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const semanaStart = format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
  const horasHoje = sessoes.filter(s => s.data === hoje).reduce((a, s) => a + (s.duracao || 0), 0);
  const horasSemana = sessoes.filter(s => s.data >= semanaStart).reduce((a, s) => a + (s.duracao || 0), 0);
  const revisoesPendentes = revisoes.filter(r => {
    try { return differenceInDays(new Date(), parseISO(r.proximaRevisao)) >= 0; }
    catch { return false; }
  });
  const topicosFeitos = topicos.filter(t => t.concluido).length;
  const pctTopicos = topicos.length > 0 ? Math.round(topicosFeitos / topicos.length * 100) : 0;

  const proximaProva = concursos
    .filter(c => c.dataProva)
    .map(c => ({ ...c, dias: Math.ceil((new Date(c.dataProva + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24)) }))
    .filter(c => c.dias > 0)
    .sort((a, b) => a.dias - b.dias)[0];

  const saudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Últimos 7 dias para o gráfico
  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const horas = sessoes.filter(s => s.data === dateStr).reduce((a, s) => a + (s.duracao || 0), 0);
    return { label: format(d, 'EEE', { locale: ptBR }), horas, isHoje: dateStr === hoje };
  });
  const maxHoras = Math.max(...ultimos7.map(d => d.horas), 1);

  // Progresso por matéria
  const materias = [...new Set(topicos.map(t => t.materia))].map(mat => {
    const total = topicos.filter(t => t.materia === mat).length;
    const feitos = topicos.filter(t => t.materia === mat && t.concluido).length;
    return { mat, total, feitos, pct: total > 0 ? Math.round(feitos / total * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);

  const sessoesHoje = sessoes.filter(s => s.data === hoje);

  const CORES_MATERIAS = [
    '#7c6fff', '#34d399', '#60a5fa', '#fbbf24', '#f87171', '#f472b6', '#a78bfa'
  ];

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            {saudacao()}, {user?.displayName?.split(' ')[0] || 'Anne'} 👋
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </div>
        </div>
        {proximaProva && (
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 10, padding: '8px 14px', textAlign: 'center'
          }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próxima prova</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: proximaProva.dias < 30 ? 'var(--red)' : proximaProva.dias < 90 ? 'var(--amber)' : 'var(--green)', fontFamily: 'var(--font-display)' }}>
              {proximaProva.dias}d
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>{proximaProva.nome}</div>
          </div>
        )}
      </div>

      {/* Cards métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.25rem' }}>
        {[
          { label: 'Hoje', val: horasHoje.toFixed(1) + 'h', icon: '⏱️', color: 'var(--accent2)', action: 'grade' },
          { label: 'Semana', val: horasSemana.toFixed(1) + 'h', icon: '📈', color: 'var(--green)', action: 'progresso' },
          { label: 'Revisões', val: revisoesPendentes.length, icon: '🔄', color: revisoesPendentes.length > 0 ? 'var(--amber)' : 'var(--green)', action: 'revisao' },
          { label: 'Tópicos', val: pctTopicos + '%', icon: '✅', color: 'var(--blue)', action: 'topicos' },
        ].map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.action)} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: '12px', cursor: 'pointer',
            transition: 'var(--transition)', textAlign: 'center'
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: c.color }}>
              {c.val}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico de horas — últimos 7 dias */}
      <div style={{
        background: 'var(--surface)', border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '1rem', marginBottom: '1.25rem'
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Horas estudadas — últimos 7 dias
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 100 }}>
          {ultimos7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>{d.horas > 0 ? d.horas.toFixed(1) : ''}</div>
              <div style={{
                width: '100%', borderRadius: 4,
                height: Math.max(d.horas / maxHoras * 70, d.horas > 0 ? 6 : 3),
                background: d.isHoje ? 'var(--accent)' : d.horas > 0 ? 'var(--accent-soft)' : 'var(--bg3)',
                border: d.isHoje ? 'none' : d.horas > 0 ? '0.5px solid rgba(124,111,255,0.3)' : 'none',
                transition: 'height 0.5s'
              }} />
              <div style={{ fontSize: 10, color: d.isHoje ? 'var(--accent2)' : 'var(--text3)', fontWeight: d.isHoje ? 600 : 400 }}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progresso por matéria */}
      {materias.length > 0 && (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem', marginBottom: '1.25rem'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Progresso por matéria
          </div>
          {materias.map((m, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                <span style={{ color: 'var(--text2)' }}>{m.mat}</span>
                <span style={{ fontWeight: 600, color: CORES_MATERIAS[i % CORES_MATERIAS.length] }}>{m.pct}%</span>
              </div>
              <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: m.pct + '%', height: '100%',
                  background: CORES_MATERIAS[i % CORES_MATERIAS.length],
                  borderRadius: 3, transition: 'width 0.5s'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estudos de hoje + Acesso rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Estudos de hoje */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoje
          </div>
          {sessoesHoje.length === 0 ? (
            <div onClick={() => onNavigate('grade')} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma sessão</div>
              <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 4 }}>+ Adicionar →</div>
            </div>
          ) : sessoesHoje.map(s => (
            <div key={s.id} style={{
              fontSize: 12, color: 'var(--text2)', padding: '4px 0',
              borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between'
            }}>
              <span>{s.materia}</span>
              <span style={{ color: 'var(--accent2)' }}>{s.duracao}h</span>
            </div>
          ))}
        </div>

        {/* Acesso rápido */}
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Acesso rápido
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              { icon: '📅', label: 'Grade', action: 'grade' },
              { icon: '📊', label: 'Progresso', action: 'progresso' },
              { icon: '🔄', label: 'Revisão', action: 'revisao' },
              { icon: '🏛️', label: 'Concursos', action: 'concursos' },
            ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.action)} style={{
                background: 'var(--bg3)', border: '0.5px solid var(--border)',
                borderRadius: 8, padding: '8px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 11, color: 'var(--text2)' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}