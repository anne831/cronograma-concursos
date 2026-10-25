import { useState, useCallback } from 'react';
import { showToast } from '../components/Toast';

export default function useFeedback() {
  const [loading, setLoading] = useState(false);

  const withLoading = useCallback(async (fn, message = 'Salvando...') => {
    setLoading(true);
    try {
      const result = await fn();
      showToast('Salvo com sucesso!');
      return result;
    } catch (err) {
      showToast('Erro ao salvar');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, withLoading };
}
