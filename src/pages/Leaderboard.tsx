import { useState, useEffect } from 'react'
import PageWrapper from '../components/ui/PageWrapper'
import BackButton from '../components/ui/BackButton'
import { getLeaderboard, type LeaderboardEntry } from '../utils/leaderboard'

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-SG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <PageWrapper className="flex flex-col h-full bg-cream">
      <div className="p-4 flex-shrink-0">
        <BackButton />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-8">
        <h1 className="font-display text-3xl font-bold text-kopi-brown mb-6 text-center">
          Leaderboard
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-kopi-brown/50 text-lg">Loading...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4 opacity-30">
              <svg className="w-16 h-16 mx-auto text-kopi-brown/30" viewBox="0 0 64 64" fill="currentColor">
                <rect x="8" y="20" width="48" height="36" rx="4" opacity="0.3" />
                <rect x="24" y="8" width="16" height="20" rx="2" opacity="0.5" />
              </svg>
            </div>
            <p className="text-kopi-brown/50 text-lg">No scores yet!</p>
            <p className="text-kopi-brown/40 text-sm mt-1">Play a game to get on the board.</p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-kopi-brown text-white">
                    <th className="px-3 py-2 text-center font-display w-12">#</th>
                    <th className="px-3 py-2 text-left font-display">Name</th>
                    <th className="px-3 py-2 text-center font-display">Score</th>
                    <th className="px-3 py-2 text-center font-display">Drinks</th>
                    <th className="px-3 py-2 text-center font-display">Avg</th>
                    <th className="px-3 py-2 text-right font-display">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <tr
                      key={`${entry.name}-${entry.datetime}`}
                      className={i % 2 === 0 ? 'bg-cream/50' : 'bg-white'}
                    >
                      <td className="px-3 py-2 text-center font-bold text-kopi-brown">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className="px-3 py-2 font-semibold text-kopi-brown">{entry.name}</td>
                      <td className="px-3 py-2 text-center font-bold text-hawker-red">{entry.score}</td>
                      <td className="px-3 py-2 text-center text-kopi-brown/70">{entry.drinksServed ?? '—'}</td>
                      <td className="px-3 py-2 text-center text-kopi-brown/70">{entry.avgTime != null ? `${entry.avgTime}s` : '—'}</td>
                      <td className="px-3 py-2 text-right text-kopi-brown/60 text-xs">
                        {formatDate(entry.datetime)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PageWrapper>
  )
}
