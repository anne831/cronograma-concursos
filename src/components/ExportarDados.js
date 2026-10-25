import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getConcursos, getSessoes, getTopicos, getRevisoes, getHoras, getQuestoes, getResultados, getAnotacoes } from '../firebase/services';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportarDados({ onClose }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formato, setFormato] = useState('json');

  const exportar = async () => {
    setLoading(true);
    try {
      // Coletar todos os dados
      const dados = {
        concursos: await carregar('concursos', getConcursos),
        sessoes: await carregar('sessoes', getSessoes),
        topicos: await carregar('topicos', getTopicos),
        revisoes: await carregar('revisoes', getRevisoes),
        horas: await carregar('horas', getHoras),
        questoes: await carregar('questoes', getQuestoes),
        simulados: await carregar('resultados', getResultados),
        anotacoes: await carregar('anotacoes', getAnotacoes),
      };

      const timestamp = new Date().toISOString().split('T')[0];
      const nomeArquivo = `cronograma-concursos_${timestamp}`;

      if (formato === 'json') {
        const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${nomeArquivo}.json`);
      } else {
        // CSV: combinar todas as coleções em um arquivo
        const csv = converterParaCSV(dados);
        const blob = new Blob([csv], { type: 'text/csv' });
        downloadBlob(blob, `${nomeArquivo}.csv`);
      }
    } catch (err) {
      console.error('Erro ao exportar:', err);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const carregar = (colecao, fn) => {
    return new Promise((resolve) => {
      fn(user.uid, (items) => resolve(items));
    });
  };

  const downloadBlob = (blob, nome) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nome;
    a.click();
    URL.revokeObjectURL(url);
  };

  const converterParaCSV = (dados) => {
    const linhas = [];
    const dataAtual = new Date().toISOString().split('T')[0];
    
    for (const [colecao, items] of Object.entries(dados)) {
      if (!items || items.length === 0) continue;
      
      linhas.push(`\n=== ${colecao.toUpperCase()} ===`);
      linhas.push(`Exportado em: ${dataAtual}`);
      
      const headers = Object.keys(items[0]).filter(k => k !== 'id' && k !== 'userId');
      linhas.push(headers.join(';'));
      
      items.forEach(item => {
        const valores = headers.map(h => {
          const val = item[h];
          if (val === null || val === undefined) return '';
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val).replace(/;/g, ',');
        });
        linhas.push(valores.join(';'));
      });
    }
    
    return linhas.join('\n');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">📥 Exportar dados</div>
        
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem' }}>
          Baixe todos os seus dados em um arquivo para backup ou migração.
        </p>

        <div className="form-group">
          <label className="form-label">Formato</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFormato('json')}
              className={`btn ${formato === 'json' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
            >
              <FileJson size={16} /> JSON
            </button>
            <button
              onClick={() => setFormato('csv')}
              className={`btn ${formato === 'csv' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1 }}
            >
              <FileSpreadsheet size={16} /> CSV
            </button>
          </div>
        </div>

        <div style={{
          background: 'var(--bg3)',
          borderRadius: 8,
          padding: '12px',
          fontSize: 12,
          color: 'var(--text2)',
          marginBottom: '1rem'
        }}>
          <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>
            📋 O que será exportado:
          </strong>
          • Concursos cadastrados<br />
          • Sessões de estudo<br />
          • Tópicos e revisões<br />
          • Horas estudadas<br />
          • Questões e simulados<br />
          • Anotações
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-primary"
            onClick={exportar}
            disabled={loading}
          >
            <Download size={16} />
            {loading ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
      </div>
    </div>
  );
}
