import apiClient from './api';
import { BrowserAgentResult } from '../types/backend';

export const browserService = {
  /**
   * Dispatches the browser agent to capture screenshots, HTML, CSS, and titles.
   */
  async runBrowserAgent(urls: string[]): Promise<BrowserAgentResult> {
    const response = await apiClient.post<BrowserAgentResult>('/api/v1/browser-agent', { urls });
    return response.data;
  }
};
