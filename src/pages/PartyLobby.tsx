import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import { usePartyRoom } from '../hooks/usePartyRoom'
import { getOrCreateDeviceId } from '../utils/leaderboard'
import { trackEvent } from '../utils/analytics'

type LobbyView = 'choose' | 'create' | 'join' | 'waiting' | 'rejoin'

const WIN_TARGET_MIN = 5
const WIN_TARGET_MAX = 50
const WIN_TARGET_STEP = 5

// ── Waiting view ──────────────────────────────────────────────────────────────

function WaitingView({
  roomCode,
  deviceId,
  playerName,
  onBack,
}: {
  roomCode: string
  deviceId: string
  playerName: string
  onBack: () => void
}) {
  const navigate = useNavigate()
  const { room, activePlayers } = usePartyRoom(roomCode, deviceId)
  const [copied, setCopied] = useState(false)
  const [sharedLink, setSharedLink] = useState(false)
  const [startError, setStartError] = useState('')
  const [winTarget, setWinTarget] = useState(room?.win_target ?? 20)
  const [startLevel, setStartLevel] = useState(room?.start_level ?? 1)
  const settingsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isHost = room?.host_device_id === deviceId

  // Sync local settings from room
  useEffect(() => {
    if (room) {
      setWinTarget(room.win_target)
      setStartLevel(room.start_level)
    }
  }, [room?.win_target, room?.start_level])

  // Navigate to game when host starts
  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/party/${roomCode}`, {
        state: { deviceId, playerName },
      })
    }
  }, [room?.status, roomCode, deviceId, playerName, navigate])

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [roomCode])

  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/party?join=${roomCode}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join my LongQ Kopi room!', text: `Join with code ${roomCode}`, url })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      setSharedLink(true)
      setTimeout(() => setSharedLink(false), 2000)
    }
  }, [roomCode])

  const postSettings = useCallback((wt: number, sl: number) => {
    if (!isHost) return
    if (settingsDebounce.current) clearTimeout(settingsDebounce.current)
    settingsDebounce.current = setTimeout(() => {
      fetch('/api/party/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId, winTarget: wt, startLevel: sl }),
      }).catch(() => {})
    }, 500)
  }, [roomCode, deviceId, isHost])

  const adjustWinTarget = (delta: number) => {
    const next = Math.min(WIN_TARGET_MAX, Math.max(WIN_TARGET_MIN, winTarget + delta))
    setWinTarget(next)
    postSettings(next, startLevel)
  }

  const handleStartLevel = (l: number) => {
    setStartLevel(l)
    postSettings(winTarget, l)
  }

  const handleStartGame = async () => {
    setStartError('')
    try {
      const res = await fetch('/api/party/start-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, deviceId }),
      })
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setStartError(data.error ?? 'Could not start game')
      }
    } catch {
      setStartError('Could not start game — please try again.')
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-xs">
      {/* Room code */}
      <div className="text-center w-full">
        <p className="text-sm text-kopi-brown/60 font-body mb-3">Share this code:</p>
        <div className="flex items-center gap-3 bg-white rounded-2xl px-6 py-4 shadow-sm border border-kopi-brown/15">
          <span className="font-mono text-4xl font-bold text-kopi-brown tracking-[0.2em] flex-1">{roomCode}</span>
          {/* Copy code */}
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
          {/* Share link */}
          <button
            onClick={handleShare}
            className="text-kopi-brown/40 hover:text-kopi-brown transition-colors cursor-pointer"
            aria-label="Share invite link"
          >
            {sharedLink ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            )}
          </button>
        </div>
        {sharedLink && (
          <p className="text-xs text-kopi-brown/50 font-body mt-1.5">Link copied!</p>
        )}
      </div>

      {/* Player list */}
      <div className="w-full bg-white/60 rounded-2xl p-4 border border-kopi-brown/10">
        <p className="text-xs font-display font-bold text-kopi-brown/50 uppercase tracking-wide mb-2">
          Players ({activePlayers.length}/12)
        </p>
        <div className="flex flex-col gap-1.5">
          {activePlayers.map(p => (
            <div key={p.device_id} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${p.is_host ? 'bg-purple-500' : 'bg-hawker-green'}`} />
              <span className="text-sm font-body text-kopi-brown truncate">
                {p.player_name}
                {p.is_host && <span className="text-xs text-purple-500 ml-1">(host)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Host settings */}
      {isHost && (
        <div className="w-full flex flex-col gap-4">
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
                  onClick={() => handleStartLevel(l)}
                  className={`w-11 h-11 rounded-xl font-display font-bold text-sm cursor-pointer transition-all ${
                    startLevel === l
                      ? 'bg-purple-600 text-white shadow-md scale-105'
                      : 'bg-kopi-brown/10 hover:bg-kopi-brown/20 text-kopi-brown'
                  }`}
                >
                  L{l}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          {startError && (
            <p className="text-xs text-hawker-red font-body text-center">{startError}</p>
          )}
          <button
            onClick={handleStartGame}
            disabled={activePlayers.length < 2}
            className="w-full px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-600/90
              text-white font-display font-bold text-lg shadow-lg cursor-pointer transition-colors
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Game
            {activePlayers.length < 2 && (
              <span className="block text-xs font-body font-normal opacity-70">
                Need at least 2 players
              </span>
            )}
          </button>
        </div>
      )}

      {!isHost && room && (
        <div className="w-full flex flex-col items-center gap-3">
          {/* Read-only game settings so guests know what they're about to play */}
          <div className="w-full bg-white/60 rounded-2xl px-4 py-3 border border-kopi-brown/10 text-center">
            <p className="text-xs font-display font-bold text-kopi-brown/50 uppercase tracking-wide mb-1">
              Game settings
            </p>
            <p className="text-sm font-body text-kopi-brown">
              First to{' '}
              <span className="font-bold">{room.win_target} drinks</span>
              {' · '}Starting at{' '}
              <span className="font-bold">Level {room.start_level}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 text-kopi-brown/50">
            <motion.div
              className="w-2 h-2 rounded-full bg-kopi-brown/40"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
            <span className="text-sm font-body">Waiting for host to start...</span>
          </div>
        </div>
      )}

      {!isHost && !room && (
        <div className="flex items-center gap-2 text-kopi-brown/50">
          <motion.div
            className="w-2 h-2 rounded-full bg-kopi-brown/40"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="text-sm font-body">Waiting for host to start...</span>
        </div>
      )}

      <button
        onClick={onBack}
        className="text-xs text-kopi-brown/40 hover:text-kopi-brown/60 transition-colors cursor-pointer font-body"
      >
        Leave room
      </button>
    </div>
  )
}

