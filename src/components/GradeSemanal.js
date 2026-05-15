import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessoes, addSessao, deleteSessao } from '../firebase/services';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const HORAS = ['06:00','07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','19:00','20:00','21:00'];
const MATERIAS = [
  { value: 'dir_const', label: 'Dir. Constitucional', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  { value: 'dir_adm', label: 'Dir. Administrativo', color: '#22d3a0', bg: 'rgba(34,211,160,0.15)' },
  { value: 'dir_civil', label: 'Dir. Civil', color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  { value: 'dir_penal', label: 'Dir. Penal', color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  { value: 'port_log', label: 'Português / Lógica', color: '#fbbf24', bg: 'rgba(251,191,36,0.15)' },
  { value: 'proc_civil', label: 'Proc. Civil', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  { value: 'revisao', label: 'Revisão', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
];
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function GradeSemanal({ concursos }) {
  const { user } = useAuth();
  const [sessoes, setSessoes] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ concurso: '', materia: 'dir_const', hora: '07:00', duracao: '2' });
  const [saving, setSaving] = useState(false);

  const weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 0 }), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    if (!user) return;
    const unsub = getSessoes(user.uid, setSessoes);
    return unsub;
  }, [user]);

  const getSessoesCell = (dia, hora) => {
    const dateStr = format(dia, 'yyyy-MM-dd');
    return sessoes.filter(s => s.data === dateStr && s.hora === hora);
  };

  const handleAdd = async () => {
    if (!form.concurso || !modal) return;
    setSaving(true);
    await addSessao(user.uid, {
      ...form,
      data: format(modal.dia, 'yyyy-MM-dd'),
      duracao: parseFloat(form.duracao)
    });
    setSaving(false);
    setModal(null);
  };

  const getMateria = v => MATERIAS.find(m => m.value === v) || MATERIAS[0];

  const totalHorasSemana = sessoes
    .filter(s => s.data >= format(weekStart, 'yyyy-MM-dd') && s.data <= format(weekDays[6], 'yyyy-MM-dd'))
    .reduce((a, s) => a + (s.duracao || 1), 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Grade semanal</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} – {format(weekDays[6], "dd 'de' MMMM", { locale: ptBR })}
            <span style={{ marginLeft: 12, color: 'var(--accent2)', fontWeight: 500 }}>{totalHorasSemana.toFixed(1)}h estudadas</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>← Anterior</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>Hoje</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>Próxima →</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem' }}>
        {MATERIAS.map(m => (
          <div key={m.value} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text2)' }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color }} />
            {m.label}
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '52px repeat(7, 1fr)', gap: '1px', background: 'var(--border)', borderRadius: 12, overflow: 'hidden', minWidth: 600 }}>
          <div style={{ background: 'var(--bg3)', padding: '8px 4px' }} />
          {weekDays.map((d, i) => (
            <div key={i} style={{
              background: format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'rgba(108,99,255,0.1)' : 'var(--bg3)',
              padding: '8px 4px', textAlign: 'center'
            }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500 }}>{DIAS[i]}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? 'var(--accent2)' : 'var(--text)' }}>
                {format(d, 'dd')}
              </div>
            </div>
          ))}

          {HORAS.map(hora => (
            <React.Fragment key={hora}>
              <div style={{ background: 'var(--surface)', padding: '4px', textAlign: 'right', paddingRight: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: 'var(--text3)', marginTop: 6 }}>{hora}</span>
              </div>
              {weekDays.map((dia, di) => {
                const items = getSessoesCell(dia, hora);
                return (
                  <div key={di} style={{
                    background: 'var(--surface)', minHeight: 52, padding: 3, cursor: 'pointer'
                  }} onClick={() => setModal({ dia, hora })}>
                    {items.map(s => {
                      const m = getMateria(s.materia);
                      return (
                        <div key={s.id} style={{
                          background: m.bg, borderLeft: `3px solid ${m.color}`,
                          borderRadius: 6, padding: '3px 6px', marginBottom: 2,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                          <div style={{ fontSize: 10, color: m.color, fontWeight: 500, lineHeight: 1.3 }}>
                            {m.label.split(' ').pop()}<br />
                            <span style={{ color: 'var(--text3)', fontWeight: 400 }}>{s.duracao}h · {s.concurso}</span>
                          </div>
                          <button onClick={e => { e.stopPropagation(); deleteSessao(s.id); }} style={{
                            background: 'none', border: 'none', color: 'var(--text3)', fontSize: 14,
                            padding: 2, lineHeight: 1, cursor: 'pointer'
                          }}>×</button>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div style={{ height: '100%', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 16, color: 'var(--border2)', opacity: 0 }} className="add-icon">+</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ Nova sessão de estudo</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
              {DIAS[modal.dia.getDay()]} · {format(modal.dia, 'dd/MM')} às {modal.hora}
            </div>
            <div className="form-group">
              <label className="form-label">Concurso</label>
              <select className="form-input" value={form.concurso} onChange={e => setForm(f => ({ ...f, concurso: e.target.value }))}>
                <option value="">Selecione...</option>
                {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                {concursos.length === 0 && <option disabled>Cadastre um concurso primeiro</option>}
              </select>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Matéria</label>
                <select className="form-input" value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))}>
                  {MATERIAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duração (horas)</label>
                <select className="form-input" value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))}>
                  {['0.5','1','1.5','2','2.5','3','4'].map(v => <option key={v} value={v}>{v}h</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.concurso}>
                {saving ? 'Salvando...' : 'Adicionar sessão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
