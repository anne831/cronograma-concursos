import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { addTopico, toggleTopico, deleteTopico } from '../firebase/services';
import { TOPICOS_TJCE } from './TopicosIniciais';

export default function Topicos({ concursos }) {
  const { user } = useAuth();
  const [topicos, setTopicos] = useState([]); // eslint-disable-line
  const [modal, setModal] = useState(false);
  const [filtro, setFiltro] = useState('all');
  const [form, setForm] = useState({ texto: '', concurso: '', materia: '' });
  const [saving, setSaving] = useState(false);
const [importing, setImporting] = useState(false);

const importarTJCE = async () => {
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

  const lista = filtro === 'all' ? topicos : topicos.filter(t => t.concurso === filtro);
  const concluidos = lista.filter(t => t.concluido).length;
  const pct = lista.length > 0 ? Math.round(concluidos / lista.length * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800 }}>Tópicos</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 2 }}>
            {concluidos} de {lista.length} concluídos
            <span style={{ marginLeft: 8, color: 'var(--accent2)', fontWeight: 500 }}>{pct}%</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 'auto' }} value={filtro} onChange={e => setFiltro(e.target.value)}>
            <option value="all">Todos os concursos</option>
            {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={importarTJCE} disabled={importing}>
            {importing ? 'Importando...' : '📥 Importar TJ-CE'}
          </button>
          <button className="btn btn-primary" onClick={() => setModal(true)}>+ Adicionar tópico</button>
<button className="btn btn-ghost" onClick={importarTJCE} disabled={importing}>
  {importing ? 'Importando...' : '📥 Importar TJ-CE'}
</button>
        </div>
      </div>

      <div style={{ height: 6, background: 'var(--bg3)', borderRadius: 3, marginBottom: '1.5rem', overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'linear-gradient(90deg, var(--accent), var(--green))', borderRadius: 3, transition: 'width 0.5s' }} />
      </div>

      <div className="card">
        {lista.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text3)' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14 }}>Nenhum tópico cadastrado</div>
            <div style={{ fontSize: 12, marginTop: 4, marginBottom: 16 }}>Clique em "Importar TJ-CE" para adicionar todos os tópicos do edital de uma vez!</div>
            <button className="btn btn-primary" onClick={importarTJCE} disabled={importing}>
              {importing ? 'Importando...' : '📥 Importar TJ-CE'}
            </button>
          </div>
        ) : lista.map((t, i) => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '11px 4px',
            borderBottom: i < lista.length - 1 ? '1px solid var(--border)' : 'none'
          }}>
            <button onClick={() => toggleTopico(t.id, !t.concluido)} style={{
              width: 20, height: 20, borderRadius: 5, border: '1.5px solid',
              borderColor: t.concluido ? 'var(--green)' : 'var(--border2)',
              background: t.concluido ? 'var(--green)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, transition: 'var(--transition)'
            }}>
              {t.concluido && <span style={{ color: '#000', fontSize: 12, fontWeight: 700 }}>✓</span>}
            </button>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: t.concluido ? 'var(--text3)' : 'var(--text)', textDecoration: t.concluido ? 'line-through' : 'none' }}>
                {t.texto}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 3 }}>
                <span style={{ fontSize: 11, color: 'var(--accent2)', background: 'var(--accent-soft)', padding: '1px 7px', borderRadius: 10 }}>{t.concurso}</span>
                {t.materia && <span style={{ fontSize: 11, color: 'var(--text3)' }}>{t.materia}</span>}
              </div>
            </div>
            <button className="btn-icon" onClick={() => deleteTopico(t.id)} style={{ fontSize: 16, flexShrink: 0 }}>×</button>
          </div>
        ))}
      </div>

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