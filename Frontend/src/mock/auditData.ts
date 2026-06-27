import { WebsiteMetadata, UXIssue, JourneyStep, AuditHistoryItem } from '../types';

export const mockMetadata: WebsiteMetadata = {
  url: "https://www.shoppycart.io",
  totalPages: 24,
  auditTime: "4m 12s",
  coverage: "92% of dynamic paths",
  accessibilityScore: 78,
  uxScore: 68,
  performanceScore: 84,
  seoScore: 89,
  criticalCount: 14,
  warningCount: 28,
  infoCount: 19,
};

export const mockIssues: UXIssue[] = [
  {
    id: "issue-1",
    title: "Insufficient Color Contrast on Checkout Action",
    description: "The primary 'Place Order' button text (#A5B4FC) does not stand out enough against its blue-indigo backdrop (#4F46E5), leading to a contrast ratio of 3.2:1. The WCAG 2.1 AA threshold requires at least 4.5:1 for normal text.",
    severity: "critical",
    category: "accessibility",
    evidence: '<button class="bg-[#4F46E5] text-[#A5B4FC] px-8 py-3 rounded-lg font-medium">Place Order</button>',
    recommendation: "Change text color to #FFFFFF or increase contrast weight. This provides a 6.8:1 contrast ratio, which conforms to AAA recommendations.",
    pageUrl: "/checkout",
    screenshotPlaceholder: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
  },
  {
    id: "issue-2",
    title: "Missing Alt Text on Checkout Product Items",
    description: "Cart item images inside the summary component do not contain `alt` description fields. Screen readers only announce filename identifiers, disrupting users with visual impairments.",
    severity: "critical",
    category: "accessibility",
    evidence: '<img src="/assets/prod_headset_thumb.webp" class="w-12 h-12 rounded" />',
    recommendation: "Inject a short descriptive alt tag, e.g., alt='Premium Wireless Active Headset - Black Edition'. If purely decorative, assign alt=''.",
    pageUrl: "/cart",
    screenshotPlaceholder: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
  },
  {
    id: "issue-3",
    title: "Form Input Labels Lacking Explicit Binding",
    description: "Card number, Expiry Date, and CVV form inputs on the payment page use floating elements without corresponding `htmlFor` attributes or nested layout labels. Click targeting suffers, and screen readers fail to map contextual headers.",
    severity: "critical",
    category: "usability",
    evidence: '<input type="text" id="card_num" placeholder="0000 0000 0000 0000" />',
    recommendation: "Add an explicit label with matching htmlFor: <label htmlFor='card_num'>Card Number</label>. Alternatively, wrap the input within a label element.",
    pageUrl: "/checkout",
    screenshotPlaceholder: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
  },
  {
    id: "issue-4",
    title: "Small Touch Target Size on Cart Item Delete",
    description: "The 'Remove Item' bin icon triggers at just 22px x 20px. Google Lighthouse and Apple HIG mandate touch target boundaries of at least 44px x 44px (or 48px x 48px) to prevent accidental neighboring selections.",
    severity: "warning",
    category: "usability",
    evidence: '<button class="p-1 text-slate-500 hover:text-red-500"><svg class="w-4 h-4">...</svg></button>',
    recommendation: "Add padding class `p-3` (minimum 12px) to expand target hit size without changing visually rendered icon bounds.",
    pageUrl: "/cart",
    screenshotPlaceholder: "linear-gradient(135deg, #10B981 0%, #047857 100%)",
  },
  {
    id: "issue-5",
    title: "Layout Shift (CLS) on Dynamic Products Grid",
    description: "Loading high-resolution product catalog cards asynchronously causes the layout to shift downwards by 220px when the product image assets render. Cumulative Layout Shift score is 0.18 (exceeding standard 0.1 benchmark).",
    severity: "warning",
    category: "performance",
    evidence: '<div class="grid grid-cols-4 gap-4"><!-- dynamic content without aspect-ratio constraints --></div>',
    recommendation: "Provide standard aspect-ratio rules (aspect-[4/3]) or load content within animated skeleton skeletons.",
    pageUrl: "/products",
    screenshotPlaceholder: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
  },
  {
    id: "issue-6",
    title: "Missing Main Heading (H1) on Landings Grid",
    description: "The Landing page uses nested H2 and H3 structures, but contains no parent <h1>. H1 heading structure defines page purpose for crawler agents and screen readers.",
    severity: "info",
    category: "seo",
    evidence: '<div class="hero"><h2 class="text-3xl">Summer Deals</h2></div>',
    recommendation: "Adjust the top-level announcement to an <h1> header and scale styling elements via Tailwind helper configuration classes.",
    pageUrl: "/",
    screenshotPlaceholder: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
  }
];

