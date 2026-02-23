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

export default function Landing() {
  const navigate = useNavigate()
  const [showAbout, setShowAbout] = useState(false)

  return (
    <PageWrapper className="flex flex-col items-center justify-start bg-cream min-h-full pb-10">
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
        className="text-center mt-[12vh] mb-10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Cup icon */}
        <div className="mx-auto mb-4 relative w-24 h-28">
          <svg viewBox="0 0 96 112" className="w-full h-full">
            <path d="M16 32 L20 96 L76 96 L80 32 Z" fill="#5C3D2E" />
            <path d="M20 40 L23 88 L73 88 L76 40 Z" fill="#8B6914" />
            <rect x="12" y="28" width="72" height="8" rx="4" fill="#5C3D2E" />
            <path d="M80 44 Q96 44 96 64 Q96 84 80 84" stroke="#5C3D2E" strokeWidth="6" fill="none" />
            <motion.path
              d="M36 20 Q40 10 36 0"
              stroke="#5C3D2E"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
              animate={{ y: [-2, -6, -2] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.path
              d="M52 20 Q56 10 52 0"
              stroke="#5C3D2E"
              strokeWidth="2"
              fill="none"
              opacity="0.4"
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

      {/* About toggle */}
      <motion.div
        className="w-full max-w-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <button
          onClick={() => setShowAbout(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 text-sm text-kopi-brown/45
            hover:text-kopi-brown/70 font-body transition-colors cursor-pointer"
        >
          About
          <motion.span
            animate={{ rotate: showAbout ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-block"
          >
            ↓
          </motion.span>
        </button>

        <AnimatePresence>
          {showAbout && (
            <motion.div
              key="about"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-5 bg-kopi-brown/5 rounded-2xl border border-kopi-brown/10 text-left space-y-4">
                <div>
                  <h4 className="font-display font-bold text-kopi-brown mb-1">Why I Built This</h4>
                  <p className="text-sm text-kopi-brown/70 font-body leading-relaxed">
                    I'm passionate about coffee — and Singapore's kopi culture is something I love
                    sharing whenever friends from other countries visit. There's a whole vocabulary
                    to it: <em>kopi-o</em>, <em>kopi-c</em>, <em>kopi gau</em>, <em>siew dai</em>...
                    and even some Singaporeans haven't explored all the intricacies!
                  </p>
                  <p className="text-sm text-kopi-brown/70 font-body leading-relaxed mt-2">
                    LongQ Kopi started as a way to make that discovery faster and more fun. By
                    taking orders under pressure, you quickly learn what goes into each drink —
                    experiment, make mistakes, and come back for more. ☕
                  </p>
                </div>

                <div>
                  <h4 className="font-display font-bold text-kopi-brown mb-1">How It Works</h4>
                  <p className="text-sm text-kopi-brown/70 font-body leading-relaxed">
                    Customers queue up and place orders using Singapore's local coffee vocabulary.
                    Prepare each drink correctly before the timer runs out — wrong order or timeout
                    means a lost life. The queue grows longer and faster as you level up through
                    Morning Shift all the way to Supper Crowd.
                  </p>
                </div>

                <div>
                  <h4 className="font-display font-bold text-kopi-brown mb-1">Reach Out</h4>
                  <p className="text-sm text-kopi-brown/70 font-body leading-relaxed">
                    Hope you enjoyed it! Want to see how it's built?{' '}
                    <a
                      href="https://github.com/isthismyniche/LongQ_Kopi"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-kopi-brown underline underline-offset-2 hover:text-hawker-red transition-colors"
                    >
                      Check out the code on GitHub.
                    </a>
                  </p>
                </div>

                <p className="text-xs text-kopi-brown/40 font-body pt-1">— Manish</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </PageWrapper>
  )
}
