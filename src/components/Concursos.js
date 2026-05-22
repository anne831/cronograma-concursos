import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getConcursos, addConcurso, deleteConcurso } from '../firebase/services';
import { format } from 'date-fns';

const CORES = ['#6c63ff','#22d3a0','#f87171','#fbbf24','#60a5fa','#f472b6'];

export default function Concursos() {
  const { user } = useAuth();
  const [concursos, setConcursos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nome: '', orgao: '', dataProva: '', cargo: '', cor: CORES[0] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    return getConcursos(user.uid, setConcursos);
  }, [user]);

  const handleAdd = async () => {
    if (!form.nome) return;
    setSaving(true);
    await addConcurso(user.uid, form);
    setSaving(false);
    setModal(false);
    setForm({ nome: '', orgao: '', dataProva: '', cargo: '', cor: CORES[0] });
  };

  const diasParaProva = (data) => {
    if (!data) return null;
    const diff = Math.ceil((new Date(data + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div>
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
    <div>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Concursos</h2>
      <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>{concursos.length} concursos cadastrados</p>
    </div>
    <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}>+ Novo concurso</button>
  </div>

      {concursos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>Nenhum concurso cadastrado</div>
          <div style={{ fontSize: 13 }}>Comece cadastrando os concursos que está estudando</div>
          <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setModal(true)}>
            + Cadastrar primeiro concurso
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {concursos.map(c => {
            const dias = diasParaProva(c.dataProva);
            return (
              <div key={c.id} className="card" style={{ borderTop: `3px solid ${c.cor || CORES[0]}`, position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{c.nome}</div>
                    {c.orgao && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{c.orgao}</div>}
                  </div>
                  <button className="btn-icon" onClick={() => deleteConcurso(c.id)} style={{ fontSize: 16 }}>×</button>
                </div>
                {c.cargo && (
                  <div style={{ marginTop: 10 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Cargo: </span>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{c.cargo}</span>
                  </div>
                )}
                {c.dataProva && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                      Data da prova: <span style={{ color: 'var(--text2)' }}>{format(new Date(c.dataProva + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                    </div>
                    {dias !== null && (
                      <span className={`badge ${dias < 30 ? 'badge-red' : dias < 90 ? 'badge-amber' : 'badge-green'}`}>
                        {dias > 0 ? `${dias} dias` : 'Passou'}
                      </span>
                    )}
                  </div>
                )}
                {c.dataProva && dias !== null && dias > 0 && (
                  <div style={{ marginTop: 10, height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: Math.max(0, 100 - dias / 365 * 100) + '%', height: '100%', background: c.cor || CORES[0], borderRadius: 2 }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">🏛️ Novo concurso</div>
            <div className="form-group">
              <label className="form-label">Nome do concurso *</label>
              <input className="form-input" placeholder="Ex: TJ-CE, Polícia Federal"
                value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Órgão</label>
                <input className="form-input" placeholder="Ex: Tribunal de Justiça"
                  value={form.orgao} onChange={e => setForm(f => ({ ...f, orgao: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Data da prova</label>
                <input type="date" className="form-input"
                  value={form.dataProva} onChange={e => setForm(f => ({ ...f, dataProva: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Cargo pretendido</label>
              <input className="form-input" placeholder="Ex: Técnico Judiciário"
                value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Cor de identificação</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {CORES.map(cor => (
                  <button key={cor} onClick={() => setForm(f => ({ ...f, cor }))} style={{
                    width: 28, height: 28, borderRadius: '50%', background: cor, border: 'none',
                    cursor: 'pointer', outline: form.cor === cor ? `3px solid ${cor}` : 'none',
                    outlineOffset: 2, transition: 'var(--transition)'
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.nome}>
                {saving ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
