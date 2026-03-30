import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clairio — Revenue-Weighted Product Intelligence',
  description: 'Capture customer feedback from sales calls, attach revenue weight, and surface prioritized product intelligence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300&family=DM+Mono:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