export const mockJourney: JourneyStep[] = [
  {
    id: "j-1",
    name: "Landing Home",
    path: "/",
    score: 89,
    issuesCount: { critical: 1, warning: 3, info: 4 },
    status: "passed",
    connections: ["j-2"]
  },
  {
    id: "j-2",
    name: "Products Browse",
    path: "/products",
    score: 81,
    issuesCount: { critical: 2, warning: 5, info: 3 },
    status: "warning",
    connections: ["j-3"]
  },
  {
    id: "j-3",
    name: "Shopping Cart",
    path: "/cart",
    score: 72,
    issuesCount: { critical: 4, warning: 8, info: 5 },
    status: "failed",
    connections: ["j-4"]
  },
  {
    id: "j-4",
    name: "Checkout Gate",
    path: "/checkout",
    score: 61,
    issuesCount: { critical: 7, warning: 12, info: 7 },
    status: "failed",
    connections: []
  }
];

export const mockHistory: AuditHistoryItem[] = [
  { id: "h-1", url: "https://www.shoppycart.io", date: "2026-06-27", pagesCount: 24, score: 78 },
  { id: "h-2", url: "https://blog.travelworld.net", date: "2026-06-25", pagesCount: 12, score: 91 },
  { id: "h-3", url: "https://dashboard.cryptoflux.co", date: "2026-06-20", pagesCount: 45, score: 64 },
  { id: "h-4", url: "https://learn.codelab.edu", date: "2026-06-18", pagesCount: 8, score: 85 }
];

export const mockChartData = {
  severityDistribution: [
    { name: 'Critical', value: 14, color: '#EF4444' },
    { name: 'Warning', value: 28, color: '#F59E0B' },
    { name: 'Info', value: 19, color: '#3B82F6' },
  ],
  categoryDistribution: [
    { category: 'Accessibility', count: 18, rating: 78 },
    { category: 'Usability (Heuristics)', count: 22, rating: 68 },
    { category: 'Performance', count: 12, rating: 84 },
    { category: 'SEO Structure', count: 9, rating: 89 },
  ],
  pagesAudited: [
    { page: 'Home (/)', issues: 8, score: 89 },
    { page: 'Products (/products)', issues: 10, score: 81 },
    { page: 'Cart (/cart)', issues: 17, score: 72 },
    { page: 'Checkout (/checkout)', issues: 26, score: 61 },
  ],
  journeyCompletion: [
    { stage: 'Home', dropoff: 0, users: 1000 },
    { stage: 'Browse', dropoff: 25, users: 750 },
    { stage: 'Cart', dropoff: 62, users: 380 },
    { stage: 'Checkout', dropoff: 82, users: 180 },
  ]
};

export const mockChatResponses: Record<string, { reply: string; data?: any }> = {
  "Why is Checkout page bad?": {
    reply: "The Checkout page contains the lowest score (**61/100**) across your entire user journey. Our pipeline identified 7 critical violations on this page: \n\n1. **Color Contrast**: Primary inputs and submit actions fail WCAG 2.1 AA thresholds (ratio 3.2:1).\n2. **Missing Labels**: The billing/payment fields lack target element indicators (`id`/`htmlFor`).\n3. **Keyboard Trap**: Users navigating with Tab keys are trapped inside the promo-code widget.\n\nFixing these elements will improve checkout completion rates by an estimated 15-22%.",
  },
  "Show all accessibility issues.": {
    reply: "Here are the top accessibility issues identified across the domain:\n\n* **Insufficient Color Contrast** (Critical) - Found on `/checkout` (Place Order button).\n* **Missing Alt Text on Images** (Critical) - Found on `/cart` (cart item list thumbnail).\n* **Form Input Labels Lacking Explicit Binding** (Critical) - Found on `/checkout` (inputs for payment fields).\n* **Non-conforming Focus Indicators** (Warning) - Found on `/products` (pagination triggers).\n\nWould you like me to generate standard react-tailwind code templates to fix these?",
  },
  "Which page has highest severity?": {
    reply: "The page with the highest severity score and count of critical failures is `/checkout` with **7 critical violations** and **12 warnings**, followed closely by the Shopping Cart page (`/cart`) with **4 critical violations**.",
  },
  "How do I improve navigation?": {
    reply: "Based on our Usability Audit heuristics, you can improve navigation via three key changes:\n\n1. **Increase touch target margins** on the cart toggle and card delete actions (currently 22px; increase to 44px minimum).\n2. **Provide visual breadcrumbs** on product detailed sub-routes.\n3. **Support Escape key actions** for collapsing filters on mobile layouts.",
  }
};
