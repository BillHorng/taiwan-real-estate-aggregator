import { useEffect, useState } from 'react'

const STORAGE_KEY = 'trea-compare-v1'
const EVENT_NAME = 'trea-compare-changed'
const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
  catch { return [] }
}

export function useCompare() {
  const [compareIds, setCompareIds] = useState<string[]>(read)
  useEffect(() => {
    const sync = () => setCompareIds(read())
    window.addEventListener(EVENT_NAME, sync)
    return () => window.removeEventListener(EVENT_NAME, sync)
  }, [])
  const write = (ids: string[]) => { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); window.dispatchEvent(new Event(EVENT_NAME)) }
  const toggleCompare = (id: string) => {
    const current = read()
    if (current.includes(id)) write(current.filter(item => item !== id))
    else if (current.length < 4) write([...current, id])
  }
  return { compareIds, toggleCompare, clearCompare: () => write([]), isFull: compareIds.length >= 4 }
}
