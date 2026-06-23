import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Icestasy Ops',
  description: 'Kitchen and factory operations for Icestasy',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-orange-50 min-h-screen`}>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '16px', maxWidth: '400px' },
            success: { style: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' } },
            error: { style: { background: '#fef2f2', color: '#991b1b', border: '1px solid #fca5a5' }, duration: 6000 },
          }}
        />
      </body>
    </html>
  );
}
