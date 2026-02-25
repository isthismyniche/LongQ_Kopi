declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag: (...args: any[]) => void
    dataLayer: unknown[]
  }
}

export function initAnalytics(): void {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
  if (!id) return

  // Inject gtag.js
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`
  document.head.appendChild(script)

  // Standard gtag bootstrap — must use arguments object, not rest params
  window.dataLayer = window.dataLayer ?? []
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer.push(arguments) }
  window.gtag('js', new Date())
  window.gtag('config', id)
}

export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>,
): void {
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params ?? {})
}
