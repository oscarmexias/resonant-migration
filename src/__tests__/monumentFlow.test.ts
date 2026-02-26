import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStateStore } from '@/store/worldState'
import type { SignalState } from '@/types/worldstate'

beforeEach(() => {
  useWorldStateStore.getState().reset()
})

// Helper: returns true when all 6 signals are 'success'
function allSignalsSuccess(signals: SignalState): boolean {
  return (
    signals.clima === 'success' &&
    signals.eventos === 'success' &&
    signals.cosmos === 'success' &&
    signals.economia === 'success' &&
    signals.atencion === 'success' &&
    signals.tierra === 'success'
  )
}

describe('monumentFlow — signal completion gate', () => {
  it('when all 6 signals are success, allSignalsSuccess returns true', () => {
    const { setSignalStatus } = useWorldStateStore.getState()

    setSignalStatus('clima', 'success')
    setSignalStatus('eventos', 'success')
    setSignalStatus('cosmos', 'success')
    setSignalStatus('economia', 'success')
    setSignalStatus('atencion', 'success')
    setSignalStatus('tierra', 'success')

    const { signals } = useWorldStateStore.getState()
    expect(allSignalsSuccess(signals)).toBe(true)
  })

  it('allSignalsSuccess returns false when any signal is not success', () => {
    const { setSignalStatus } = useWorldStateStore.getState()

    setSignalStatus('clima', 'success')
    setSignalStatus('eventos', 'success')
    setSignalStatus('cosmos', 'success')
    setSignalStatus('economia', 'success')
    setSignalStatus('atencion', 'success')
    // tierra remains 'idle'

    const { signals } = useWorldStateStore.getState()
    expect(allSignalsSuccess(signals)).toBe(false)
  })

  it('allSignalsSuccess returns false if any signal has error status', () => {
    const { setSignalStatus } = useWorldStateStore.getState()

    setSignalStatus('clima', 'success')
    setSignalStatus('eventos', 'success')
    setSignalStatus('cosmos', 'success')
    setSignalStatus('economia', 'error')   // one failed
    setSignalStatus('atencion', 'success')
    setSignalStatus('tierra', 'success')

    const { signals } = useWorldStateStore.getState()
    expect(allSignalsSuccess(signals)).toBe(false)
  })

  it('monumentData being null does not block signals from reaching success', () => {
    const { setSignalStatus } = useWorldStateStore.getState()

    // monumentData starts null (no monument fetched)
    expect(useWorldStateStore.getState().monumentData).toBeNull()

    // Signals can still succeed independently
    setSignalStatus('clima', 'success')
    setSignalStatus('eventos', 'success')
    setSignalStatus('cosmos', 'success')
    setSignalStatus('economia', 'success')
    setSignalStatus('atencion', 'success')
    setSignalStatus('tierra', 'success')

    const { signals, monumentData } = useWorldStateStore.getState()
    expect(allSignalsSuccess(signals)).toBe(true)
    expect(monumentData).toBeNull()  // monument absence does not break flow
  })

  it('monumentData shape — landmarkType must be an integer in 0-5 range', () => {
    const { setMonumentData } = useWorldStateStore.getState()

    const validTypes = [0, 1, 2, 3, 4, 5]
    for (const landmarkType of validTypes) {
      setMonumentData({ name: 'Test', imageProxyUrl: null, landmarkType })
      const stored = useWorldStateStore.getState().monumentData
      expect(stored?.landmarkType).toBe(landmarkType)
      expect(stored?.landmarkType).toBeGreaterThanOrEqual(0)
      expect(stored?.landmarkType).toBeLessThanOrEqual(5)
    }
  })

  it('signals transition from idle → loading → success without phase change', () => {
    const { setSignalStatus } = useWorldStateStore.getState()
    const phaseStart = useWorldStateStore.getState().phase

    const transitions: Array<[keyof SignalState, 'loading' | 'success']> = [
      ['clima', 'loading'],
      ['clima', 'success'],
      ['cosmos', 'loading'],
      ['cosmos', 'success'],
    ]

    for (const [signal, status] of transitions) {
      setSignalStatus(signal, status)
      expect(useWorldStateStore.getState().phase).toBe(phaseStart)
    }
  })

  it('phase can be set to vision-select after all signals complete (setPhase caller owns this logic)', () => {
    const { setSignalStatus, setPhase } = useWorldStateStore.getState()

    // Simulate MonumentLoader completing its job
    setSignalStatus('clima', 'success')
    setSignalStatus('eventos', 'success')
    setSignalStatus('cosmos', 'success')
    setSignalStatus('economia', 'success')
    setSignalStatus('atencion', 'success')
    setSignalStatus('tierra', 'success')

    const { signals } = useWorldStateStore.getState()

    // MonumentLoader would call setPhase('vision-select') when this is true
    if (allSignalsSuccess(signals)) {
      setPhase('vision-select')
    }

    expect(useWorldStateStore.getState().phase).toBe('vision-select')
  })
})
