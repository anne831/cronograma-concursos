import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { getConcursos } from './firebase/services';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import GradeSemanal from './components/GradeSemanal';
import Revisao from './components/Revisao';
import Topicos from './components/Topicos';
import Simulado from './components/Simulado';
import Concursos from './components/Concursos';
import Notificacoes from './components/Notificacoes';
import './styles/global.css';

function AppContent() {
  const { user } = useAuth();
  const [view, setView] = useState('dashboard');
  const [concursos, setConcursos] = useState([]);
  const [simuladoAlvo, setSimuladoAlvo] = useState(null);

  useEffect(() => {
    if (!user) return;
    return getConcursos(user.uid, setConcursos);
  }, [user]);

  if (!user) return <Auth />;

  // Navegação normal (menu / acesso rápido): limpa qualquer alvo de simulado pendente
  const navegar = (v) => { setSimuladoAlvo(null); setView(v); };

  // Deep-link: vai pro Simulado já com a matéria escolhida
  const irParaSimulado = (concurso, materia) => {
    setSimuladoAlvo({ concurso, materia });
    setView('simulado');
  };

  const views = {
    dashboard: <Dashboard concursos={concursos} onNavigate={navegar} />,
    grade: <GradeSemanal concursos={concursos} />,
    revisao: <Revisao concursos={concursos} />,
    topicos: <Topicos concursos={concursos} onIrSimulado={irParaSimulado} />,
    simulado: <Simulado concursos={concursos} alvo={simuladoAlvo} />,
    concursos: <Concursos />,
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Notificacoes />
      <div className="hide-mobile">
        <Sidebar active={view} onChange={navegar} />
      </div>
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '2rem', width: '100%', minWidth: 0, height: '100vh' }}>
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