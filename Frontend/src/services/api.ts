import axios from 'axios';

// The single place to configure the API base URL
export const API_BASE_URL = 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for browser agent and crawler executions
});

export default apiClient;
