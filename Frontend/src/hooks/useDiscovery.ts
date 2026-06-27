import { useState, useCallback } from 'react';
import { discoveryService } from '../services/discovery';
import { DiscoveryResult } from '../types/backend';

export const useDiscovery = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DiscoveryResult | null>(null);

  const startDiscovery = useCallback(async (url: string): Promise<DiscoveryResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await discoveryService.discover(url);
      setData(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Discovery connection failed.';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    data,
    startDiscovery,
  };
};
