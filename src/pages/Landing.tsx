import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'

const menuButtons = [
  { label: 'Start', path: '/game', color: 'bg-hawker-red hover:bg-hawker-red/90' },
  { label: 'How to Play', path: '/how-to-play', color: 'bg-kopi-brown hover:bg-kopi-brown/90' },
  { label: 'Leaderboard', path: '/leaderboard', color: 'bg-warm-yellow hover:bg-warm-yellow/90 text-kopi-brown' },
  { label: 'Settings', path: '/settings', color: 'bg-kopi-brown/70 hover:bg-kopi-brown/80' },
]

// ── Modal wrapper ─────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 8 }}
        transition={{ type: 'spring', duration: 0.35 }}
        className="bg-cream rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── About modal ───────────────────────────────────────────────────────────────

function AboutModal({ onClose, onOpenSupport }: { onClose: () => void; onOpenSupport: () => void }) {
  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-display text-2xl font-bold text-kopi-brown">About</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-kopi-brown/40 hover:text-kopi-brown/70 transition-colors cursor-pointer text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto max-h-[65vh] space-y-4 text-sm text-kopi-brown/70 font-body leading-relaxed pr-1">
        <div>
          <h3 className="font-display font-bold text-kopi-brown mb-1">Why I Built This</h3>
          <p>
            I'm passionate about coffee — and Singapore's kopi culture is something I love
            sharing whenever friends from other countries visit. There's a whole vocabulary
            to it: <em>kopi-o</em>, <em>kopi-c</em>, <em>kopi gau</em>, <em>siew dai</em>...
            and even some Singaporeans haven't explored all the intricacies!
          </p>
          <p className="mt-2">
            LongQ Kopi started as a way to make that discovery faster and more fun. By taking
            orders under pressure, you quickly learn what goes into each drink — experiment,
            make mistakes, and come back for more. ☕
          </p>
        </div>

        <div>
          <h3 className="font-display font-bold text-kopi-brown mb-1">How It Works</h3>
          <p>
            The product requirements came from me — the game design, content, and vision.
            The code was written by{' '}
            <a
              href="https://claude.ai/code"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kopi-brown underline underline-offset-2 hover:text-hawker-red transition-colors"
            >
              Claude Code
            </a>
            , Anthropic's AI coding assistant.
          </p>
          <p className="mt-2">
            There's a small backend: scores are saved to a{' '}
            <strong className="text-kopi-brown/90">Supabase</strong> database, and
            contributions go through <strong className="text-kopi-brown/90">Stripe</strong>.
            The rest runs entirely in the browser.
          </p>
        </div>

        <div>
          <h3 className="font-display font-bold text-kopi-brown mb-1">Reach Out</h3>
          <p>
            I hope you enjoyed this game! If you did, consider{' '}
            <button
              onClick={() => { onClose(); onOpenSupport() }}
              className="text-kopi-brown underline underline-offset-2 hover:text-hawker-red transition-colors cursor-pointer"
            >
              supporting this project
            </button>
            .
          </p>
          <p className="mt-2">
            Want to see how it's built?{' '}
            <a
              href="https://github.com/isthismyniche/LongQ_Kopi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kopi-brown underline underline-offset-2 hover:text-hawker-red transition-colors"
            >
              Check out the code on GitHub.
            </a>
          </p>
          <p className="mt-2">
            <a
              href="https://www.linkedin.com/in/manishnair92/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-kopi-brown underline underline-offset-2 hover:text-hawker-red transition-colors"
            >
              Connect with me on LinkedIn.
            </a>
          </p>
        </div>

        <p className="text-xs text-kopi-brown/40 pt-1">— Manish</p>
      </div>
    </Modal>
  )
}

// ── Support modal ─────────────────────────────────────────────────────────────

const QUICK_AMOUNTS = [3, 6, 12] as const

