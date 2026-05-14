import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

const ROLE_BADGE = {
  personnel: 'bg-green-900/40 text-green-400 border-green-900/60',
  family:    'bg-blue-900/40 text-blue-400 border-blue-900/60',
  veteran:   'bg-amber-900/40 text-amber-400 border-amber-900/60',
  admin:     'bg-purple-900/40 text-purple-400 border-purple-900/60',
}

export default function Members() {
  const { onlineUsers, allUsers, generateWg } = useAdmin()
  const [generating, setGenerating] = useState({})

  const onlineIds = new Set(onlineUsers.map(u => u.userId))

  async function handleGenerateWg(userId, name) {
    setGenerating(g => ({ ...g, [userId]: true }))
    generateWg(userId)
    // Reset button after 3s (success/fail both handled by action_ok toast on backend)
    setTimeout(() => setGenerating(g => ({ ...g, [userId]: false })), 3000)
  }

  const users = allUsers.length > 0 ? allUsers : onlineUsers

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide text-white">Personnel</h1>
        <p className="text-sm text-white/30 mt-1">
          {users.length} approved · {onlineUsers.length} online
        </p>
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">👥</span>
          <p className="text-white/30 text-sm">No approved personnel yet</p>
        </div>
      ) : (
        <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">PERSONNEL</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">ROLE</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">STATUS</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">VPN</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.userId}
                  className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? '' : 'bg-white/[0.01]'
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{u.avatar}</span>
                      <div>
                        <div className="text-sm text-white font-medium">{u.name}</div>
                        <div className="text-[10px] text-white/20 font-mono mt-0.5">{u.userId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold capitalize
                      ${ROLE_BADGE[u.role] ?? ROLE_BADGE.personnel}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {onlineIds.has(u.userId) ? (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span className="text-xs text-green-500">Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        <span className="text-xs text-white/30">Offline</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleGenerateWg(u.userId, u.name)}
                      disabled={generating[u.userId]}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded border transition-colors
                        border-green-900/50 text-green-500/70 hover:text-green-400 hover:border-green-700
                        disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {generating[u.userId] ? 'Sending…' : '⟳ VPN Config'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
