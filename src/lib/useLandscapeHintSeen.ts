import { useState, useEffect } from 'react'

const STORAGE_KEY = 'el-ojo-landscape-hint-seen'

export function useLandscapeHintSeen(): [boolean, () => void] {
  const [seen, setSeen] = useState(true) // default true to avoid flash

  useEffect(() => {
    // Check localStorage on mount
    const hasSeenHint = localStorage.getItem(STORAGE_KEY) === 'true'
    setSeen(hasSeenHint)
  }, [])

  const markAsSeen = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setSeen(true)
  }

  return [seen, markAsSeen]
}
