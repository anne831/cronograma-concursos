import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRevisoes, addRevisao, concluirRevisao } from '../firebase/services';
import { differenceInDays, parseISO } from 'date-fns';

export default function Revisao({ concursos }) {
  const { user } = useAuth();
  const [revisoes, setRevisoes] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ topico: '', concurso: '', materia: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return getRevisoes(user.uid, setRevisoes);
  }, [user]);

  const urgentes = revisoes.filter(r => differenceInDays(new Date(), parseISO(r.proximaRevisao)) >= 0);
  const proximas = revisoes.filter(r => differenceInDays(new Date(), parseISO(r.proximaRevisao)) < 0);

  const handleAdd = async () => {
    if (!form.topico || !form.concurso) return;
    setSaving(true);
    await addRevisao(user.uid, form.topico, form.concurso, form.materia);
    setSaving(false);
    setModal(false);
    setForm({ topico: '', concurso: '', materia: '' });
  };

  const handleConcluir = async (r) => {
    await concluirRevisao(r.id, r.intervalo);
  };

  const getStatus = (r) => {
    const dias = differenceInDays(new Date(), parseISO(r.proximaRevisao));
    if (dias > 1) return { label: `${dias} dias atrasada`, badge: 'badge-red' };
    if (dias >= 0) return { label: 'Revisar hoje', badge: 'badge-amber' };
    return { label: `Em ${Math.abs(dias)} dias`, badge: 'badge-green' };
  };

  const INTERVALOS = [1, 3, 7, 14, 30, 60];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Revisão espaçada</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            {urgentes.length} pendentes · {revisoes.length} tópicos no total
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>+ Adicionar tópico</button>
      </div>

      <div className="card" style={{ marginBottom: '1rem', background: 'var(--bg2)' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Como funciona</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {INTERVALOS.map((d, i) => (
            <React.Fragment key={d}>
              <div style={{ background: 'var(--accent-soft)', borderRadius: 6, padding: '4px 10px', fontSize: 12, color: 'var(--accent2)', fontWeight: 500 }}>
                {d === 1 ? '1 dia' : d < 30 ? d + ' dias' : d/30 + ' mês'}
              </div>
              {i < INTERVALOS.length - 1 && <span style={{ color: 'var(--text3)', alignSelf: 'center' }}>→</span>}
            </React.Fragment>
          ))}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, lineHeight: 1.5 }}>
          Cada vez que você marca uma revisão como concluída, o próximo intervalo aumenta automaticamente.
        </p>
      </div>

      {urgentes.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            🔴 Pendentes ({urgentes.length})
          </div>
          {urgentes.map(r => {
            const status = getStatus(r);
            return (
              <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px 16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{r.topico}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {r.concurso} · {r.materia} · Intervalo atual: {r.intervalo} dias
                  </div>
                </div>
                <span className={`badge ${status.badge}`}>{status.label}</span>
                <button className="btn btn-primary btn-sm" onClick={() => handleConcluir(r)}>
                  ✓ Revisei
                </button>
              </div>
            );
          })}
        </div>
      )}

      {proximas.length > 0 && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>
            🟢 Agendadas ({proximas.length})
          </div>
          {proximas.map(r => {
            const status = getStatus(r);
            return (
              <div key={r.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, padding: '12px 16px', opacity: 0.7 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{r.topico}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                    {r.concurso} · {r.materia}
                  </div>
                </div>
                <span className={`badge ${status.badge}`}>{status.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {revisoes.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <div style={{ fontSize: 15, marginBottom: 6 }}>Nenhum tópico cadastrado ainda</div>
          <div style={{ fontSize: 13 }}>Adicione tópicos para começar a revisão espaçada</div>
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ Novo tópico para revisão</div>
            <div className="form-group">
              <label className="form-label">Tópico</label>
              <input className="form-input" placeholder="Ex: Princípios da Administração Pública"
                value={form.topico} onChange={e => setForm(f => ({ ...f, topico: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Concurso</label>
                <select className="form-input" value={form.concurso} onChange={e => setForm(f => ({ ...f, concurso: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Matéria</label>
                <input className="form-input" placeholder="Ex: Dir. Administrativo"
                  value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.topico || !form.concurso}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
