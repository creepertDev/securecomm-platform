import { useAdmin } from '../context/AdminContext'

const ROLE_BADGE = {
  personnel: 'bg-green-900/40 text-green-400 border-green-900/60',
  family:    'bg-blue-900/40 text-blue-400 border-blue-900/60',
  veteran:   'bg-amber-900/40 text-amber-400 border-amber-900/60',
  admin:     'bg-purple-900/40 text-purple-400 border-purple-900/60',
}

export default function Members() {
  const { onlineUsers } = useAdmin()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide text-white">Active Personnel</h1>
        <p className="text-sm text-white/30 mt-1">{onlineUsers.length} currently online</p>
      </div>

      {onlineUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">👥</span>
          <p className="text-white/30 text-sm">No personnel currently online</p>
        </div>
      ) : (
        <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">PERSONNEL</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">ROLE</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {onlineUsers.map((u, i) => (
                <tr
                  key={u.userId}
                  className={`border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.02] ${
                    i % 2 === 0 ? '' : 'bg-white/[0.01]'
                  }`}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{u.avatar}</span>
                      <span className="text-sm text-white font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded border text-[11px] font-semibold capitalize
                      ${ROLE_BADGE[u.role] ?? ROLE_BADGE.personnel}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs text-green-500">Online</span>
                    </div>
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
