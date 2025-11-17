import { useEffect, useState } from 'react';
import { Opportunity } from '../types/opportunity';
import { getOpportunities } from '../services/opportunitiesService';

export function useOpportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getOpportunities()
      .then((data) => {
        if (!isMounted) return;
        setOpportunities(data);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Erro ao carregar oportunidades');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { opportunities, isLoading, error };
}
