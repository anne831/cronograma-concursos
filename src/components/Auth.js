import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'signup') await signup(form.email, form.password, form.name);
      else await login(form.email, form.password);
    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'E-mail não encontrado.',
        'auth/wrong-password': 'Senha incorreta.',
        'auth/email-already-in-use': 'E-mail já cadastrado.',
        'auth/weak-password': 'Senha deve ter ao menos 6 caracteres.',
        'auth/invalid-email': 'E-mail inválido.',
      };
      setError(msgs[err.code] || 'Ocorreu um erro. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.12) 0%, transparent 60%), var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: 24
          }}>🎯📚</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
            Cronograma<br />
            <span style={{ color: 'var(--accent2)' }}>de Concursos</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8 }}>
            Organize seus estudos para múltiplos concursos
          </p>
        </div>

        <div className="card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: '1.5rem', background: 'var(--bg3)', borderRadius: 10, padding: 4 }}>
            {['login', 'signup'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 500,
                background: mode === m ? 'var(--surface2)' : 'transparent',
                color: mode === m ? 'var(--text)' : 'var(--text2)',
                transition: 'var(--transition)'
              }}>
                {m === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Nome completo</label>
                <input name="name" value={form.name} onChange={handle} required
                  className="form-input" placeholder="Seu nome" />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input name="email" type="email" value={form.email} onChange={handle} required
                className="form-input" placeholder="seu@email.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Senha</label>
              <input name="password" type="password" value={form.password} onChange={handle} required
                className="form-input" placeholder="••••••••" minLength={6} />
            </div>
            {error && (
              <div style={{ background: 'var(--red-soft)', border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: 4 }} disabled={loading}>
              {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
