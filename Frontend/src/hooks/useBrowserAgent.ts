import { useState, useCallback } from 'react';
import { browserService } from '../services/browser';
import { BrowserAgentResult } from '../types/backend';

export const useBrowserAgent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BrowserAgentResult | null>(null);

  const startBrowserCapture = useCallback(async (urls: string[]): Promise<BrowserAgentResult | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await browserService.runBrowserAgent(urls);
      setData(result);
      setLoading(false);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.detail || err.message || 'Browser capture process encountered an error.';
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return {
    loading,
    error,
    data,
    startBrowserCapture,
  };
};
