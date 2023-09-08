import { useEffect, useState } from 'react';
import { AnalyticsBrowser } from '@june-so/analytics-next';

export function useAnalytics() {
  const writeKey = 'ilDYCR6UTQL6mcc5';
  const [analytics, setAnalytics] = useState<AnalyticsBrowser | null>(null);

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
