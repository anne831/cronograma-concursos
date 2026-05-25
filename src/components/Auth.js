import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';

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

  const loginGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Erro ao entrar com Google. Tente novamente.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '1rem',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(108,99,255,0.12) 0%, transparent 60%), var(--bg)'
    }}>
     <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--accent-soft)', border: '1px solid rgba(108,99,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', fontSize: 24
          }}>🎯📚</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            Cronograma<br />
            <span style={{ color: 'var(--accent2)' }}>de Concursos</span>
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 8 }}>
            Organize seus estudos para múltiplos concursos
          </p>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Botão Google */}
          <button onClick={loginGoogle} disabled={loading} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '10px', borderRadius: 8, border: '0.5px solid var(--border2)',
            background: 'var(--bg3)', color: 'var(--text)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', marginBottom: 16, transition: 'var(--transition)'
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>ou</span>
            <div style={{ flex: 1, height: '0.5px', background: 'var(--border)' }} />
          </div>

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