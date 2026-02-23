import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'El Ojo — Resonant Migration',
  description: 'A vision of the world at your coordinates. At this exact moment.',
  openGraph: {
    title: 'El Ojo — Resonant Migration',
    description: 'Six signals. One vision. Yours to keep.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'El Ojo — Resonant Migration',
    description: 'Six signals. One vision. Yours to keep.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,   // prevents iOS auto-zoom on input focus from shifting canvas
  themeColor: '#080808',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        {/* Preconnect to external origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://nominatim.openstreetmap.org" />
        <link rel="preconnect" href="https://en.wikipedia.org" />
      </head>
      <body>
        <a href="#generation" className="skip-link">
          Saltar a generación
        </a>
        {children}
      </body>
    </html>
  )
}
