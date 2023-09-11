import { AnalyticsNode } from '@june-so/analytics-next';

export async function getAnalytics() {
  // Instantiate AnalyticsNode:
  const [analytics] = await AnalyticsNode.load({
    writeKey: process.env.NEXT_PUBLIC_JUNE_WRITE_KEY!,
  });
  return analytics;
}

export type { Analytics } from '@june-so/analytics-next';
