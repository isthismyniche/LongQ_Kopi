import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'

const menuButtons = [
  { label: 'Start', path: '/game', color: 'bg-hawker-red hover:bg-hawker-red/90' },
  { label: 'How to Play', path: '/how-to-play', color: 'bg-kopi-brown hover:bg-kopi-brown/90' },
  { label: 'Leaderboard', path: '/leaderboard', color: 'bg-warm-yellow hover:bg-warm-yellow/90 text-kopi-brown' },
  { label: 'Settings', path: '/settings', color: 'bg-kopi-brown/70 hover:bg-kopi-brown/80' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <PageWrapper className="flex flex-col items-center justify-center bg-cream min-h-full">
      {/* Steam lines */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-30">
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
        className="text-center mb-12"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {/* Cup icon */}
        <div className="mx-auto mb-4 relative w-24 h-28">
          <svg viewBox="0 0 96 112" className="w-full h-full">
            {/* Cup body */}
            <path d="M16 32 L20 96 L76 96 L80 32 Z" fill="#5C3D2E" />
            {/* Liquid */}
            <path d="M20 40 L23 88 L73 88 L76 40 Z" fill="#8B6914" />
            {/* Cup rim */}
            <rect x="12" y="28" width="72" height="8" rx="4" fill="#5C3D2E" />
            {/* Handle */}
            <path d="M80 44 Q96 44 96 64 Q96 84 80 84" stroke="#5C3D2E" strokeWidth="6" fill="none" />
            {/* Steam */}
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
      <div className="flex flex-col gap-3 w-64">
        {menuButtons.map((btn, i) => (
          <motion.button
            key={btn.path}
            onClick={() => navigate(btn.path)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className={`px-6 py-3 rounded-2xl font-display font-bold text-lg text-white shadow-lg
              active:scale-95 transition-all cursor-pointer ${btn.color}`}
          >
            {btn.label}
          </motion.button>
        ))}
      </div>

      <p className="absolute bottom-6 text-sm text-kopi-brown/40 font-body">
        A Singapore Hawker Stall Drink Game
      </p>
    </PageWrapper>
  )
}
