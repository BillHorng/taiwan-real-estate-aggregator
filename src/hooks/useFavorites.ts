import { useEffect, useState } from 'react'

const STORAGE_KEY = 'trea-favorites-v1'

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') }
    catch { return [] }
  })
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites)), [favorites])
  const toggle = (id: string) => setFavorites(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id])
  return { favorites, toggle }
}
