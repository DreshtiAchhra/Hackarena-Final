export interface UXIssue {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'accessibility' | 'usability' | 'performance' | 'seo';
  evidence: string;
  recommendation: string;
  pageUrl: string;
  screenshotPlaceholder: string; // CSS styling / visual tag for screenshot thumbnail
}

export interface JourneyStep {
  id: string;
  name: string;
  path: string;
  score: number;
  issuesCount: {
    critical: number;
    warning: number;
    info: number;
  };
  status: 'passed' | 'warning' | 'failed';
  connections: string[]; // next step IDs
}

export interface WebsiteMetadata {
  url: string;
  totalPages: number;
  auditTime: string;
  coverage: string;
  accessibilityScore: number;
  uxScore: number;
  performanceScore: number;
  seoScore: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export interface AuditReport {
  metadata: WebsiteMetadata;
  issues: UXIssue[];
  journey: JourneyStep[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedAction?: {
    type: 'navigate' | 'filter';
    target: string;
    label: string;
  };
}

export interface AuditHistoryItem {
  id: string;
  url: string;
  date: string;
  pagesCount: number;
  score: number;
}
