import { NextResponse } from 'next/server'

// Phase B placeholder — AI generation via Replicate (FLUX / Stable Diffusion)
// Intentionally minimal in Phase A

export async function POST() {
  if (!process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { error: 'AI generation not yet available. Coming in Phase B.' },
      { status: 503 }
    )
  }

  // Phase B implementation:
  // 1. Parse WorldState from body
  // 2. Build structured prompt from WorldState
  // 3. Call Replicate API (server-side — key never in client)
  // 4. Return generated image URL

  return NextResponse.json({ error: 'Phase B not yet implemented' }, { status: 501 })
}
