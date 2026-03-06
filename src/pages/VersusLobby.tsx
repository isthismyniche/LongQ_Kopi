import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import { useVersusRoom } from '../hooks/useVersusRoom'
import { getOrCreateDeviceId } from '../utils/leaderboard'

type LobbyView = 'choose' | 'create' | 'waiting' | 'join'

const WIN_TARGET_MIN = 5
const WIN_TARGET_MAX = 50
const WIN_TARGET_STEP = 5

// ── Waiting view ──────────────────────────────────────────────────────────────

function WaitingView({ roomCode, onBack }: { roomCode: string; onBack: () => void }) {
  const navigate = useNavigate()
  const { room } = useVersusRoom(roomCode, 'host')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/versus/${roomCode}`, {
        state: { role: 'host', winTarget: room.win_target, startLevel: room.start_level ?? 1 },
      })
    }
  }, [room?.status, roomCode, room?.win_target, room?.start_level, navigate])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [roomCode])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-kopi-brown/60 font-body mb-3">Share this code with your opponent:</p>
        <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-kopi-brown/15">
          <span className="font-mono text-4xl font-bold text-kopi-brown tracking-[0.2em]">{roomCode}</span>
          <button
            onClick={handleCopy}
            className="text-kopi-brown/40 hover:text-kopi-brown transition-colors cursor-pointer"
            aria-label="Copy code"
          >
            {copied ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
            )}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 text-kopi-brown/50">
        <motion.div
          className="w-2 h-2 rounded-full bg-kopi-brown/40"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-sm font-body">Waiting for opponent...</span>
      </div>
      <button
        onClick={onBack}
        className="text-xs text-kopi-brown/40 hover:text-kopi-brown/60 transition-colors cursor-pointer font-body"
      >
        Cancel
      </button>
    </div>
  )
}

// ── Main lobby page ───────────────────────────────────────────────────────────

export default function VersusLobby() {
  const [view, setView] = useState<LobbyView>('choose')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Room settings (host only)
  const [winTarget, setWinTarget] = useState(20)
  const [startLevel, setStartLevel] = useState(1)

  const navigate = useNavigate()
  const deviceId = getOrCreateDeviceId()

  const handleCreate = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/versus/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, winTarget, startLevel }),
      })
      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json() as { roomCode: string }
      setRoomCode(data.roomCode)
      setView('waiting')
    } catch {
      setError('Could not create room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [deviceId, winTarget, startLevel])

  const handleJoin = useCallback(async () => {
    if (joinCode.length !== 6) { setError('Enter the full 6-character code'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/versus/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: joinCode, deviceId }),
      })
      const data = await res.json() as { roomCode?: string; winTarget?: number; startLevel?: number; error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not join room'); return }
      navigate(`/versus/${data.roomCode}`, {
        state: { role: 'guest', winTarget: data.winTarget ?? 20, startLevel: data.startLevel ?? 1 },
      })
    } catch {
      setError('Could not join room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [joinCode, deviceId, navigate])

  const adjustWinTarget = (delta: number) => {
    setWinTarget(prev => Math.min(WIN_TARGET_MAX, Math.max(WIN_TARGET_MIN, prev + delta)))
  }

  return (
    <PageWrapper className="flex flex-col h-full bg-cream">
      <div className="p-4 flex-shrink-0">
        <BackButton />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <h1 className="font-display text-3xl font-bold text-kopi-brown mb-2 text-center">
          Versus Mode
        </h1>
        <p className="text-sm text-kopi-brown/60 font-body mb-8 text-center">
          First to serve all their drinks wins. No lives — just speed.
        </p>

        <AnimatePresence mode="wait">

          {/* ── Choose ── */}
          {view === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              {error && <p className="text-xs text-hawker-red font-body text-center">{error}</p>}
              <button
                onClick={() => { setError(''); setView('create') }}
                className="px-6 py-3.5 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
              >
                Create Room
              </button>
              <button
                onClick={() => { setError(''); setView('join') }}
                className="px-6 py-3.5 rounded-2xl bg-kopi-brown hover:bg-kopi-brown/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
              >
                Join Room
              </button>
            </motion.div>
          )}

          {/* ── Create settings ── */}
          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-6 w-full max-w-xs"
            >
              {/* Win target */}
              <div>
                <p className="text-xs font-display font-bold text-kopi-brown/50 uppercase tracking-wide mb-2 text-center">
                  Drinks to win
                </p>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => adjustWinTarget(-WIN_TARGET_STEP)}
                    disabled={winTarget <= WIN_TARGET_MIN}
                    className="w-10 h-10 rounded-full bg-kopi-brown/10 hover:bg-kopi-brown/20
                      text-kopi-brown font-bold text-xl cursor-pointer transition-colors
                      disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="font-display text-4xl font-bold text-kopi-brown w-16 text-center">
                    {winTarget}
                  </span>
                  <button
                    onClick={() => adjustWinTarget(WIN_TARGET_STEP)}
                    disabled={winTarget >= WIN_TARGET_MAX}
                    className="w-10 h-10 rounded-full bg-kopi-brown/10 hover:bg-kopi-brown/20
                      text-kopi-brown font-bold text-xl cursor-pointer transition-colors
                      disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Starting level */}
              <div>
                <p className="text-xs font-display font-bold text-kopi-brown/50 uppercase tracking-wide mb-2 text-center">
                  Starting level
                </p>
                <div className="flex justify-center gap-2">
                  {([1, 2, 3, 4, 5] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setStartLevel(l)}
                      className={`w-11 h-11 rounded-xl font-display font-bold text-sm cursor-pointer transition-all ${
                        startLevel === l
                          ? 'bg-hawker-red text-white shadow-md scale-105'
                          : 'bg-kopi-brown/10 hover:bg-kopi-brown/20 text-kopi-brown'
                      }`}
                    >
                      L{l}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-hawker-red font-body text-center">{error}</p>}

              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-hawker-red hover:bg-hawker-red/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Room'}
              </button>
              <button
                onClick={() => setView('choose')}
                className="text-sm text-kopi-brown/50 hover:text-kopi-brown/70 transition-colors cursor-pointer font-body text-center"
              >
                ← Back
              </button>
            </motion.div>
          )}

          {/* ── Waiting ── */}
          {view === 'waiting' && roomCode && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <WaitingView
                roomCode={roomCode}
                onBack={() => { setView('choose'); setRoomCode('') }}
              />
            </motion.div>
          )}

          {/* ── Join ── */}
          {view === 'join' && (
            <motion.div
              key="join"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-4 w-full max-w-xs"
            >
              <input
                type="text"
                maxLength={6}
                placeholder="ENTER CODE"
                value={joinCode}
                onChange={e => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                  setError('')
                }}
                className="w-full text-center font-mono text-3xl font-bold tracking-[0.25em]
                  py-4 rounded-2xl border-2 border-kopi-brown/20 bg-white text-kopi-brown
                  focus:outline-none focus:border-kopi-brown/50 placeholder:text-kopi-brown/20
                  placeholder:tracking-widest"
              />
              {error && <p className="text-xs text-hawker-red font-body">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                className="w-full px-6 py-3.5 rounded-2xl bg-hawker-red hover:bg-hawker-red/90
                  text-white font-display font-bold text-lg shadow-lg cursor-pointer transition-colors
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : 'Join'}
              </button>
              <button
                onClick={() => { setView('choose'); setJoinCode(''); setError('') }}
                className="text-sm text-kopi-brown/50 hover:text-kopi-brown/70 transition-colors cursor-pointer font-body"
              >
                ← Back
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </PageWrapper>
  )
}
