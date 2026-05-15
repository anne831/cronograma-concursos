import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getConcursos } from './firebase/services';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import GradeSemanal from './components/GradeSemanal';
import Progresso from './components/Progresso';
import Revisao from './components/Revisao';
import Topicos from './components/Topicos';
import Concursos from './components/Concursos';
import './styles/global.css';

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState('grade');
  const [concursos, setConcursos] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    return getConcursos(user.uid, setConcursos);
  }, [user]);

  if (!user) return <Auth />;

  const views = {
    grade: <GradeSemanal concursos={concursos} />,
    progresso: <Progresso />,
    revisao: <Revisao concursos={concursos} />,
    topicos: <Topicos concursos={concursos} />,
    concursos: <Concursos />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile header */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
        display: 'none'
      }} className="mobile-header">
        <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', color: 'var(--text)', fontSize: 20, padding: 4 }}>
          ☰
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16 }}>📚 Cronograma</span>
      </div>

      {/* Sidebar */}
      <div style={{ display: 'flex' }} className="hide-mobile">
        <Sidebar active={view} onChange={setView} />
      </div>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '100%' }}>
        {views[view]}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .mobile-header { display: flex !important; }
          main { padding: 5rem 1rem 1rem !important; }
        }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
