export type DiscoveryMethod = 'sitemap' | 'crawl' | 'manual';

export interface DiscoveredPage {
  url: string;
  method: DiscoveryMethod;
  depth: number;
  priority: number;
  last_modified?: string;
}

export interface DiscoveryResult {
  seed_url: string;
  pages: DiscoveredPage[];
  sitemap_found: boolean;
  crawl_used: boolean;
  total_discovered: number;
}

export interface PageCapture {
  url: string;
  status: 'ok' | 'error';
  error?: string;
  html_path?: string;
  screenshot_path?: string;
  css_path?: string;
  metadata_path?: string;
  title?: string;
  load_time_ms?: number;
  final_url?: string;
  page_height_px?: number;
}

export interface BrowserAgentResult {
  total_pages: number;
  successful: number;
  failed: number;
  output_dir: string;
  captures: PageCapture[];
}
