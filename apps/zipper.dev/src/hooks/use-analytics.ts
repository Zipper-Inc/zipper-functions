import { useEffect, useState } from 'react';
import { AnalyticsBrowser } from '@june-so/analytics-next';

export function useAnalytics() {
  const writeKey = process.env.NEXT_PUBLIC_JUNE_WRITE_KEY!;
  const [analytics, setAnalytics] = useState<AnalyticsBrowser>();

  useEffect(() => {
    const loadAnalytics = async () => {
      const response = AnalyticsBrowser.load({
        writeKey,
      });
      setAnalytics(response);
    };
    loadAnalytics();
  }, [writeKey]);

  return analytics;
}
