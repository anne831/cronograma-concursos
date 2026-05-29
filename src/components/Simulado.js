import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getQuestoes, addQuestao, updateQuestao, deleteQuestao,
  getResultados, addResultado, deleteResultado
} from '../firebase/services';
import { format } from 'date-fns';
import { Pencil, Trash2, CheckCircle2, XCircle } from 'lucide-react';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const QUESTAO_VAZIA = { concurso: '', materia: '', enunciado: '', alternativas: ['', '', '', ''], correta: 0, comentario: '' };

export default function Simulado({ concursos = [], alvo = null }) {
  const { user } = useAuth();
  const [aba, setAba] = useState('treinar'); // treinar | banco | historico
  const [questoes, setQuestoes] = useState([]);
  const [resultados, setResultados] = useState([]);

  // Banco de questões
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(QUESTAO_VAZIA);
  const [saving, setSaving] = useState(false);
  const [bancoConcurso, setBancoConcurso] = useState('all');
  const [bancoMateria, setBancoMateria] = useState('all');

  // Treinar (setup)
  const [selConcurso, setSelConcurso] = useState('all');
  const [selMateria, setSelMateria] = useState('all');
  const [quantidade, setQuantidade] = useState(10);

  // Treinar (execução)
  const [emAndamento, setEmAndamento] = useState(false);
  const [questoesSim, setQuestoesSim] = useState([]);
  const [idxAtual, setIdxAtual] = useState(0);
  const [respostas, setRespostas] = useState({}); // { questaoId: indexAlternativa }
  const [finalizado, setFinalizado] = useState(false);

  useEffect(() => {
    if (!user) return;
    const u1 = getQuestoes(user.uid, setQuestoes);
    const u2 = getResultados(user.uid, setResultados);
    return () => { u1 && u1(); u2 && u2(); };
  }, [user]);

  // Se vier um alvo (ex: vindo do botão de 100% em Tópicos), pré-seleciona
  useEffect(() => {
    if (alvo && alvo.materia) {
      setAba('treinar');
      setSelConcurso(alvo.concurso || 'all');
      setSelMateria(alvo.materia);
    }
  }, [alvo]);

  // ── Listas auxiliares ──
  const materiasDe = (concursoFiltro) => {
    const fonte = questoes.filter(q => concursoFiltro === 'all' || q.concurso === concursoFiltro);
    return [...new Set(fonte.map(q => q.materia).filter(Boolean))];
  };

  const todasMaterias = [...new Set([
    ...questoes.map(q => q.materia).filter(Boolean),
    ...concursos.flatMap(c => c.materias || [])
  ])];

  // ───────────────────────────── BANCO DE QUESTÕES ─────────────────────────────
  const abrirNova = () => {
    setEditId(null);
    setForm({ ...QUESTAO_VAZIA, alternativas: ['', '', '', ''] });
    setModal(true);
  };

  const abrirEdicao = (q) => {
    setEditId(q.id);
    setForm({
      concurso: q.concurso || '',
      materia: q.materia || '',
      enunciado: q.enunciado || '',
      alternativas: q.alternativas && q.alternativas.length ? [...q.alternativas] : ['', '', '', ''],
      correta: typeof q.correta === 'number' ? q.correta : 0,
      comentario: q.comentario || ''
    });
    setModal(true);
  };

  const setAlt = (i, valor) => {
    setForm(f => {
      const alternativas = [...f.alternativas];
      alternativas[i] = valor;
      return { ...f, alternativas };
    });
  };

  const addAlt = () => {
    setForm(f => f.alternativas.length >= 6 ? f : { ...f, alternativas: [...f.alternativas, ''] });
  };

  const removerAlt = (i) => {
    setForm(f => {
      if (f.alternativas.length <= 2) return f;
      const alternativas = f.alternativas.filter((_, idx) => idx !== i);
      let correta = f.correta;
      if (correta === i) correta = 0;
      else if (correta > i) correta -= 1;
      return { ...f, alternativas, correta };
    });
  };

  const podeSalvar = form.enunciado.trim() && form.materia.trim()
    && form.alternativas.filter(a => a.trim()).length >= 2;

  const salvarQuestao = async () => {
    if (!podeSalvar) return;
    setSaving(true);
    const dados = {
      concurso: form.concurso,
      materia: form.materia.trim(),
      enunciado: form.enunciado.trim(),
      alternativas: form.alternativas.map(a => a.trim()).filter(a => a),
      correta: Math.min(form.correta, form.alternativas.filter(a => a.trim()).length - 1),
      comentario: form.comentario.trim()
    };
    if (editId) await updateQuestao(editId, dados);
    else await addQuestao(user.uid, dados);
    setSaving(false);
    setModal(false);
    setForm(QUESTAO_VAZIA);
    setEditId(null);
  };

  const questoesBanco = questoes
    .filter(q => bancoConcurso === 'all' || q.concurso === bancoConcurso)
    .filter(q => bancoMateria === 'all' || q.materia === bancoMateria);

  // ───────────────────────────── TREINAR ─────────────────────────────
  const questoesDisponiveis = questoes
    .filter(q => selConcurso === 'all' || q.concurso === selConcurso)
    .filter(q => selMateria === 'all' || q.materia === selMateria);

  const embaralhar = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const iniciarSimulado = () => {
    const sorteadas = embaralhar(questoesDisponiveis).slice(0, quantidade);
    if (sorteadas.length === 0) return;
    setQuestoesSim(sorteadas);
    setRespostas({});
    setIdxAtual(0);
    setFinalizado(false);
    setEmAndamento(true);
  };

  const responder = (questaoId, altIndex) => {
    setRespostas(r => ({ ...r, [questaoId]: altIndex }));
  };

  const acertos = questoesSim.filter(q => respostas[q.id] === q.correta).length;

  const finalizar = async () => {
    setFinalizado(true);
    // Salva o resultado no histórico
    await addResultado(user.uid, {
      concurso: selConcurso === 'all' ? '' : selConcurso,
      materia: selMateria === 'all' ? 'Geral' : selMateria,
      total: questoesSim.length,
      acertos,
      data: new Date().toISOString()
    });
  };

  const sairDoSimulado = () => {
    setEmAndamento(false);
    setFinalizado(false);
    setQuestoesSim([]);
    setRespostas({});
    setIdxAtual(0);
  };

  // ───────────────────────────── RENDER: cabeçalho + abas ─────────────────────────────
  const Abas = () => (
    <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
      {[
        { id: 'treinar', label: 'Treinar' },
        { id: 'banco', label: 'Banco de questões' },
        { id: 'historico', label: 'Histórico' }
      ].map(t => (
        <button key={t.id} onClick={() => setAba(t.id)} style={{
          padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: 13,
          fontWeight: aba === t.id ? 600 : 400, cursor: 'pointer',
          background: aba === t.id ? 'var(--accent-soft)' : 'transparent',
          color: aba === t.id ? 'var(--accent2)' : 'var(--text2)',
          outline: aba === t.id ? '0.5px solid rgba(124,111,255,0.3)' : 'none'
        }}>{t.label}</button>
      ))}
    </div>
  );

  // ───────────────────────────── RENDER: execução do simulado ─────────────────────────────
  if (emAndamento) {
    const q = questoesSim[idxAtual];

    if (finalizado) {
      const pct = Math.round(acertos / questoesSim.length * 100);
      return (
        <div style={{ width: '100%', maxWidth: 760 }}>
          <div style={{
            background: 'var(--surface)', border: '0.5px solid var(--border)',
            borderRadius: 14, padding: '1.5rem', marginBottom: 20, textAlign: 'center'
          }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>Seu resultado</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)' }}>
              {pct}%
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)' }}>{acertos} de {questoesSim.length} corretas</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Resultado salvo no histórico</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
              <button className="btn btn-ghost" onClick={sairDoSimulado}>Voltar</button>
              <button className="btn btn-primary" onClick={iniciarSimulado}>Refazer</button>
            </div>
          </div>

          {/* Revisão questão a questão */}
          {questoesSim.map((qq, i) => {
            const minha = respostas[qq.id];
            const acertou = minha === qq.correta;
            return (
              <div key={qq.id} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 12, padding: '1rem', marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  {acertou
                    ? <CheckCircle2 size={18} color="var(--green)" />
                    : <XCircle size={18} color="var(--red)" />}
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>Questão {i + 1}</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, whiteSpace: 'pre-wrap' }}>{qq.enunciado}</div>
                {qq.alternativas.map((alt, ai) => {
                  const ehCorreta = ai === qq.correta;
                  const ehMinha = ai === minha;
                  let bg = 'transparent', cor = 'var(--text2)';
                  if (ehCorreta) { bg = 'var(--green-soft)'; cor = 'var(--green)'; }
                  else if (ehMinha) { bg = 'var(--red-soft)'; cor = 'var(--red)'; }
                  return (
                    <div key={ai} style={{
                      display: 'flex', gap: 8, padding: '6px 10px', borderRadius: 6,
                      background: bg, marginBottom: 4, fontSize: 13, color: cor
                    }}>
                      <span style={{ fontWeight: 600 }}>{LETRAS[ai]})</span>
                      <span>{alt}</span>
                    </div>
                  );
                })}
                {qq.comentario && (
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 8, padding: 10, background: 'var(--bg3)', borderRadius: 6 }}>
                    <span style={{ color: 'var(--accent2)', fontWeight: 600 }}>Comentário: </span>{qq.comentario}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // Questão atual
    const minha = respostas[q.id];
    return (
      <div style={{ width: '100%', maxWidth: 760 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>
            Questão {idxAtual + 1} de {questoesSim.length}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={sairDoSimulado}>Sair</button>
        </div>

        {/* Barra de progresso */}
        <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, marginBottom: 18, overflow: 'hidden' }}>
          <div style={{ width: ((idxAtual + 1) / questoesSim.length * 100) + '%', height: '100%', background: 'var(--accent)', transition: 'width 0.3s' }} />
        </div>

        <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
          {q.materia && <div style={{ fontSize: 11, color: 'var(--accent2)', background: 'var(--accent-soft)', display: 'inline-block', padding: '2px 8px', borderRadius: 10, marginBottom: 10 }}>{q.materia}</div>}
          <div style={{ fontSize: 15, color: 'var(--text)', marginBottom: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.enunciado}</div>
          {q.alternativas.map((alt, ai) => {
            const sel = minha === ai;
            return (
              <button key={ai} onClick={() => responder(q.id, ai)} style={{
                display: 'flex', gap: 10, width: '100%', textAlign: 'left',
                padding: '11px 14px', borderRadius: 8, marginBottom: 8, cursor: 'pointer',
                border: `0.5px solid ${sel ? 'var(--accent)' : 'var(--border2)'}`,
                background: sel ? 'var(--accent-soft)' : 'transparent',
                color: sel ? 'var(--text)' : 'var(--text2)', fontSize: 14
              }}>
                <span style={{ fontWeight: 600, color: sel ? 'var(--accent2)' : 'var(--text3)' }}>{LETRAS[ai]})</span>
                <span>{alt}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button className="btn btn-ghost" onClick={() => setIdxAtual(i => Math.max(0, i - 1))} disabled={idxAtual === 0}>
            Anterior
          </button>
          {idxAtual < questoesSim.length - 1 ? (
            <button className="btn btn-primary" onClick={() => setIdxAtual(i => i + 1)}>Próxima</button>
          ) : (
            <button className="btn btn-primary" onClick={finalizar}>Finalizar simulado</button>
          )}
        </div>
      </div>
    );
  }

  // ───────────────────────────── RENDER: tela normal ─────────────────────────────
  return (
    <div style={{ width: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Simulado
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          Treine respondendo questões por matéria e acompanhe sua evolução
        </p>
      </div>

      <Abas />

      {/* ───── ABA TREINAR ───── */}
      {aba === 'treinar' && (
        <div style={{ maxWidth: 520 }}>
          {questoes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📝</div>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>Você ainda não tem questões cadastradas</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Vá em "Banco de questões" e adicione as primeiras</div>
              <button className="btn btn-primary" style={{ marginTop: 18 }} onClick={() => setAba('banco')}>
                Ir para o banco de questões
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 14, padding: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Concurso</label>
                <select className="form-input" value={selConcurso} onChange={e => { setSelConcurso(e.target.value); setSelMateria('all'); }}>
                  <option value="all">Todos</option>
                  {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Matéria</label>
                <select className="form-input" value={selMateria} onChange={e => setSelMateria(e.target.value)}>
                  <option value="all">Todas</option>
                  {materiasDe(selConcurso).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quantidade de questões</label>
                <select className="form-input" value={quantidade} onChange={e => setQuantidade(Number(e.target.value))}>
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} questões</option>)}
                </select>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 14 }}>
                Disponíveis com esse filtro: <strong style={{ color: 'var(--text)' }}>{questoesDisponiveis.length}</strong>
                {questoesDisponiveis.length > 0 && quantidade > questoesDisponiveis.length &&
                  ` (o simulado terá ${questoesDisponiveis.length})`}
              </div>
              <button className="btn btn-primary" onClick={iniciarSimulado} disabled={questoesDisponiveis.length === 0}>
                ▶ Iniciar simulado
              </button>
            </div>
          )}
        </div>
      )}

      {/* ───── ABA BANCO ───── */}
      {aba === 'banco' && (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={abrirNova}>+ Nova questão</button>
            <select className="form-input" style={{ width: 'auto', minWidth: 150 }} value={bancoConcurso} onChange={e => setBancoConcurso(e.target.value)}>
              <option value="all">Todos os concursos</option>
              {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
            </select>
            <select className="form-input" style={{ width: 'auto', minWidth: 160 }} value={bancoMateria} onChange={e => setBancoMateria(e.target.value)}>
              <option value="all">Todas as matérias</option>
              {[...new Set(questoes.map(q => q.materia).filter(Boolean))].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {questoesBanco.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '0.5px dashed var(--border2)', borderRadius: 12, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>Nenhuma questão aqui ainda</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
                Dica: copie questões de provas anteriores da banca — gabarito e estilo reais.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {questoesBanco.map(q => (
                <div key={q.id} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {q.materia && <span style={{ fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent2)', padding: '2px 7px', borderRadius: 10 }}>{q.materia}</span>}
                      {q.concurso && <span style={{ fontSize: 10, color: 'var(--text3)' }}>{q.concurso}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => abrirEdicao(q)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2 }} title="Editar"><Pencil size={15} /></button>
                      <button onClick={() => deleteQuestao(q.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2 }} title="Excluir"><Trash2 size={15} /></button>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {q.enunciado}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                    {q.alternativas?.length || 0} alternativas · correta: {LETRAS[q.correta] || '?'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───── ABA HISTÓRICO ───── */}
      {aba === 'historico' && (
        <div style={{ maxWidth: 640 }}>
          {resultados.length === 0 ? (
            <div style={{ background: 'var(--surface)', border: '0.5px dashed var(--border2)', borderRadius: 12, padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: 'var(--text2)' }}>Nenhum simulado feito ainda</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Faça um simulado na aba "Treinar" para ver sua evolução aqui</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...resultados].sort((a, b) => new Date(b.data) - new Date(a.data)).map(r => {
                const pct = Math.round(r.acertos / r.total * 100);
                const cor = pct >= 70 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
                return (
                  <div key={r.id} style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600 }}>{r.materia || 'Geral'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                          {r.data ? format(new Date(r.data), 'dd/MM/yyyy HH:mm') : ''}{r.concurso ? ` · ${r.concurso}` : ''}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{r.acertos}/{r.total}</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: cor }}>{pct}%</span>
                        <button onClick={() => deleteResultado(r.id)} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: 2 }} title="Excluir"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: pct + '%', height: '100%', background: cor }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ───── MODAL: nova/editar questão ───── */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{editId ? 'Editar questão' : '+ Nova questão'}</div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Concurso</label>
                <select className="form-input" value={form.concurso} onChange={e => setForm(f => ({ ...f, concurso: e.target.value }))}>
                  <option value="">Selecione...</option>
                  {concursos.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Matéria *</label>
                <input className="form-input" list="materias-sugeridas" placeholder="Ex: Língua Portuguesa"
                  value={form.materia} onChange={e => setForm(f => ({ ...f, materia: e.target.value }))} />
                <datalist id="materias-sugeridas">
                  {todasMaterias.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Enunciado *</label>
              <textarea className="form-input" rows={4} placeholder="Cole aqui o enunciado da questão"
                value={form.enunciado} onChange={e => setForm(f => ({ ...f, enunciado: e.target.value }))}
                style={{ resize: 'vertical', minHeight: 80 }} />
            </div>

            <div className="form-group">
              <label className="form-label">Alternativas (marque a correta)</label>
              {form.alternativas.map((alt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <button onClick={() => setForm(f => ({ ...f, correta: i }))} title="Marcar como correta" style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                    border: `2px solid ${form.correta === i ? 'var(--green)' : 'var(--border2)'}`,
                    background: form.correta === i ? 'var(--green)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {form.correta === i && <span style={{ color: '#000', fontSize: 11, fontWeight: 700 }}>✓</span>}
                  </button>
                  <span style={{ fontSize: 13, color: 'var(--text3)', width: 16 }}>{LETRAS[i]}</span>
                  <input className="form-input" placeholder={`Alternativa ${LETRAS[i]}`}
                    value={alt} onChange={e => setAlt(i, e.target.value)} style={{ flex: 1 }} />
                  {form.alternativas.length > 2 && (
                    <button onClick={() => removerAlt(i)} style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: 18, cursor: 'pointer', padding: '0 4px' }}>×</button>
                  )}
                </div>
              ))}
              {form.alternativas.length < 6 && (
                <button className="btn btn-ghost btn-sm" onClick={addAlt} style={{ marginTop: 4 }}>+ Adicionar alternativa</button>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Comentário / explicação (opcional)</label>
              <textarea className="form-input" rows={2} placeholder="Por que a correta é a correta (aparece na correção)"
                value={form.comentario} onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarQuestao} disabled={saving || !podeSalvar}>
                {saving ? 'Salvando...' : (editId ? 'Salvar' : 'Adicionar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}