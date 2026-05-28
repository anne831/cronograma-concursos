import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRevisoes } from '../firebase/services';
import { differenceInDays, parseISO } from 'date-fns';

export default function Notificacoes() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Pedir permissão
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Verificar revisões pendentes
    const unsub = getRevisoes(user.uid, (revisoes) => {
      if (Notification.permission !== 'granted') return;

      const urgentes = revisoes.filter(r => {
        try { return differenceInDays(new Date(), parseISO(r.proximaRevisao)) >= 0; }
        catch { return false; }
      });

      if (urgentes.length > 0) {
        // Verificar se já notificou hoje
        const hoje = new Date().toDateString();
        const ultimaNotif = localStorage.getItem('ultima_notif_revisao');

        if (ultimaNotif !== hoje) {
          new Notification('📚 Cronograma de Concursos', {
            body: `Você tem ${urgentes.length} revisão(ões) pendente(s) hoje!`,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
          });
          localStorage.setItem('ultima_notif_revisao', hoje);
        }
      }
    });

    return unsub;
  }, [user]);

  return null;
}