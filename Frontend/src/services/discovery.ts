import apiClient from './api';
import { DiscoveryResult } from '../types/backend';

export const discoveryService = {
  /**
   * Queries the backend discovery module to crawl pages and fetch sitemaps.
   */
  async discover(url: string): Promise<DiscoveryResult> {
    const response = await apiClient.post<DiscoveryResult>('/api/v1/discover', { url });
    return response.data;
  }
};
