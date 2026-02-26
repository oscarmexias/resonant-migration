import { describe, it, expect, beforeEach } from 'vitest'
import { useWorldStateStore } from '@/store/worldState'

// Reset store state before each test to avoid cross-test pollution
beforeEach(() => {
  useWorldStateStore.getState().reset()
})

describe('worldState store — monumentData', () => {
  it('monumentData is null in initial state', () => {
    const state = useWorldStateStore.getState()
    expect(state.monumentData).toBeNull()
  })

  it('setMonumentData stores a valid MonumentData object', () => {
    const { setMonumentData } = useWorldStateStore.getState()

    setMonumentData({
      name: 'Angel of Independence',
      imageProxyUrl: '/api/monument-image?url=https%3A%2F%2Fexample.com%2Fangel.jpg',
      landmarkType: 2,
    })

    const { monumentData } = useWorldStateStore.getState()
    expect(monumentData).not.toBeNull()
    expect(monumentData?.name).toBe('Angel of Independence')
    expect(monumentData?.imageProxyUrl).toBe(
      '/api/monument-image?url=https%3A%2F%2Fexample.com%2Fangel.jpg'
    )
    expect(monumentData?.landmarkType).toBe(2)
  })

  it('setMonumentData accepts null imageProxyUrl (no photo available)', () => {
    const { setMonumentData } = useWorldStateStore.getState()

    setMonumentData({
      name: 'Unknown Monument',
      imageProxyUrl: null,
      landmarkType: 0,
    })

    const { monumentData } = useWorldStateStore.getState()
    expect(monumentData?.imageProxyUrl).toBeNull()
  })

  it('reset() clears monumentData back to null', () => {
    const { setMonumentData, reset } = useWorldStateStore.getState()

    setMonumentData({
      name: 'Eiffel Tower',
      imageProxyUrl: '/api/monument-image?url=https%3A%2F%2Fexample.com%2Feiffel.jpg',
      landmarkType: 1,
    })

    // Confirm it was stored
    expect(useWorldStateStore.getState().monumentData?.name).toBe('Eiffel Tower')

    reset()

    expect(useWorldStateStore.getState().monumentData).toBeNull()
  })

  it('setSignalStatus does not change the current phase', () => {
    const { setSignalStatus } = useWorldStateStore.getState()
    const phaseBefore = useWorldStateStore.getState().phase

    setSignalStatus('clima', 'loading')
    expect(useWorldStateStore.getState().phase).toBe(phaseBefore)

    setSignalStatus('cosmos', 'success')
    expect(useWorldStateStore.getState().phase).toBe(phaseBefore)

    setSignalStatus('tierra', 'error')
    expect(useWorldStateStore.getState().phase).toBe(phaseBefore)
  })

  it('setMonumentData can overwrite an existing monumentData value', () => {
    const { setMonumentData } = useWorldStateStore.getState()

    setMonumentData({ name: 'First', imageProxyUrl: null, landmarkType: 0 })
    setMonumentData({ name: 'Second', imageProxyUrl: null, landmarkType: 3 })

    const { monumentData } = useWorldStateStore.getState()
    expect(monumentData?.name).toBe('Second')
    expect(monumentData?.landmarkType).toBe(3)
  })

  it('setMonumentData(null) clears the field without calling reset()', () => {
    const { setMonumentData } = useWorldStateStore.getState()

    setMonumentData({ name: 'Tower', imageProxyUrl: null, landmarkType: 1 })
    expect(useWorldStateStore.getState().monumentData).not.toBeNull()

    setMonumentData(null)
    expect(useWorldStateStore.getState().monumentData).toBeNull()
  })
})
