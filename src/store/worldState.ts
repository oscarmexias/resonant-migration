import { create } from 'zustand'
import type { WorldState, SignalState, ArtParams } from '@/types/worldstate'

export type AppPhase = 'idle' | 'awakening' | 'requesting-location' | 'loading-signals' | 'generating' | 'output' | 'error'

interface WorldStateStore {
  phase: AppPhase
  setPhase: (phase: AppPhase) => void

  location: { lat: number; lng: number } | null
  setLocation: (loc: { lat: number; lng: number }) => void

  signals: SignalState
  setSignalStatus: (signal: keyof SignalState, status: SignalStatus) => void

  worldState: WorldState | null
  setWorldState: (ws: WorldState) => void

  artParams: ArtParams | null
  setArtParams: (params: ArtParams) => void

  error: string | null
  setError: (error: string | null) => void

  locationDenied: boolean
  setLocationDenied: (v: boolean) => void

  mosaicMode: 'code' | 'name'
  setMosaicMode: (mode: 'code' | 'name') => void

  controlPanelOpen: boolean
  setControlPanelOpen: (v: boolean) => void

  citySearchOpen: boolean
  setCitySearchOpen: (v: boolean) => void

  monumentModeOn: boolean
  setMonumentModeOn: (v: boolean) => void

  immersiveMode: boolean
  setImmersiveMode: (v: boolean) => void

  reset: () => void
}

type SignalStatus = SignalState[keyof SignalState]

const initialSignals: SignalState = {
  clima: 'idle',
  eventos: 'idle',
  cosmos: 'idle',
  economia: 'idle',
  atencion: 'idle',
  tierra: 'idle',
}

export const useWorldStateStore = create<WorldStateStore>((set) => ({
  phase: 'idle',
  setPhase: (phase) => set({ phase }),

  location: null,
  setLocation: (location) => set({ location }),

  signals: initialSignals,
  setSignalStatus: (signal, status) =>
    set((state) => ({ signals: { ...state.signals, [signal]: status } })),

  worldState: null,
  setWorldState: (worldState) => set({ worldState }),

  artParams: null,
  setArtParams: (artParams) => set({ artParams }),

  error: null,
  setError: (error) => set({ error }),

  locationDenied: false,
  setLocationDenied: (locationDenied) => set({ locationDenied }),

  mosaicMode: 'code',
  setMosaicMode: (mosaicMode) => set({ mosaicMode }),

  controlPanelOpen: false,
  setControlPanelOpen: (controlPanelOpen) => set({ controlPanelOpen }),

  citySearchOpen: false,
  setCitySearchOpen: (citySearchOpen) => set({ citySearchOpen }),

  monumentModeOn: true,
  setMonumentModeOn: (monumentModeOn) => set({ monumentModeOn }),

  immersiveMode: false,
  setImmersiveMode: (immersiveMode) => set({ immersiveMode }),

  reset: () =>
    set({
      phase: 'idle',
      signals: initialSignals,
      worldState: null,
      artParams: null,
      error: null,
      locationDenied: false,
    }),
}))
