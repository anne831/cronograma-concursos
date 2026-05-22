import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addTopico, toggleTopico, deleteTopico } from '../firebase/services';
import { TOPICOS_TJCE } from './TopicosIniciais';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function Topicos({ concursos }) {
  const { user } = useAuth();
  const [topicos, setTopicos] = useState([]);
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState('all');
  const [filtroMateria, setFiltroMateria] = useState('all');
  const [form, setForm] = useState({ texto: '', concurso: '', materia: '' });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'topicos'), where('userId', '==', user.uid));
    return onSnapshot(q, snap => setTopicos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const importarTJCE = async () => {
    if (importing) return;
    setImporting(true);
    for (const t of TOPICOS_TJCE) {
      await addTopico(user.uid, t);
    }
    setImporting(false);
  };

  const handleAdd = async () => {
    if (!form.texto || !form.concurso) return;
    setSaving(true);
    await addTopico(user.uid, { texto: form.texto, concurso: form.concurso, materia: form.materia });
    setSaving(false);
    setModal(false);
    setForm({ texto: '', concurso: '', materia: '' });
  };

  const materias = ['all', ...new Set(topicos.map(t => t.materia).filter(Boolean))];
  const lista = topicos
    .filter(t => filtro === 'all' || t.concurso === filtro)
    .filter(t => filtroMateria === 'all' || t.materia === filtroMateria);

  const concluidos = lista.filter(t => t.concluido).length;
  const pct = lista.length > 0 ? Math.round(concluidos / lista.length * 100) : 0;

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Tópicos
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          {concluidos} de {lista.length} concluídos — {pct}%
        </p>
      </div>

      {/* Barra de progresso geral */}
      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{
          width: pct + '%', height: '100%',
          background: 'linear-gradient(90deg, var(--accent), var(--green))',
          borderRadius: 3, transition: 'width 0.5s'
        }} />
      </div>

      {/* Botões de ação */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          + Adicionar tópico
        </button>
        <button className="btn btn-ghost" onClick={importarTJCE} disabled={importing}>
          {importing ? '⏳ Importando...' : '📥 Importar TJ-CE'}
        </button>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 160 }}
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
        >
          <option value="all">Todos os concursos</option>
          {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
        </select>
        <select
          className="form-input"
          style={{ width: 'auto', minWidth: 180 }}
          value={filtroMateria}
          onChange={e => setFiltroMateria(e.target.value)}
        >
          {materias.map(m => <option key={m} value={m}>{m === 'all' ? 'Todas as matérias' : m}</option>)}
        </select>
      </div>

      {/* Lista de tópicos */}
      <div style={{
        background: 'var(--surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden'
      }}>
        {lista.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>Nenhum tópico encontrado</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {topicos.length === 0 ? 'Clique em "Importar TJ-CE" para começar!' : 'Tente mudar os filtros'}
            </div>
          </div>
        ) : lista.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '12px 16px',
            borderBottom: i < lista.length - 1 ? '0.5px solid var(--border)' : 'none',
            transition: 'background 0.15s'
          }}>
            {/* Checkbox */}
            <button onClick={() => toggleTopico(t.id, !t.concluido)} style={{
              width: 20, height: 20, borderRadius: 5,
              border: `1.5px solid ${t.concluido ? 'var(--green)' : 'var(--border2)'}`,
              background: t.concluido ? 'var(--green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s'
            }}>
              {t.concluido && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>}
            </button>

            {/* Texto */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 14, color: t.concluido ? 'var(--text3)' : 'var(--text)',
                textDecoration: t.concluido ? 'line-through' : 'none',
                lineHeight: 1.4
              }}>
                {t.texto}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, color: 'var(--accent2)',
                  background: 'var(--accent-soft)',
                  padding: '1px 7px', borderRadius: 10
                }}>{t.concurso}</span>
                {t.materia && (
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.materia}</span>
                )}
              </div>
            </div>

            {/* Botão deletar */}
            <button onClick={() => deleteTopico(t.id)} style={{
              background: 'none', border: 'none',
              color: 'var(--text3)', fontSize: 18,
              cursor: 'pointer', padding: '0 4px',
              lineHeight: 1, flexShrink: 0
            }}>×</button>
          </div>
        ))}
      </div>

      {/* Modal adicionar tópico */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">+ Novo tópico</div>
            <div className="form-group">
              <label className="form-label">Tópico / conteúdo</label>
              <input className="form-input" placeholder="Ex: Princípios fundamentais da CF/88"
                value={form.texto} onChange={e => setForm(f => ({ ...f, texto: e.target.value }))} />
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
                <label className="form-label">Matéria (opcional)</label>
                <input className="form-input" placeholder="Ex: Dir. Constitucional"
                  value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={saving || !form.texto || !form.concurso}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}