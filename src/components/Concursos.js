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
    return Math.ceil((new Date(data + 'T12:00:00') - new Date()) / (1000 * 60 * 60 * 24));
  };

  return (
  <div style={{ width: '100%' }}>

  {/* Header */}
  <div style={{ marginBottom: 24 }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
      Concursos
    </h2>
    <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>
      {concursos.length} concurso{concursos.length !== 1 ? 's' : ''} cadastrado{concursos.length !== 1 ? 's' : ''}
    </p>
    <div style={{ marginTop: 10 }}>
      <button className="btn btn-primary" onClick={() => setModal(true)}>
        + Novo concurso
      </button>
    </div>
  </div>

  {/* Lista */}
  {concursos.length === 0 ? (
    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text3)' }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>🏛️</div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>Nenhum concurso cadastrado</div>
          <div style={{ fontSize: 13 }}>Comece cadastrando os concursos que está estudando</div>
          <button className="btn btn-primary" onClick={() => setModal(true)} style={{ marginTop: 20 }}>
          + Cadastrar primeiro concurso
</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {concursos.map(c => {
            const dias = diasParaProva(c.dataProva);
             (
              <div key={c.id} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 12, padding: '1rem',
                borderTop: `3px solid ${c.cor || CORES[0]}`
              }}>
                <div sreturntyle={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                      {c.nome}
                    </div>
                    {c.orgao && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{c.orgao}</div>}
                  </div>
                  <button onClick={() => deleteConcurso(c.id)} style={{
                    background: 'none', border: 'none', color: 'var(--text3)',
                    fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1
                  }}>×</button>
                </div>

                {c.cargo && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text3)' }}>Cargo: </span>{c.cargo}
                  </div>
                )}

                {c.dataProva && (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                        Prova: <span style={{ color: 'var(--text2)' }}>{format(new Date(c.dataProva + 'T12:00:00'), 'dd/MM/yyyy')}</span>
                      </div>
                      {dias !== null && (
                        <span style={{
                          fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 10,
                          background: dias < 30 ? 'var(--red-soft)' : dias < 90 ? 'var(--amber-soft)' : 'var(--green-soft)',
                          color: dias < 30 ? 'var(--red)' : dias < 90 ? 'var(--amber)' : 'var(--green)'
                        }}>
                          {dias > 0 ? `${dias} dias` : 'Passou'}
                        </span>
                      )}
                    </div>
                    {dias !== null && dias > 0 && (
                      <div style={{ height: 4, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          width: Math.max(0, 100 - dias / 365 * 100) + '%',
                          height: '100%', background: c.cor || CORES[0], borderRadius: 2
                        }} />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
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
                    outlineOffset: 2
                  }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button onClick={handleAdd} disabled={saving || !form.nome} style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '8px 16px', fontSize: 13,
                fontWeight: 500, cursor: 'pointer'
              }}>
                {saving ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}