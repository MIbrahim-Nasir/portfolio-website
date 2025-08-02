import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mohammed Ibrahim Nasir - Portfolio',
  description:
    'Software Engineer & Engineering Innovator. Passionate about AI, Robotics, Full-Stack Development, and Leadership in Technology.',
  keywords:
    'Software Engineer, Full Stack Developer, AI, Robotics, React, Next.js, TypeScript, C#, .NET, Machine Learning, Arduino, TSIG, DeltaX',
  authors: [{ name: 'Mohammed Ibrahim Nasir' }],
  creator: 'Mohammed Ibrahim Nasir',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ibrahim-nasir.vercel.app',
    title: 'Mohammed Ibrahim Nasir - Portfolio',
    description:
      'Software Engineer & Engineering Innovator specializing in AI, Robotics, and Full-Stack Development.',
    siteName: 'Ibrahim Nasir Portfolio',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mohammed Ibrahim Nasir - Portfolio',
    description:
      'Software Engineer & Engineering Innovator specializing in AI, Robotics, and Full-Stack Development.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
