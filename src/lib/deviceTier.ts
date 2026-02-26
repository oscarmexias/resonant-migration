// Device tier detection — determines which art engine to use
// 'mobile'  → optimized shader, minimal passes, DPR capped at 1.5
// 'desktop' → full WebGL, particle layer, higher complexity, DPR capped at 2.0

export type DeviceTier = 'mobile' | 'desktop'

export function detectDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'mobile' // SSR default

  // Primary: pointer type — 'coarse' = touch device, 'fine' = mouse
  const hasCoarsePointer  = window.matchMedia('(pointer: coarse)').matches
  const hasHoverCapability = window.matchMedia('(hover: hover)').matches

  // Secondary: screen width + CPU cores (rough proxy for device power)
  const isNarrow  = window.innerWidth < 1024
  const isLowPower = navigator.hardwareConcurrency <= 4

  if (hasCoarsePointer && !hasHoverCapability) return 'mobile'
  if (isNarrow && isLowPower) return 'mobile'

  return 'desktop'
}

// Optimal pixel ratio per tier — prevents GPU overload on high-DPI screens
export function getOptimalPixelRatio(tier: DeviceTier): number {
  const native = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  const cap = tier === 'mobile' ? 1.5 : 2.0
  return Math.min(native, cap)
}
