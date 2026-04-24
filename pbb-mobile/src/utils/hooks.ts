import { useState, useEffect, useCallback } from 'react';
import { joinServerUrl } from './server';

export interface HealthStatus {
  server: boolean;
  database: boolean;
  bapenda: boolean;
  loading: boolean;
}

export function useServerHealth(serverUrl: string | undefined) {
  const [health, setHealth] = useState<HealthStatus>({
    server: true,
    database: true,
    bapenda: true,
    loading: true,
  });

  const checkHealth = useCallback(async () => {
    if (!serverUrl) return;
    try {
      const response = await fetch(joinServerUrl(serverUrl, '/api/mobile/health'));
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.status) {
          setHealth({
            server: true,
            database: data.status.database,
            bapenda: data.status.bapenda,
            loading: false,
          });
          return;
        }
      }
      // If server responds but success is false or status is missing
      setHealth({ server: false, database: false, bapenda: false, loading: false });
    } catch (e) {
      // If fetch fails (network error, 502, etc)
      setHealth({ server: false, database: false, bapenda: false, loading: false });
    }
  }, [serverUrl]);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkHealth]);

  return { health, checkHealth };
}
