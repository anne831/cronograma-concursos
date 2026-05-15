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
      <div className="hide-mobile">
        <Sidebar active={view} onChange={setView} />
      </div>
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '100%' }}>
        {views[view]}
      </main>
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