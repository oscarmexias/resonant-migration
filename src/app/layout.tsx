import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
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

        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WN2HNWS6');`,
          }}
        />
      </head>
      <body>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WN2HNWS6"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>

        <a href="#generation" className="skip-link">
          Saltar a generación
        </a>
        {children}
      </body>
    </html>
  )
}
