import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getConcursos, addConcurso, deleteConcurso, addTopico } from '../firebase/services';
import { format } from 'date-fns';

const CORES = ['#6c63ff','#22d3a0','#f87171','#fbbf24','#60a5fa','#f472b6'];

const FORM_VAZIO = { nome: '', orgao: '', dataProva: '', cargo: '', cor: CORES[0] };

// Vocabulário de matérias comuns em concursos (case/acento tolerante via normalização)
const VOCABULARIO = [
  'Língua Portuguesa', 'Português', 'Raciocínio Lógico', 'Matemática',
  'Matemática Financeira', 'Direito Constitucional', 'Direito Administrativo',
  'Direito Civil', 'Direito Penal', 'Direito Processual Civil',
  'Direito Processual Penal', 'Direito do Trabalho', 'Direito Tributário',
  'Direito Empresarial', 'Direito Previdenciário', 'Direito Ambiental',
  'Legislação', 'Informática', 'Noções de Informática', 'Atualidades',
  'Conhecimentos Gerais', 'Conhecimentos Específicos', 'Contabilidade',
  'Administração', 'Administração Pública', 'Economia', 'Estatística',
  'Inglês', 'Espanhol', 'Ética', 'Ética no Serviço Público',
  'Arquivologia', 'Auditoria', 'Geografia', 'História', 'Redação Oficial',
];

// Cabeçalhos que NÃO são matérias (pra filtrar lixo da detecção)
const BLACKLIST = [
  'ANEXO', 'CONTEUDO PROGRAMATICO', 'CONHECIMENTOS', 'DISPOSICOES',
  'CRONOGRAMA', 'INSCRICAO', 'INSCRICOES', 'EDITAL', 'CARGO', 'CARGOS',
  'REQUISITOS', 'REMUNERACAO', 'VAGAS', 'TITULOS', 'PROVA', 'PROVAS',
  'CAPITULO', 'SECAO', 'SUMARIO', 'INDICE', 'REFERENCIAS', 'BIBLIOGRAFIA',
  'TABELA', 'QUADRO', 'OBSERVACAO', 'OBSERVACOES', 'PROGRAMA',
];

const normaliza = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();

