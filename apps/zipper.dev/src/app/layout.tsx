import '@zipper/ui/src/globals.css';

import { Inter } from 'next/font/google';
import { cookies } from 'next/headers';
import Header from '~/components/app-dir/layouts/header';

import { TRPCReactProvider } from '~/server/react';
import SessionProvider from '~/components/app-dir/SessionProvider';

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
              <main className="flex flex-1 flex-col">
                <Header />
                {children}
              </main>
            </SessionProvider>
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
