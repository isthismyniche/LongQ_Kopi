import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { HelmetProvider } from 'react-helmet-async'
import Landing from './pages/Landing'

const Game = lazy(() => import('./pages/Game'))
const HowToPlay = lazy(() => import('./pages/HowToPlay'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Settings = lazy(() => import('./pages/Settings'))
const ScorePage = lazy(() => import('./pages/ScorePage'))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full bg-cream">
      <p className="font-display text-xl text-kopi-brown/50">Loading...</p>
    </div>
  )
}

function App() {
  return (
    <HelmetProvider>
      <AnimatePresence mode="wait">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/game" element={<Game />} />
            <Route path="/how-to-play" element={<HowToPlay />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/score" element={<ScorePage />} />
          </Routes>
        </Suspense>
      </AnimatePresence>
    </HelmetProvider>
  )
}

export default App
