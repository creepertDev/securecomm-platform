import { useAdmin } from '../context/AdminContext'

const ACTION_STYLE = {
  approved:    { dot: 'bg-green-500',  text: 'text-green-400',  label: 'Approved' },
  rejected:    { dot: 'bg-red-500',    text: 'text-red-400',    label: 'Rejected' },
  user_joined: { dot: 'bg-blue-500',   text: 'text-blue-400',   label: 'Joined'   },
  user_left:   { dot: 'bg-white/30',   text: 'text-white/40',   label: 'Left'     },
}

export default function AuditLog() {
  const { auditLog } = useAdmin()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide text-white">Audit Log</h1>
        <p className="text-sm text-white/30 mt-1">All admin actions this session</p>
      </div>

      {auditLog.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">📋</span>
          <p className="text-white/30 text-sm">No actions recorded yet</p>
        </div>
      ) : (
        <div className="bg-dark-700 border border-white/5 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">TIME</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">ACTION</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">ACTOR</th>
                <th className="text-left text-[10px] tracking-widest text-white/30 px-5 py-3">TARGET</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => {
                const style = ACTION_STYLE[entry.action] ?? ACTION_STYLE.user_joined
                return (
                  <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-xs text-white/30 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleTimeString()}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                        <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-white/60">{entry.actor}</td>
                    <td className="px-5 py-3 text-sm text-white">{entry.target ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