function SupportModal({ onClose }: { onClose: () => void }) {
  const [inputValue, setInputValue] = useState('6')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState(false)

  const numericAmount = parseFloat(inputValue)
  const isValid = !isNaN(numericAmount) && numericAmount >= 1
  const displayAmount = isValid ? numericAmount.toFixed(2) : '0.00'
  const amountCents = isValid ? Math.round(numericAmount * 100) : 0

  const handleQuickSelect = (amount: number) => {
    setInputValue(String(amount))
    setApiError(false)
  }

  const handleDonate = async () => {
    if (!isValid || loading) return
    setLoading(true)
    setApiError(false)
    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountCents }),
      })
      if (!res.ok) throw new Error('API error')
      const { url } = await res.json() as { url: string }
      window.location.href = url
    } catch {
      setApiError(true)
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-start justify-between mb-4">
        <h2 className="font-display text-2xl font-bold text-kopi-brown">Support ☕</h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="text-kopi-brown/40 hover:text-kopi-brown/70 transition-colors cursor-pointer text-xl leading-none"
        >
          ✕
        </button>
      </div>

      <p className="text-sm text-kopi-brown/70 font-body leading-relaxed mb-5">
        This tool is free to use, and is my little gift to the world. If it helped you,
        consider buying me a coffee! ☕
      </p>

      {/* Quick-select pills */}
      <div className="flex gap-2 mb-3">
        {QUICK_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => handleQuickSelect(amount)}
            className={`flex-1 py-2 rounded-xl font-display font-bold text-sm cursor-pointer
              transition-all border-2 ${
                inputValue === String(amount)
                  ? 'bg-kopi-brown text-white border-kopi-brown shadow-md'
                  : 'bg-transparent text-kopi-brown border-kopi-brown/25 hover:border-kopi-brown/50'
              }`}
          >
            S${amount}
            {amount === 6 && (
              <div className="text-[9px] opacity-70 font-body font-normal leading-tight">popular</div>
            )}
          </button>
        ))}
      </div>

      {/* Custom amount input */}
      <div className="relative mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-kopi-brown/50 font-body text-sm select-none">
          S$
        </span>
        <input
          type="number"
          min="1"
          step="any"
          value={inputValue}
          onChange={e => { setInputValue(e.target.value); setApiError(false) }}
          placeholder="0"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-kopi-brown/20 bg-white
            font-body text-kopi-brown text-base focus:outline-none focus:border-kopi-brown/50
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>

      {/* Donate button */}
      <button
        onClick={handleDonate}
        disabled={!isValid || loading}
        className="w-full px-4 py-3 rounded-2xl bg-hawker-red hover:bg-hawker-red/90
          text-white font-display font-bold text-lg shadow-lg cursor-pointer transition-colors
          disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Redirecting…' : `Donate S$${displayAmount}`}
      </button>

      {apiError && (
        <p className="text-xs text-hawker-red/80 text-center mt-2 font-body">
          Something went wrong — please try again.
        </p>
      )}
    </Modal>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate()
  const [showAbout, setShowAbout] = useState(false)
  const [showSupport, setShowSupport] = useState(false)

  return (
    <PageWrapper className="flex flex-col items-center justify-center bg-cream min-h-full">
      {/* Steam lines */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-30 pointer-events-none">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1 h-16 bg-kopi-brown/40 rounded-full"
            animate={{ y: [-8, -24, -8], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
          />
        ))}
      </div>

      {/* Logo / Title */}
      <motion.div
        className="text-center mb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <div className="mx-auto mb-4 relative w-24 h-28">
          <svg viewBox="0 0 96 112" className="w-full h-full">
            <path d="M16 32 L20 96 L76 96 L80 32 Z" fill="#5C3D2E" />
            <path d="M20 40 L23 88 L73 88 L76 40 Z" fill="#8B6914" />
            <rect x="12" y="28" width="72" height="8" rx="4" fill="#5C3D2E" />
            <path d="M80 44 Q96 44 96 64 Q96 84 80 84" stroke="#5C3D2E" strokeWidth="6" fill="none" />
            <motion.path
              d="M36 20 Q40 10 36 0"
              stroke="#5C3D2E" strokeWidth="2" fill="none" opacity="0.4"
              animate={{ y: [-2, -6, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.path
              d="M52 20 Q56 10 52 0"
              stroke="#5C3D2E" strokeWidth="2" fill="none" opacity="0.4"
              animate={{ y: [-2, -6, -2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
            />
          </svg>
        </div>
        <h1 className="font-display text-5xl font-bold text-kopi-brown tracking-tight">
          LongQ Kopi
        </h1>
        <p className="mt-2 text-lg text-kopi-brown/70 font-body">
          Serve drinks. Beat the queue.
        </p>
      </motion.div>

      {/* Menu Buttons */}
      <div className="flex flex-col gap-3 w-64 mb-8">
        {menuButtons.map((btn, i) => (
          <motion.button
            key={btn.path}
            onClick={() => navigate(btn.path)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`px-6 py-3 rounded-2xl font-display font-bold text-lg text-white shadow-lg
              active:scale-95 transition-colors cursor-pointer ${btn.color}`}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      {/* About & Support icon buttons — centred below menu */}
      <motion.div
        className="flex gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          onClick={() => setShowAbout(true)}
          aria-label="About"
          className="flex flex-col items-center gap-1.5 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-full bg-kopi-brown/10 group-hover:bg-kopi-brown/20
            flex items-center justify-center text-kopi-brown/55 group-hover:text-kopi-brown
            transition-all shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
            </svg>
          </div>
          <span className="text-xs text-kopi-brown/50 font-body group-hover:text-kopi-brown/70 transition-colors">About</span>
        </button>

        <button
          onClick={() => setShowSupport(true)}
          aria-label="Support this project"
          className="flex flex-col items-center gap-1.5 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-full bg-kopi-brown/10 group-hover:bg-kopi-brown/20
            flex items-center justify-center text-kopi-brown/55 group-hover:text-kopi-brown
            transition-all shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <span className="text-xs text-kopi-brown/50 font-body group-hover:text-kopi-brown/70 transition-colors">Support</span>
        </button>
      </motion.div>

      <p className="absolute bottom-6 text-sm text-kopi-brown/40 font-body">
        A Singapore Hawker Stall Drink Game
      </p>

      {/* Modals */}
      <AnimatePresence>
        {showAbout && (
          <AboutModal
            onClose={() => setShowAbout(false)}
            onOpenSupport={() => { setShowAbout(false); setShowSupport(true) }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      </AnimatePresence>
    </PageWrapper>
  )
}
