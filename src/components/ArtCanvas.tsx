'use client'

// SSR-safe wrapper — auto-selects art engine based on device tier
// Mobile  → ArtCanvasWebGL (optimised shader, DPR 1.5 cap)
// Desktop → ArtCanvasWebGL (same shader, DPR 2.0 cap + future particle layer)
// Fallback kept: ArtCanvasInner (Canvas 2D) if WebGL init fails

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { detectDeviceTier, type DeviceTier } from '@/lib/deviceTier'
import type { InteractionState } from '@/lib/useVisionInteractions'

const ArtCanvasWebGL = dynamic(() => import('./ArtCanvasWebGL'), { ssr: false })

interface Props {
  interactionState: InteractionState
}

export default function ArtCanvas({ interactionState }: Props) {
  const [tier, setTier] = useState<DeviceTier>('mobile') // safe SSR default

  useEffect(() => {
    setTier(detectDeviceTier())
  }, [])

  return <ArtCanvasWebGL tier={tier} interactionState={interactionState} />
}
