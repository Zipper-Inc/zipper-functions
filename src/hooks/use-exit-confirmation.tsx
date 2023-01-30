// Solution based on: https://github.com/vercel/next.js/discussions/32231#discussioncomment-4110807
// This is a custom hook that can be used to show a confirmation dialog when the user tries to leave the page.
// It's janky because NextJs doesn't support this out of the box.

import { useRouter } from 'next/router';
import { useEffect, useRef } from 'react';

export function useExitConfirmation({
  message,
  enable,
  ignorePaths,
}: {
  message?: string;
  enable: boolean;
  ignorePaths?: string[];
}) {
  const router = useRouter();
  const bypassConfirmationRef = useRef(false);

  message =
    message ??
    'Your changes have not been saved. Are you sure you want to leave this page?';
  useEffect(() => {
    const shouldByPassconfimation = () =>
      !enable || bypassConfirmationRef.current;
    const handleWindowClose = (e: BeforeUnloadEvent) => {
      if (shouldByPassconfimation()) return;
      e.preventDefault();
      return (e.returnValue = message);
    };
    const handleBrowseAway = (newPath: string) => {
      if (
        shouldByPassconfimation() ||
        ignorePaths?.find((ignorePath) => newPath.includes(ignorePath))
      )
        return;
      if (window.confirm(message)) return;
      router.events.emit('routeChangeError');
      throw 'routeChange aborted by user.';
    };
    window.addEventListener('beforeunload', handleWindowClose);
    router.events.on('routeChangeStart', handleBrowseAway);
    return () => {
      window.removeEventListener('beforeunload', handleWindowClose);
      router.events.off('routeChangeStart', handleBrowseAway);
    };
  }, [enable, router.events, message]);

  return {
    bypassExitConfirmation(value = true) {
      bypassConfirmationRef.current = value;
    },
  };
}
