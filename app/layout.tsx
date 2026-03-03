import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Samadhi — Sales-to-Product Intelligence',
  description: 'Capture customer feedback from sales calls, attach revenue weight, and surface prioritized product intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