// ── Main lobby page ───────────────────────────────────────────────────────────

export default function PartyLobby() {
  const location = useLocation()
  const locationState = location.state as { rejoinCode?: string } | null
  const [searchParams, setSearchParams] = useSearchParams()

  const [view, setView] = useState<LobbyView>('choose')
  const [roomCode, setRoomCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('longq_kopi_name') ?? ''
  )

  const deviceId = getOrCreateDeviceId()

  // Handle ?join=XXXXXX URL param (shareable invite link)
  useEffect(() => {
    const joinParam = searchParams.get('join')
    if (!joinParam) return
    setJoinCode(joinParam.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))
    setSearchParams({}, { replace: true })
    setView('join')
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Handle rejoin (return-to-room flow) — show contextual rejoin view
  useEffect(() => {
    const rejoin = locationState?.rejoinCode
    if (!rejoin) return
    setJoinCode(rejoin)
    setView('rejoin')
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = useCallback(async () => {
    if (!playerName.trim()) { setError('Enter your name first'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/party/create-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, playerName: playerName.trim(), winTarget: 20, startLevel: 1 }),
      })
      const data = await res.json() as { roomCode?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not create room'); return }
      localStorage.setItem('longq_kopi_name', playerName.trim())
      trackEvent('party_room_created')
      setRoomCode(data.roomCode!)
      setView('waiting')
    } catch {
      setError('Could not create room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [deviceId, playerName])

  const handleJoin = useCallback(async () => {
    const code = joinCode.trim()
    if (code.length !== 6) { setError('Enter the full 6-character code'); return }
    if (!playerName.trim()) { setError('Enter your name first'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/party/join-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode: code, deviceId, playerName: playerName.trim() }),
      })
      const data = await res.json() as { roomCode?: string; error?: string }
      if (!res.ok) { setError(data.error ?? 'Could not join room'); return }
      localStorage.setItem('longq_kopi_name', playerName.trim())
      trackEvent('party_room_joined')
      setRoomCode(data.roomCode!)
      setView('waiting')
    } catch {
      setError('Could not join room — please try again.')
    } finally {
      setLoading(false)
    }
  }, [joinCode, deviceId, playerName])

  const nameInput = (
    <div className="w-full">
      <p className="text-xs font-display font-bold text-kopi-brown/50 uppercase tracking-wide mb-2">
        Your name
      </p>
      <input
        type="text"
        maxLength={20}
        placeholder="e.g. Alice"
        value={playerName}
        onChange={e => { setPlayerName(e.target.value); setError('') }}
        className="w-full px-4 py-3 rounded-2xl border-2 border-kopi-brown/20 bg-white
          font-body text-kopi-brown text-base focus:outline-none focus:border-purple-400
          placeholder:text-kopi-brown/25"
      />
    </div>
  )

  return (
    <PageWrapper className="flex flex-col h-full bg-cream">
      <div className="p-4 flex-shrink-0">
        <BackButton />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        <h1 className="font-display text-3xl font-bold text-kopi-brown mb-2 text-center">
          Party Mode
        </h1>
        <p className="text-sm text-kopi-brown/60 font-body mb-8 text-center">
          Up to 12 players race to serve drinks. First to the target wins!
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
                className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-600/90 text-white
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

          {/* ── Create ── */}
          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col gap-5 w-full max-w-xs"
            >
              {nameInput}
              {error && <p className="text-xs text-hawker-red font-body text-center">{error}</p>}
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-600/90 text-white
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
                deviceId={deviceId}
                playerName={playerName}
                onBack={() => { setView('choose'); setRoomCode('') }}
              />
            </motion.div>
          )}

          {/* ── Rejoin (return-to-room context) ── */}
          {view === 'rejoin' && (
            <motion.div
              key="rejoin"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center gap-5 w-full max-w-xs"
            >
              <div className="text-center">
                <p className="text-sm text-kopi-brown/60 font-body mb-1">Returning to room</p>
                <span className="font-mono text-3xl font-bold text-kopi-brown tracking-[0.2em]">{joinCode}</span>
              </div>
              {nameInput}
              {error && <p className="text-xs text-hawker-red font-body text-center">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-600/90
                  text-white font-display font-bold text-lg shadow-lg cursor-pointer transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Rejoining...' : 'Rejoin Room'}
              </button>
              <button
                onClick={() => { setView('choose'); setJoinCode(''); setError('') }}
                className="text-sm text-kopi-brown/50 hover:text-kopi-brown/70 transition-colors cursor-pointer font-body"
              >
                Back to menu
              </button>
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
              {nameInput}
              <input
                type="text"
                maxLength={6}
                placeholder="ENTER CODE"
                value={joinCode}
                onChange={e => {
                  setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))
                  setError('')
                }}
                className="w-full text-center font-mono text-3xl font-bold tracking-[0.25em]
                  py-4 rounded-2xl border-2 border-kopi-brown/20 bg-white text-kopi-brown
                  focus:outline-none focus:border-purple-400 placeholder:text-kopi-brown/20
                  placeholder:tracking-widest"
              />
              {error && <p className="text-xs text-hawker-red font-body">{error}</p>}
              <button
                onClick={handleJoin}
                disabled={loading || joinCode.length !== 6}
                className="w-full px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-600/90
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
