import { useState, useEffect, useCallback } from 'react';
import { timelineService, type BackendEmployee } from '@/services/timeline';

interface UseEmployeesParams {
  localId: string;
  enabled?: boolean;
}

interface UseEmployeesReturn {
  employees: BackendEmployee[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useEmployees({ localId, enabled = true }: UseEmployeesParams): UseEmployeesReturn {
  const [employees, setEmployees] = useState<BackendEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    if (!enabled || !localId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await timelineService.getEmployees(localId);
      setEmployees(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar empleados';
      setError(message);
      console.error('Employees fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [localId, enabled]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  return { employees, isLoading, error, refetch: fetchEmployees };
}