export default function Concursos() {
  const { user } = useAuth();
  const [concursos, setConcursos] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);

  // ── Importação de edital ──
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState('');
  const [materiasExtraidas, setMateriasExtraidas] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [manual, setManual] = useState('');

  useEffect(() => {
    if (!user) return;
    return getConcursos(user.uid, setConcursos);
  }, [user]);

  const fecharModal = () => {
    setModal(false);
    setForm(FORM_VAZIO);
    setMateriasExtraidas([]);
    setSelecionadas([]);
    setManual('');
    setProgresso('');
  };

  // ── Leitura do PDF: reconstrói LINHAS reais pela posição vertical do texto ──
  const extrairLinhas = (arquivo) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          const linhas = [];
          for (let i = 1; i <= Math.min(pdf.numPages, 25); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            // Agrupa os pedaços de texto que estão na mesma altura (mesma linha)
            const porLinha = {};
            content.items.forEach(item => {
              if (!item.str || !item.str.trim()) return;
              const y = Math.round(item.transform[5]);
              if (!porLinha[y]) porLinha[y] = [];
              porLinha[y].push(item.str);
            });
            // Ordena de cima pra baixo (y maior = mais alto na página)
            Object.keys(porLinha)
              .map(Number).sort((a, b) => b - a)
              .forEach(y => {
                const linha = porLinha[y].join(' ').replace(/\s+/g, ' ').trim();
                if (linha) linhas.push(linha);
              });
          }
          resolve(linhas);
        } catch {
          resolve([]);
        }
      };
      reader.readAsArrayBuffer(arquivo);
    });
  };

  const extrairMaterias = (linhas) => {
    const achadas = new Map(); // normalizado -> texto bonito (preserva acento/caixa original)

    const textoTodo = linhas.join('\n');
    const normTodo = normaliza(textoTodo);

    // 1) Vocabulário: procura matérias conhecidas no texto inteiro
    VOCABULARIO.forEach(v => {
      if (normTodo.includes(normaliza(v))) {
        achadas.set(normaliza(v), v);
      }
    });

    // 2) Heurística por linha: linhas curtas que "parecem" título de matéria
    linhas.forEach(bruta => {
      // tira numeração/romanos no começo e dois-pontos no fim
      let l = bruta
        .replace(/^[\s]*(\d+[.)\-]?|[IVXLCDM]+[.)\-])\s+/i, '')
        .replace(/[:.;]+\s*$/, '')
        .trim();

      if (l.length < 4 || l.length > 55) return;
      const palavras = l.split(/\s+/);
      if (palavras.length > 7) return;                 // frase, não título
      if (!/[aeiouáéíóúâêôãõ]/i.test(l)) return;       // precisa ter vogal
      if (/[.!?]/.test(l)) return;                     // pontuação de frase
      if (/:/.test(l)) return;                         // ex: "Cargo: Fulano" não é matéria

      const norm = normaliza(l);
      // descarta cabeçalhos que não são matéria
      if (BLACKLIST.some(b => norm === b || norm.startsWith(b + ' ') || norm.endsWith(' ' + b))) return;

      // só aceita se for "destacado": MAIÚSCULAS ou Cada Palavra Capitalizada
      const ehMaiuscula = l === l.toUpperCase();
      const ehTitulo = palavras.every(p => p.length <= 3 || /^[A-ZÁÉÍÓÚÂÊÔÃÕ]/.test(p));
      if (!ehMaiuscula && !ehTitulo) return;

      // formata bonito (Primeira Maiúscula de cada palavra)
      const bonito = l.toLowerCase().replace(/(^|\s)([a-záéíóúâêôãõ])/g, (m, s, c) => s + c.toUpperCase());
      if (!achadas.has(norm)) achadas.set(norm, bonito);
    });

    return [...achadas.values()].slice(0, 40);
  };

  const handleUploadEdital = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setImportando(true);
    setProgresso('Lendo o PDF...');
    try {
      setProgresso('Reconstruindo o texto...');
      const linhas = await extrairLinhas(arquivo);
      setProgresso('Identificando matérias...');
      const materias = extrairMaterias(linhas);
      // junta com o que já estava (caso a Anne já tenha digitado alguma manual)
      setMateriasExtraidas(prev => {
        const conj = new Map(prev.map(m => [normaliza(m), m]));
        materias.forEach(m => { if (!conj.has(normaliza(m))) conj.set(normaliza(m), m); });
        return [...conj.values()];
      });
      setSelecionadas(prev => {
        const set = new Set(prev.map(normaliza));
        const novas = [...prev];
        materias.forEach(m => { if (!set.has(normaliza(m))) novas.push(m); });
        return novas;
      });
      setForm(f => f.nome ? f : { ...f, nome: arquivo.name.replace(/\.pdf$/i, '') });
      if (materias.length === 0) {
        alert('Não consegui identificar matérias automaticamente neste PDF (alguns editais têm formato difícil de ler). Você pode digitar as matérias no campo abaixo.');
      }
    } catch {
      alert('Erro ao processar o PDF. Tente novamente ou digite as matérias manualmente.');
    }
    setImportando(false);
    setProgresso('');
    e.target.value = '';
  };

  const toggleMateria = (mat) => {
    setSelecionadas(s => s.includes(mat) ? s.filter(m => m !== mat) : [...s, mat]);
  };

  const adicionarManual = () => {
    const m = manual.trim();
    if (!m) return;
    const norm = normaliza(m);
    setMateriasExtraidas(l => l.some(x => normaliza(x) === norm) ? l : [...l, m]);
    setSelecionadas(s => s.some(x => normaliza(x) === norm) ? s : [...s, m]);
    setManual('');
  };

  const handleAdd = async () => {
    if (!form.nome) return;
    setSaving(true);
    await addConcurso(user.uid, { ...form, materias: selecionadas });
    for (const mat of selecionadas) {
      await addTopico(user.uid, { texto: mat, concurso: form.nome, materia: mat });
    }
    setSaving(false);
    fecharModal();
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
            return (
              <div key={c.id} style={{
                background: 'var(--surface)', border: '0.5px solid var(--border)',
                borderRadius: 12, padding: '1rem',
                borderTop: `3px solid ${c.cor || CORES[0]}`
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
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

                {/* Matérias importadas do edital */}
                {c.materias && c.materias.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                    {c.materias.slice(0, 6).map((m, i) => (
                      <span key={i} style={{
                        fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent2)',
                        padding: '2px 7px', borderRadius: 10
                      }}>{m}</span>
                    ))}
                    {c.materias.length > 6 && (
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{c.materias.length - 6} matérias</span>
                    )}
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
        <div className="modal-backdrop" onClick={fecharModal}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">🏛️ Novo concurso</div>

            {/* Importar edital + matérias */}
            <div style={{
              background: 'var(--bg3)', border: '0.5px dashed var(--border2)',
              borderRadius: 8, padding: '12px', marginBottom: 16
            }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                Tem o edital em PDF? Importe para puxar as matérias automaticamente:
              </div>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--accent)', color: '#fff',
                padding: '8px 16px', borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: importando ? 'default' : 'pointer',
                opacity: importando ? 0.7 : 1
              }}>
                {importando ? `⏳ ${progresso}` : '📄 Importar edital (PDF)'}
                <input type="file" accept=".pdf" onChange={handleUploadEdital} style={{ display: 'none' }} disabled={importando} />
              </label>

              {/* Lista de matérias (detectadas + manuais) */}
              {materiasExtraidas.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                    Matérias — toque para escolher quais salvar ({selecionadas.length} selecionada{selecionadas.length !== 1 ? 's' : ''}):
                  </div>
                  <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                    {materiasExtraidas.map((m, i) => (
                      <div key={i} onClick={() => toggleMateria(m)} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '7px 8px', borderRadius: 6, cursor: 'pointer',
                        background: selecionadas.includes(m) ? 'var(--accent-soft)' : 'transparent',
                        marginBottom: 4
                      }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 4,
                          border: `1.5px solid ${selecionadas.includes(m) ? 'var(--accent)' : 'var(--border2)'}`,
                          background: selecionadas.includes(m) ? 'var(--accent)' : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          {selecionadas.includes(m) && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, color: 'var(--text)' }}>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar matéria manualmente (sempre disponível) */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>
                  Faltou alguma? Digite e adicione:
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Ex: Direito Constitucional"
                    value={manual}
                    onChange={e => setManual(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionarManual(); } }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-ghost" onClick={adicionarManual} disabled={!manual.trim()}>
                    Adicionar
                  </button>
                </div>
              </div>

              {selecionadas.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
                  As {selecionadas.length} matérias selecionadas viram tópicos deste concurso automaticamente.
                </div>
              )}
            </div>

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
              <button className="btn btn-ghost" onClick={fecharModal}>Cancelar</button>
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