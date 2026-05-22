import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessoes, getRevisoes, getTopicos } from '../firebase/services';
import { format, differenceInDays, parseISO, startOfWeek } from 'date-fns';
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

  const sessoesHoje = sessoes.filter(s => s.data === hoje);

  return (
    <div style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {saudacao()}, {user?.displayName?.split(' ')[0] || 'Anne'} 👋
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: '1.25rem' }}>
        {[
          { label: 'Horas hoje', val: horasHoje.toFixed(1) + 'h', icon: '⏱️', color: 'var(--accent2)', action: 'grade' },
          { label: 'Horas na semana', val: horasSemana.toFixed(1) + 'h', icon: '📈', color: 'var(--green)', action: 'progresso' },
          { label: 'Revisões pendentes', val: revisoesPendentes.length, icon: '🔄', color: revisoesPendentes.length > 0 ? 'var(--amber)' : 'var(--green)', action: 'revisao' },
          { label: 'Tópicos concluídos', val: pctTopicos + '%', icon: '✅', color: 'var(--blue)', action: 'topicos' },
        ].map((c, i) => (
          <div key={i} onClick={() => onNavigate(c.action)} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: '1rem', cursor: 'pointer',
            transition: 'var(--transition)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{c.icon}</span>
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{c.label}</span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: c.color }}>
              {c.val}
            </div>
          </div>
        ))}
      </div>

      {proximaProva ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px solid var(--border)',
          borderRadius: 12, padding: '1rem', marginBottom: '1.25rem',
          borderLeft: `3px solid ${proximaProva.cor || 'var(--accent)'}`
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Próxima prova</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{proximaProva.nome}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{proximaProva.cargo}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: proximaProva.dias < 30 ? 'var(--red)' : proximaProva.dias < 90 ? 'var(--amber)' : 'var(--green)' }}>
                {proximaProva.dias}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>dias restantes</div>
            </div>
          </div>
        </div>
      ) : (
        <div onClick={() => onNavigate('concursos')} style={{
          background: 'var(--surface)', border: '0.5px dashed var(--border2)',
          borderRadius: 12, padding: '1rem', marginBottom: '1.25rem',
          textAlign: 'center', cursor: 'pointer'
        }}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhum concurso cadastrado</div>
          <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 4 }}>+ Cadastrar concurso →</div>
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Estudos de hoje
        </div>
        {sessoesHoje.length === 0 ? (
          <div onClick={() => onNavigate('grade')} style={{
            background: 'var(--surface)', border: '0.5px dashed var(--border2)',
            borderRadius: 10, padding: '1rem', textAlign: 'center', cursor: 'pointer'
          }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma sessão hoje</div>
            <div style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 4 }}>+ Adicionar sessão →</div>
          </div>
        ) : sessoesHoje.map(s => (
          <div key={s.id} style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: 13, color: 'var(--text)' }}>{s.materia} · {s.concurso}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.duracao}h</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Acesso rápido
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { icon: '📅', label: 'Grade', action: 'grade' },
            { icon: '📊', label: 'Progresso', action: 'progresso' },
            { icon: '🏛️', label: 'Concursos', action: 'concursos' },
          ].map((item, i) => (
            <button key={i} onClick={() => onNavigate(item.action)} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 10, padding: '12px 8px', cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6
            }}>
              <span style={{ fontSize: 22 }}>{item.icon}</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}