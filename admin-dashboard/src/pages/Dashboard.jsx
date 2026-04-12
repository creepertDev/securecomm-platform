import { useAdmin } from '../context/AdminContext'

function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="bg-dark-700 border border-white/5 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        {accent && <span className="w-2 h-2 rounded-full bg-green-500 mt-1" />}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40 mt-1 tracking-wide">{label}</p>
      {sub && <p className="text-xs text-green-700 mt-1">{sub}</p>}
    </div>
  )
}

function fmtUptime(s) {
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export default function Dashboard() {
  const { onlineUsers, pendingRequests, messageCount, uptime, auditLog } = useAdmin()

  const stats = [
    { icon: '🟢', label: 'ONLINE PERSONNEL', value: onlineUsers.length, accent: true },
    { icon: '⏳', label: 'PENDING APPROVALS', value: pendingRequests.length, sub: pendingRequests.length > 0 ? 'Requires action' : null },
    { icon: '💬', label: 'TOTAL MESSAGES', value: messageCount },
    { icon: '⏱', label: 'SERVER UPTIME', value: fmtUptime(uptime) },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide text-white">Command Dashboard</h1>
        <p className="text-sm text-white/30 mt-1">Real-time platform overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Online users */}
        <div className="bg-dark-700 border border-white/5 rounded-xl p-5">
          <h2 className="text-xs tracking-widest text-white/40 mb-4">ONLINE NOW</h2>
          {onlineUsers.length === 0 ? (
            <p className="text-sm text-white/20 py-4 text-center">No users online</p>
          ) : (
            <ul className="space-y-2">
              {onlineUsers.map(u => (
                <li key={u.userId} className="flex items-center gap-3 p-2 rounded-lg bg-dark-600">
                  <span className="text-xl">{u.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{u.name}</p>
                    <p className="text-xs text-white/30 capitalize">{u.role}</p>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent activity */}
        <div className="bg-dark-700 border border-white/5 rounded-xl p-5">
          <h2 className="text-xs tracking-widest text-white/40 mb-4">RECENT ACTIVITY</h2>
          {auditLog.length === 0 ? (
            <p className="text-sm text-white/20 py-4 text-center">No activity yet</p>
          ) : (
            <ul className="space-y-2">
              {auditLog.slice(0, 8).map(entry => (
                <li key={entry.id} className="flex items-start gap-3 p-2 rounded-lg bg-dark-600">
                  <span className="text-base mt-0.5">
                    {entry.action === 'approved' ? '✅' : entry.action === 'rejected' ? '❌' : '📝'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white">
                      <span className="capitalize">{entry.action}</span>
                      {entry.target && <span className="text-white/50"> · {entry.target}</span>}
                    </p>
                    <p className="text-xs text-white/30">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
