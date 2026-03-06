import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import { useVersusRoom } from '../hooks/useVersusRoom'
import { getOrCreateDeviceId } from '../utils/leaderboard'

type LobbyView = 'choose' | 'waiting' | 'join'

// ── Waiting view (shown after creating a room) ────────────────────────────────

function WaitingView({
  roomCode,
  onBack,
}: {
  roomCode: string
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { room } = useVersusRoom(roomCode, 'host')
  const [copied, setCopied] = useState(false)

  // Navigate to game once guest joins
  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/versus/${roomCode}`, {
        state: { role: 'host', winTarget: room.win_target },
      })
    }
  }, [room?.status, roomCode, room?.win_target, navigate])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [roomCode])

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-kopi-brown/60 font-body mb-3">
          Share this code with your opponent:
        </p>
        <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-kopi-brown/15">
          <span className="font-mono text-4xl font-bold text-kopi-brown tracking-[0.2em]">
            {roomCode}
          </span>
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
  const [joinError, setJoinError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const deviceId = getOrCreateDeviceId()

  const handleCreate = useCallback(async () => {
    setLoading(true)
    setJoinError('')
    try {
      const res = await fetch('/api/versus/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      })
      if (!res.ok) throw new Error('Failed to create room')
      const data = await res.json() as { roomCode: string }
      setRoomCode(data.roomCode)
      setView('waiting')
    } catch {
      setJoinError('Could not create room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [deviceId])

  const handleJoin = useCallback(async () => {
    if (joinCode.length !== 6) { setJoinError('Enter the full 6-character code'); return }
    setLoading(true)
    setJoinError('')
    try {
      const res = await fetch('/api/versus/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: joinCode, deviceId }),
      })
      const data = await res.json() as { roomCode?: string; winTarget?: number; error?: string }
      if (!res.ok) { setJoinError(data.error ?? 'Could not join room'); return }
      navigate(`/versus/${data.roomCode}`, {
        state: { role: 'guest', winTarget: data.winTarget ?? 20 },
      })
    } catch {
      setJoinError('Could not join room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [joinCode, deviceId, navigate])

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
          Race to serve 20 drinks first. No lives — just speed.
        </p>

        <AnimatePresence mode="wait">
          {view === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-3 w-full max-w-xs"
            >
              {joinError && (
                <p className="text-xs text-hawker-red font-body text-center">{joinError}</p>
              )}
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
                onClick={() => setView('join')}
                className="px-6 py-3.5 rounded-2xl bg-kopi-brown hover:bg-kopi-brown/90 text-white
                  font-display font-bold text-lg shadow-lg cursor-pointer transition-colors"
              >
                Join Room
              </button>
            </motion.div>
          )}

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
                  setJoinError('')
                }}
                className="w-full text-center font-mono text-3xl font-bold tracking-[0.25em]
                  py-4 rounded-2xl border-2 border-kopi-brown/20 bg-white text-kopi-brown
                  focus:outline-none focus:border-kopi-brown/50 placeholder:text-kopi-brown/20
                  placeholder:tracking-widest"
              />
              {joinError && (
                <p className="text-xs text-hawker-red font-body">{joinError}</p>
              )}
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
                onClick={() => { setView('choose'); setJoinCode(''); setJoinError('') }}
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
