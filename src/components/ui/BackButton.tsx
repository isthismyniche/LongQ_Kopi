import { useNavigate } from 'react-router-dom'

export default function BackButton() {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate('/')}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-kopi-brown/10 hover:bg-kopi-brown/20 text-kopi-brown font-semibold transition-colors cursor-pointer"
      aria-label="Go back to main menu"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12 15L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Back
    </button>
  )
}
