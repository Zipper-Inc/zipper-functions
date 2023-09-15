import { Analytics } from '@june-so/analytics-node';

export async function getAnalytics() {
  // Instantiate AnalyticsNode:
  const analytics = new Analytics(process.env.NEXT_PUBLIC_JUNE_WRITE_KEY!);
  return analytics;
}

export type { Analytics } from '@june-so/analytics-next';
