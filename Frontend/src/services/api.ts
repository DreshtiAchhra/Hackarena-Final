import axios from 'axios';
import { 
  mockMetadata, 
  mockIssues, 
  mockJourney, 
  mockHistory 
} from '../mock/auditData';
import { AuditReport, AuditHistoryItem, WebsiteMetadata } from '../types';

// Setup API Client with base URL (can be customized via environment variables later)
const API_BASE_URL = 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// For development, we toggle local simulation.
// In production, when the backend is ready, set this to false.
const USE_MOCK_DELAY = true;
const simulateDelay = <T>(data: T, delayMs = 600): Promise<T> => {
  return new Promise((resolve) => {
    if (USE_MOCK_DELAY) {
      setTimeout(() => resolve(data), delayMs);
    } else {
      resolve(data);
    }
  });
};

export const auditService = {
  /**
   * Triggers initial website mapping and discovery.
   */
  async discover(url: string): Promise<{ success: boolean; url: string; pagesFound: number }> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay({ success: true, url, pagesFound: mockMetadata.totalPages });
      }
      const response = await apiClient.post('/discover', { url });
      return response.data;
    } catch (error) {
      console.warn('API connection failed, falling back to mock values.');
      return simulateDelay({ success: true, url, pagesFound: mockMetadata.totalPages });
    }
  },

  /**
   * Dispatches the browser agent to analyze interactions.
   */
  async runBrowserAgent(url: string): Promise<{ success: boolean; journeysTraced: number }> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay({ success: true, journeysTraced: mockJourney.length });
      }
      const response = await apiClient.post('/browser-agent', { url });
      return response.data;
    } catch (error) {
      return simulateDelay({ success: true, journeysTraced: mockJourney.length });
    }
  },

  /**
   * Invokes Google Lighthouse for metrics testing.
   */
  async runLighthouse(url: string): Promise<{ success: boolean; score: number }> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay({ success: true, score: mockMetadata.performanceScore });
      }
      const response = await apiClient.post('/lighthouse', { url });
      return response.data;
    } catch (error) {
      return simulateDelay({ success: true, score: mockMetadata.performanceScore });
    }
  },

  /**
   * Initiates comprehensive LLM UX heuristics review.
   */
  async runUXAnalysis(url: string): Promise<{ success: boolean; issuesAnalyzed: number }> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay({ success: true, issuesAnalyzed: mockIssues.length });
      }
      const response = await apiClient.post('/analysis', { url });
      return response.data;
    } catch (error) {
      return simulateDelay({ success: true, issuesAnalyzed: mockIssues.length });
    }
  },

  /**
   * Pulls the completed audit report.
   */
  async getReport(url: string): Promise<AuditReport> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay({
          metadata: { ...mockMetadata, url },
          issues: mockIssues,
          journey: mockJourney
        });
      }
      const response = await apiClient.get('/report', { params: { url } });
      return response.data;
    } catch (error) {
      return simulateDelay({
        metadata: { ...mockMetadata, url },
        issues: mockIssues,
        journey: mockJourney
      });
    }
  },

  /**
   * Fetches dashboard audit history logs.
   */
  async getHistory(): Promise<AuditHistoryItem[]> {
    try {
      if (USE_MOCK_DELAY) {
        return simulateDelay(mockHistory);
      }
      const response = await apiClient.get('/history');
      return response.data;
    } catch (error) {
      return simulateDelay(mockHistory);
    }
  }
};
