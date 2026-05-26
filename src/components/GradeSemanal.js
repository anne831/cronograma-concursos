import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSessoes, addSessao, deleteSessao } from '../firebase/services';
import { format, startOfWeek, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MATERIAS = [
  { value: 'port', label: 'Língua Portuguesa', color: '#60a5fa' },
  { value: 'logica', label: 'Raciocínio Lógico', color: '#fbbf24' },
  { value: 'deficiencia', label: 'Dir. Pessoas c/ Deficiência', color: '#34d399' },
  { value: 'leg_estadual', label: 'Legislação Estadual', color: '#f472b6' },
  { value: 'dir_const', label: 'Dir. Constitucional', color: '#a78bfa' },
  { value: 'dir_adm', label: 'Dir. Administrativo', color: '#22d3a0' },
  { value: 'dir_civil', label: 'Dir. Civil', color: '#f87171' },
  { value: 'proc_civil', label: 'Proc. Civil', color: '#fb923c' },
  { value: 'dir_penal', label: 'Dir. Penal', color: '#e879f9' },
  { value: 'proc_penal', label: 'Proc. Penal', color: '#94a3b8' },
  { value: 'revisao', label: 'Revisão', color: '#64748b' },
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
    return getSessoes(user.uid, setSessoes);
  }, [user]);

  const getSessoesDia = (dia) => {
    const dateStr = format(dia, 'yyyy-MM-dd');
    return sessoes.filter(s => s.data === dateStr);
  };

  const handleAdd = async () => {
    if (!form.concurso || !modal) return;
    setSaving(true);
    await addSessao(user.uid, {
      ...form,
      data: format(modal, 'yyyy-MM-dd'),
      duracao: parseFloat(form.duracao)
    });
    setSaving(false);
    setModal(null);
  };

  const getMateria = v => MATERIAS.find(m => m.value === v) || MATERIAS[0];

  const totalHoras = sessoes
    .filter(s => s.data >= format(weekStart, 'yyyy-MM-dd') && s.data <= format(weekDays[6], 'yyyy-MM-dd'))
    .reduce((a, s) => a + (s.duracao || 0), 0);

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Grade semanal
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            {format(weekStart, "dd 'de' MMMM", { locale: ptBR })} — {format(weekDays[6], "dd 'de' MMMM", { locale: ptBR })}
            <span style={{ marginLeft: 10, color: 'var(--accent2)', fontWeight: 500 }}>{totalHoras.toFixed(1)}h estudadas</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w - 1)}>←</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(0)}>Hoje</button>
          <button className="btn btn-ghost btn-sm" onClick={() => setWeekOffset(w => w + 1)}>→</button>
        </div>
      </div>

      {/* Grade */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
        {weekDays.map((dia, i) => {
          const isHoje = format(dia, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const sessoesDia = getSessoesDia(dia);
          return (
            <div key={i} style={{
              background: 'var(--surface)',
              border: `0.5px solid ${isHoje ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: 12,
              overflow: 'hidden',
              minHeight: 140
            }}>
              {/* Cabeçalho do dia */}
              <div style={{
                padding: '8px 10px',
                borderBottom: '0.5px solid var(--border)',
                background: isHoje ? 'var(--accent-soft)' : 'transparent',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: isHoje ? 'var(--accent2)' : 'var(--text3)', fontWeight: 500 }}>
                  {DIAS[i]}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: isHoje ? 'var(--accent2)' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                  {format(dia, 'dd')}
                </div>
              </div>

              {/* Sessões */}
              <div style={{ padding: '6px' }}>
                {sessoesDia.map(s => {
                  const m = getMateria(s.materia);
                  return (
                    <div key={s.id} style={{
                      background: m.color + '20',
                      borderLeft: `3px solid ${m.color}`,
                      borderRadius: 6,
                      padding: '5px 7px',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <div>
                        <div style={{ fontSize: 11, color: m.color, fontWeight: 600, lineHeight: 1.3 }}>
                          {m.label.split(' ').slice(-1)[0]}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{s.hora} · {s.duracao}h</div>
                      </div>
                      <button onClick={() => deleteSessao(s.id)} style={{
                        background: 'none', border: 'none', color: 'var(--text3)',
                        fontSize: 14, cursor: 'pointer', padding: '0 2px', lineHeight: 1
                      }}>×</button>
                    </div>
                  );
                })}

                {/* Botão adicionar */}
                <button onClick={() => setModal(dia)} style={{
                  width: '100%', padding: '5px', border: '0.5px dashed var(--border2)',
                  borderRadius: 6, background: 'transparent', color: 'var(--text3)',
                  fontSize: 11, cursor: 'pointer', marginTop: sessoesDia.length > 0 ? 4 : 0
                }}>+ adicionar</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ Nova sessão</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
              {DIAS[modal.getDay()]} · {format(modal, 'dd/MM')}
            </div>
            <div className="form-group">
              <label className="form-label">Concurso</label>
              <select className="form-input" value={form.concurso} onChange={e => setForm(f => ({ ...f, concurso: e.target.value }))}>
                <option value="">Selecione...</option>
                {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
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
                <label className="form-label">Horário</label>
                <select className="form-input" value={form.hora} onChange={e => setForm(f => ({ ...f, hora: e.target.value }))}>
                  {['06:00','07:00','08:00','09:00','10:00','11:00','14:00','15:00','16:00','19:00','20:00','21:00'].map(h => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Duração</label>
              <select className="form-input" value={form.duracao} onChange={e => setForm(f => ({ ...f, duracao: e.target.value }))}>
                {['0.5','1','1.5','2','2.5','3','4'].map(v => <option key={v} value={v}>{v}h</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.concurso}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
