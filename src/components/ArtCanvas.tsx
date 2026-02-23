'use client'

// SSR-safe wrapper — imported via dynamic(ssr:false) from page.tsx
// The actual rendering logic lives in ArtCanvasInner.tsx

import ArtCanvasInner from './ArtCanvasInner'

export default function ArtCanvas() {
  return <ArtCanvasInner />
}
