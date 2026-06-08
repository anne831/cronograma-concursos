import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAnotacoes, addAnotacao, updateAnotacao, deleteAnotacao } from '../firebase/services';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

const FORM_VAZIO = { concurso: '', materia: '', titulo: '', conteudo: '' };

export default function Anotacoes({ concursos = [] }) {
  const { user } = useAuth();
  const [anotacoes, setAnotacoes] = useState([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);

  const [filtroConcurso, setFiltroConcurso] = useState('all');
  const [filtroMateria, setFiltroMateria] = useState('all');

  useEffect(() => {
    if (!user) return;
    return getAnotacoes(user.uid, setAnotacoes);
  }, [user]);

  // matérias conhecidas (das anotações + dos concursos) para sugerir
  const todasMaterias = [...new Set([
    ...anotacoes.map(a => a.materia).filter(Boolean),
    ...concursos.flatMap(c => c.materias || [])
  ])];

  const abrirNova = () => {
    setEditId(null);
    setForm(FORM_VAZIO);
    setModal(true);
  };

  const abrirEdicao = (a) => {
    setEditId(a.id);
    setForm({
      concurso: a.concurso || '',
      materia: a.materia || '',
      titulo: a.titulo || '',
      conteudo: a.conteudo || ''
    });
    setModal(true);
  };

  const fecharModal = () => {
    setModal(false);
    setEditId(null);
    setForm(FORM_VAZIO);
  };

  const podeSalvar = form.materia.trim() && form.conteudo.trim();

  const salvar = async () => {
    if (!podeSalvar) return;
    setSaving(true);
    const dados = {
      concurso: form.concurso,
      materia: form.materia.trim(),
      titulo: form.titulo.trim(),
      conteudo: form.conteudo.trim(),
      atualizadoEm: new Date().toISOString()
    };
    if (editId) await updateAnotacao(editId, dados);
    else await addAnotacao(user.uid, dados);
    setSaving(false);
    fecharModal();
  };

  const lista = anotacoes
    .filter(a => filtroConcurso === 'all' || a.concurso === filtroConcurso)
    .filter(a => filtroMateria === 'all' || a.materia === filtroMateria)
    .sort((a, b) => new Date(b.atualizadoEm || 0) - new Date(a.atualizadoEm || 0));

  const materiasFiltro = [...new Set(anotacoes.map(a => a.materia).filter(Boolean))];

  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Anotações
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          Seu caderno de resumos e observações, organizado por matéria
        </p>
        <div style={{ marginTop: 10 }}>
          <button className="btn btn-primary" onClick={abrirNova}>+ Nova anotação</button>
        </div>
      </div>

      {/* Filtros */}
      {anotacoes.length > 0 && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <select className="form-input" style={{ width: 'auto', minWidth: 150 }} value={filtroConcurso} onChange={e => setFiltroConcurso(e.target.value)}>
            <option value="all">Todos os concursos</option>
            {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
          </select>
          <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={filtroMateria} onChange={e => setFiltroMateria(e.target.value)}>
            <option value="all">Todas as matérias</option>
            {materiasFiltro.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      )}

      {/* Lista */}
      {lista.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📓</div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>
            {anotacoes.length === 0 ? 'Nenhuma anotação ainda' : 'Nenhuma anotação com esse filtro'}
          </div>
          <div style={{ fontSize: 13 }}>
            {anotacoes.length === 0 ? 'Crie resumos por matéria e revise quando quiser' : 'Tente mudar o concurso ou a matéria'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {lista.map(a => (
            <div key={a.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '1rem', display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {a.materia && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent2)', padding: '2px 7px', borderRadius: 10 }}>{a.materia}</span>}
                  {a.concurso && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{a.concurso}</span>}
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => abrirEdicao(a)} title="Editar" style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2, display: 'flex' }}><Pencil size={15} /></button>
                  <button onClick={() => deleteAnotacao(a.id)} title="Excluir" style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2, display: 'flex' }}><Trash2 size={15} /></button>
                </div>
              </div>

              {a.titulo && (
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
                  {a.titulo}
                </div>
              )}

              <div style={{
                fontSize: 13, color: 'var(--text2)', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1
              }}>
                {a.conteudo}
              </div>

              {a.atualizadoEm && (
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 10 }}>
                  {format(new Date(a.atualizadoEm), 'dd/MM/yyyy HH:mm')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal nova/editar */}
      {modal && (
        <div className="modal-backdrop" onClick={fecharModal}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editId ? '✏️ Editar anotação' : '📓 Nova anotação'}</div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Concurso</label>
                <select className="form-input" value={form.concurso} onChange={e => setForm(f => ({ ...f, concurso: e.target.value }))}>
                  <option value="">Nenhum / geral</option>
                  {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Matéria *</label>
                <input className="form-input" list="materias-anotacoes" placeholder="Ex: Direito Constitucional"
                  value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} />
                <datalist id="materias-anotacoes">
                  {todasMaterias.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Título (opcional)</label>
              <input className="form-input" placeholder="Ex: Princípios da Administração Pública"
                value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Anotação *</label>
              <textarea className="form-input" rows={9} placeholder="Escreva seu resumo, macete, lei seca, jurisprudência..."
                value={form.conteudo} onChange={e => setForm(f => ({ ...f, conteudo: e.target.value }))}
                style={{ resize: 'vertical', minHeight: 160, lineHeight: 1.55 }} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={fecharModal}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvar} disabled={saving || !podeSalvar}>
                {saving ? 'Salvando...' : (editId ? 'Salvar' : 'Adicionar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}