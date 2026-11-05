let loadPromise: Promise<void> | undefined

type GoogleMapsWindow = Window & { __treaGoogleMapsReady?: () => void, gm_authFailure?: () => void }

export function loadGoogleMaps(apiKey: string): Promise<void> {
  const runtime = globalThis as typeof globalThis & { google?: typeof google }
  if (typeof runtime.google?.maps?.importLibrary === 'function') return Promise.resolve()
  if (!apiKey) return Promise.reject(new Error('缺少 Google Maps API Key'))
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = '__treaGoogleMapsReady'
    const appWindow = window as GoogleMapsWindow
    const fail = (message: string) => {
      delete appWindow[callbackName]
      delete appWindow.gm_authFailure
      document.getElementById('trea-google-maps-api')?.remove()
      loadPromise = undefined
      reject(new Error(message))
    }
    appWindow[callbackName] = () => {
      delete appWindow[callbackName]
      delete appWindow.gm_authFailure
      resolve()
    }
    appWindow.gm_authFailure = () => fail('Google Maps API Key 驗證失敗，請檢查金鑰、帳務與 HTTP referrer 限制')
    const parameters = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      callback: callbackName,
      v: 'weekly',
      language: 'zh-TW',
      region: 'TW',
    })
    const script = document.createElement('script')
    script.id = 'trea-google-maps-api'
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?${parameters}`
    script.onerror = () => fail('無法連線至 Google Maps JavaScript API')
    document.head.append(script)
  })
  return loadPromise
}
