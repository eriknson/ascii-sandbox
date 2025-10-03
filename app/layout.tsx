import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ASCII Emoji Animator',
  description: 'Dynamic ASCII emoji animation with 3D rotation and effects',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const theme = isDark ? 'dark' : 'light';
                  const bgColor = isDark ? '#000000' : '#FFFFFF';
                  document.documentElement.setAttribute('data-theme', theme);
                  document.documentElement.style.backgroundColor = bgColor;
                  document.body.setAttribute('data-theme', theme);
                  document.body.style.backgroundColor = bgColor;
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

