import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

export default function Editais({ onImportarMaterias }) {
  const { user } = useAuth();
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editalAtual, setEditalAtual] = useState(null);
  const [materiasExtraidas, setMateriasExtraidas] = useState([]);
  const [selecionadas, setSelecionadas] = useState([]);
  const [concursoNome, setConcursoNome] = useState('');
  const [progresso, setProgresso] = useState('');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'editais'), where('userId', '==', user.uid));
    return onSnapshot(q, snap => setEditais(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const extrairTexto = (arquivo) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdfjsLib = await import('pdfjs-dist/build/pdf');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          let texto = '';
          for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            texto += content.items.map(item => item.str).join(' ') + '\n';
          }
          resolve(texto);
        } catch {
          resolve('');
        }
      };
      reader.readAsArrayBuffer(arquivo);
    });
  };

  const extrairMaterias = (texto) => {
    const materias = new Set();
    const padroes = [
      /LÍNGUA PORTUGUESA/gi, /PORTUGUÊS/gi, /RACIOCÍNIO LÓGICO/gi,
      /MATEMÁTICA/gi, /DIREITO CONSTITUCIONAL/gi, /DIREITO ADMINISTRATIVO/gi,
      /DIREITO CIVIL/gi, /DIREITO PENAL/gi, /DIREITO PROCESSUAL CIVIL/gi,
      /DIREITO PROCESSUAL PENAL/gi, /DIREITO TRABALHISTA/gi, /DIREITO TRIBUTÁRIO/gi,
      /LEGISLAÇÃO/gi, /INFORMÁTICA/gi, /ATUALIDADES/gi, /CONHECIMENTOS GERAIS/gi,
      /CONHECIMENTOS ESPECÍFICOS/gi, /CONTABILIDADE/gi, /ADMINISTRAÇÃO/gi,
      /ECONOMIA/gi, /ESTATÍSTICA/gi, /INGLÊS/gi, /ESPANHOL/gi,
    ];
    padroes.forEach(p => {
      const match = texto.match(p);
      if (match) materias.add(match[0].toUpperCase().trim());
    });

    // Busca por padrões de conteúdo programático
    const linhas = texto.split('\n');
    linhas.forEach(linha => {
      if (linha.match(/^[A-Z\s]{5,40}:/) || linha.match(/^\d+\.\s+[A-Z]/)) {
        const mat = linha.replace(/[:\d.]/g, '').trim();
        if (mat.length > 4 && mat.length < 50) materias.add(mat);
      }
    });

    return [...materias].slice(0, 30);
  };

  const handleUpload = async (e) => {
    const arquivo = e.target.files[0];
    if (!arquivo) return;
    setLoading(true);
    setProgresso('Lendo o PDF...');
    setConcursoNome(arquivo.name.replace('.pdf', ''));

    try {
      setProgresso('Extraindo texto...');
      const texto = await extrairTexto(arquivo);

      setProgresso('Identificando matérias...');
      const materias = extrairMaterias(texto);

      setMateriasExtraidas(materias);
      setSelecionadas(materias);
      setEditalAtual({ nome: arquivo.name, texto: texto.slice(0, 5000) });
      setModal(true);
    } catch (err) {
      alert('Erro ao processar o PDF. Tente novamente.');
    }

    setLoading(false);
    setProgresso('');
    e.target.value = '';
  };

  const salvarEdital = async () => {
    if (!concursoNome) return;
    await addDoc(collection(db, 'editais'), {
      userId: user.uid,
      nome: concursoNome,
      arquivo: editalAtual.nome,
      materias: selecionadas,
      texto: editalAtual.texto,
      criadoEm: serverTimestamp()
    });
    setModal(false);
  };

  const toggleMateria = (mat) => {
    setSelecionadas(s => s.includes(mat) ? s.filter(m => m !== mat) : [...s, mat]);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
          Editais
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
          Importe editais em PDF e extraia as matérias automaticamente
        </p>
      </div>

      {/* Botão upload */}
      <label style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'var(--accent)', color: '#fff',
        padding: '9px 18px', borderRadius: 8, fontSize: 13,
        fontWeight: 500, cursor: 'pointer', marginBottom: 24
      }}>
        {loading ? `⏳ ${progresso}` : '📄 Importar edital PDF'}
        <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} disabled={loading} />
      </label>

      {/* Lista de editais */}
      {editais.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '0.5px dashed var(--border2)',
          borderRadius: 12, padding: '3rem', textAlign: 'center'
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📄</div>
          <div style={{ fontSize: 14, color: 'var(--text2)' }}>Nenhum edital importado ainda</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
            Clique em "Importar edital PDF" para começar
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {editais.map(e => (
            <div key={e.id} style={{
              background: 'var(--surface)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{e.nome}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{e.arquivo}</div>
                </div>
                <button onClick={() => deleteDoc(doc(db, 'editais', e.id))} style={{
                  background: 'none', border: 'none', color: 'var(--text3)',
                  fontSize: 18, cursor: 'pointer', padding: '0 4px'
                }}>×</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                {e.materias?.slice(0, 6).map((m, i) => (
                  <span key={i} style={{
                    fontSize: 10, background: 'var(--accent-soft)', color: 'var(--accent2)',
                    padding: '2px 7px', borderRadius: 10
                  }}>{m}</span>
                ))}
                {e.materias?.length > 6 && (
                  <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{e.materias.length - 6} matérias</span>
                )}
              </div>
              {e.texto && (
                <details style={{ fontSize: 12, color: 'var(--text3)' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--accent2)' }}>Ver trecho do edital</summary>
                  <div style={{
                    marginTop: 8, padding: 10, background: 'var(--bg3)',
                    borderRadius: 6, maxHeight: 200, overflowY: 'auto',
                    fontSize: 11, lineHeight: 1.6, whiteSpace: 'pre-wrap'
                  }}>
                    {e.texto}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal matérias extraídas */}
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">📄 Matérias identificadas</div>

            <div className="form-group">
              <label className="form-label">Nome do concurso</label>
              <input className="form-input" value={concursoNome}
                onChange={e => setConcursoNome(e.target.value)}
                placeholder="Ex: TJ-CE 2026" />
            </div>

            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
              Selecione as matérias que deseja salvar:
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 16 }}>
              {materiasExtraidas.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text3)', padding: '1rem', textAlign: 'center' }}>
                  Nenhuma matéria identificada automaticamente.
                  <br />O edital será salvo para consulta.
                </div>
              ) : materiasExtraidas.map((m, i) => (
                <div key={i} onClick={() => toggleMateria(m)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                  background: selecionadas.includes(m) ? 'var(--accent-soft)' : 'transparent',
                  marginBottom: 4, transition: 'background 0.15s'
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

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={salvarEdital} disabled={!concursoNome}>
                💾 Salvar edital
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}