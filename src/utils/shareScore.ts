export interface SharePayload {
  name: string
  score: number
  drinksServed: number
  avgSeconds: number
  signedURL: string
  cardImageBlob: Blob
}

export async function shareScore(
  platform: 'whatsapp' | 'telegram',
  payload: SharePayload,
  onDesktopFallback?: () => void,
): Promise<void> {
  const shareText =
    `${payload.name} scored ${payload.score} points in LongQ Kopi! ` +
    `They served ${payload.drinksServed} drinks taking ${payload.avgSeconds.toFixed(1)}s per drink on average. ` +
    `Can you beat them? Tap to play 👉 ${payload.signedURL}`

  const imageFile = new File([payload.cardImageBlob], 'longq-score.png', { type: 'image/png' })

  // Step 1: Check Web Share API with file support
  if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
    try {
      await navigator.share({
        title: 'LongQ Kopi Score',
        text: shareText,
        files: [imageFile],
      })
    } catch {
      // User cancelled or browser rejected — silent
    }
    return
  }

  // Step 3: Desktop fallback

  // 3a. Auto-download the card image
  const objectURL = URL.createObjectURL(payload.cardImageBlob)
  const link = document.createElement('a')
  link.href = objectURL
  link.download = 'longq-score.png'
  link.click()
  setTimeout(() => URL.revokeObjectURL(objectURL), 60_000)

  // 3b. Open platform share URL in new tab
  const encodedText = encodeURIComponent(shareText)
  const encodedURL = encodeURIComponent(payload.signedURL)

  const shareURL =
    platform === 'whatsapp'
      ? `https://wa.me/?text=${encodedText}`
      : `https://t.me/share/url?url=${encodedURL}&text=${encodedText}`

  window.open(shareURL, '_blank', 'noopener,noreferrer')

  // 3c. Notify caller to show tooltip
  onDesktopFallback?.()
}
