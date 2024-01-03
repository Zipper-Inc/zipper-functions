import '@zipper/ui/src/globals.css';

import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import Header from './components/header';

import { TRPCReactProvider } from '~/server/react';
import SessionProvider from './components/SessionProvider';

import { getServerAuthSession } from '../pages/api/auth/[...nextauth]';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();

  return (
    <html lang="en">
      <body className={`font-body ${inter.variable}`}>
        <Providers>
          <TRPCReactProvider cookies={cookies().toString()}>
            <SessionProvider session={session}>
              <Header />
              {children}
            </SessionProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
