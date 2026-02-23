'use client'

import { useState, useEffect } from 'react'
import { useIsMobile } from '@/lib/useIsMobile'

// Shows a subtle "rotate to landscape" nudge in portrait mode on mobile.
// Auto-dismisses after 5 s; user can also tap to dismiss permanently in the session.
export default function LandscapeHint() {
  const isMobile = useIsMobile()
  const [portrait, setPortrait] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!isMobile) return
    const check = () => {
      setPortrait(window.innerHeight > window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [isMobile])

  // Show after a short delay; auto-dismiss after 5 s
  useEffect(() => {
    if (!portrait || dismissed || !isMobile) { setVisible(false); return }
    const show = setTimeout(() => setVisible(true), 1200)
    const hide = setTimeout(() => setVisible(false), 6200)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [portrait, dismissed, isMobile])

  if (!visible) return null

  return (
    <button
      onClick={() => { setDismissed(true); setVisible(false) }}
      aria-label="Rotar a horizontal para mejor experiencia"
      style={{
        position:        'fixed',
        top:             '50%',
        left:            '50%',
        transform:       'translate(-50%, -50%)',
        zIndex:          60,
        background:      'rgba(4,4,14,0.88)',
        border:          '1px solid rgba(255,255,255,0.12)',
        backdropFilter:  'blur(14px)',
        color:           'rgba(255,255,255,0.55)',
        fontFamily:      'var(--font-mono)',
        fontSize:        '8px',
        letterSpacing:   '0.25em',
        padding:         '14px 22px',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        gap:             '10px',
        cursor:          'pointer',
        animation:       'fadeInOut 5s ease forwards',
        pointerEvents:   'auto',
      }}
    >
      {/* Phone rotate icon */}
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true"
        style={{ animation: 'rotateHint 1.8s ease-in-out infinite' }}>
        <rect x="8" y="4" width="12" height="20" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="14" cy="20" r="1.2" fill="currentColor"/>
        {/* arrow arc */}
        <path d="M4 14 C4 7.4 9.4 2 16 2" stroke="rgba(255,255,255,0.35)" strokeWidth="1" fill="none" strokeDasharray="3 2"/>
        <path d="M16 2 L18.5 4.5 M16 2 L13.5 4.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinecap="round"/>
      </svg>
      GIRAR HORIZONTAL
      <span style={{ fontSize: '7px', opacity: 0.4, letterSpacing: '0.15em' }}>
        EL OJO VIVE EN PAISAJE
      </span>
    </button>
  )
}
