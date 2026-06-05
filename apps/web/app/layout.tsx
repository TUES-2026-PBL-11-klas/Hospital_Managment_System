import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MediNest — Hospital Management System',
  description: 'AI-powered hospital records and pharmacy management',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bg">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
