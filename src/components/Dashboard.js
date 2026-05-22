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

  const ultimos7 = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dateStr = format(d, 'yyyy-MM-dd');
    const horas = sessoes.filter(s => s.data === dateStr).reduce((a, s) => a + (s.duracao || 0), 0);
    return { label: format(d, 'EEE', { locale: ptBR }), horas, isHoje: dateStr === hoje };
  });
  const maxHoras = Math.max(...ultimos7.map(d => d.horas), 1);

  const materias = [...new Set(topicos.map(t => t.materia))].map(mat => {
    const total = topicos.filter(t => t.materia === mat).length;
    const feitos = topicos.filter(t => t.materia === mat && t.concluido).length;
    return { mat, total, feitos, pct: total > 0 ? Math.round(feitos / total * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct).slice(0, 5);

  const sessoesHoje = sessoes.filter(s => s.data === hoje);
  const CORES = ['#7c6fff', '#34d399', '#60a5fa', '#fbbf24', '#f87171'];

  return (
    <div style={{ width: '100%', maxWidth: 700 }}>

      {/* Saudação */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          {saudacao()}, {user?.displayName?.split(' ')[0] || 'Anne'} 👋
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Próxima prova */}
      {proximaProva && (
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderLeft: `4px solid ${proximaProva.cor || 'var(--accent)'}`,
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Próxima prova</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{proximaProva.nome}</div>
            {proximaProva.cargo && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{proximaProva.cargo}</div>}
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)',
              color: proximaProva.dias < 30 ? 'var(--red)' : proximaProva.dias < 90 ? 'var(--amber)' : 'var(--green)'
            }}>
              {proximaProva.dias}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>dias restantes</div>
          </div>
        </div>
      )}

      {/* Cards métricas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Hoje', val: horasHoje.toFixed(1) + 'h', icon: '⏱️', color: 'var(--accent2)', action: 'grade' },
          { label: 'Semana', val: horasSemana.toFixed(1) + 'h', icon: '📈', color: 'var(--green)', action: 'progresso' },
          { label: 'Revisões', val: revisoesPendentes.length, icon: '🔄', color: revisoesPendentes.length > 0 ? 'var(--amber)' : 'var(--green)', action: 'revisao' },
          { label: 'Tópicos', val: pctTopicos + '%', icon: '✅', color: 'var(--blue)', action: 'topicos' },
        ].map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.action)} style={{
            background: 'var(--surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 12,
            padding: '14px 12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'var(--transition)'
          }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: c.color }}>{c.val}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{c.label}</div>
          </div>
        ))}
      </div>

      {/* Gráfico últimos 7 dias */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>
          Horas estudadas — últimos 7 dias
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 90 }}>
          {ultimos7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', minHeight: 14 }}>
                {d.horas > 0 ? d.horas.toFixed(1) : ''}
              </div>
              <div style={{
                width: '100%',
                borderRadius: 4,
                height: Math.max(d.horas / maxHoras * 60, d.horas > 0 ? 6 : 3),
                background: d.isHoje ? 'var(--accent)' : d.horas > 0 ? 'rgba(124,111,255,0.35)' : 'var(--bg3)',
                transition: 'height 0.4s ease'
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
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
            Progresso por matéria
          </div>
          {materias.map((m, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{ fontSize: 13, color: 'var(--text2)' }}>{m.mat}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: CORES[i % CORES.length] }}>{m.feitos}/{m.total} — {m.pct}%</span>
              </div>
              <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: m.pct + '%',
                  height: '100%',
                  background: CORES[i % CORES.length],
                  borderRadius: 3,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Linha inferior: Hoje + Acesso rápido */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Estudos de hoje */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Estudos de hoje
          </div>
          {sessoesHoje.length === 0 ? (
            <div onClick={() => onNavigate('grade')} style={{ cursor: 'pointer' }}>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma sessão ainda</div>
              <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 6 }}>+ Adicionar sessão →</div>
            </div>
          ) : (
            sessoesHoje.map(s => (
              <div key={s.id} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 13, color: 'var(--text2)',
                padding: '5px 0',
                borderBottom: '0.5px solid var(--border)'
              }}>
                <span>{s.materia}</span>
                <span style={{ color: 'var(--accent2)', fontWeight: 500 }}>{s.duracao}h</span>
              </div>
            ))
          )}
        </div>

        {/* Acesso rápido */}
        <div style={{
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 12,
          padding: '16px 18px'
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Acesso rápido
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { icon: '📅', label: 'Grade', action: 'grade' },
              { icon: '📊', label: 'Progresso', action: 'progresso' },
              { icon: '🔄', label: 'Revisão', action: 'revisao' },
              { icon: '🏛️', label: 'Concursos', action: 'concursos' },
            ].map((item, i) => (
              <button key={i} onClick={() => onNavigate(item.action)} style={{
                background: 'var(--bg3)',
                border: '0.5px solid var(--border)',
                borderRadius: 8,
                padding: '10px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                width: '100%'
              }}>
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}