const GAME_URL = 'https://longqkopi.vercel.app'

export interface SharePayload {
  name: string
  score: number
  drinksServed: number
  avgSeconds: number
  cardImageBlob: Blob
}

export async function shareScore(
  payload: SharePayload,
  onClipboardFallback?: () => void,
): Promise<void> {
  const shareText =
    `${payload.name} scored ${payload.score} points in LongQ Kopi! ` +
    `They served ${payload.drinksServed} drinks taking ${payload.avgSeconds.toFixed(1)}s per drink on average. ` +
    `Can you beat them? Tap to play 👉 ${GAME_URL}`

  const imageFile = new File([payload.cardImageBlob], 'longq-score.png', { type: 'image/png' })

  // Step 1: Web Share API with image file (mobile native share sheet)
  if (navigator.canShare?.({ files: [imageFile] })) {
    try {
      await navigator.share({
        title: 'LongQ Kopi Score',
        text: shareText,
        files: [imageFile],
      })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // user cancelled
      // otherwise fall through
    }
  }

  // Step 2: Web Share API text only (desktop Chrome / Edge share popup)
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'LongQ Kopi Score',
        text: shareText,
        url: GAME_URL,
      })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return // user cancelled
      // otherwise fall through
    }
  }

  // Step 3: Copy share text to clipboard
  try {
    await navigator.clipboard.writeText(shareText)
  } catch {
    // clipboard not available — silent
  }
  onClipboardFallback?.()
}
