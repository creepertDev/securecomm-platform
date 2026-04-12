import { useAdmin } from '../context/AdminContext'

function timeSince(ms) {
  const s = Math.floor((Date.now() - ms) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ago`
}

export default function Pending() {
  const { pendingRequests, approveRequest, rejectRequest } = useAdmin()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-bold tracking-wide text-white">Pending Approvals</h1>
        <p className="text-sm text-white/30 mt-1">
          {pendingRequests.length === 0
            ? 'No pending requests'
            : `${pendingRequests.length} request${pendingRequests.length > 1 ? 's' : ''} awaiting review`}
        </p>
      </div>

      {pendingRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-5xl mb-4">✅</span>
          <p className="text-white/30 text-sm">All clear. No pending requests.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pendingRequests.map(req => (
            <div key={req.reqId} className="bg-dark-700 border border-white/5 rounded-xl p-5">
              {/* Avatar + info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-dark-600 border border-white/10 flex items-center justify-center text-2xl">
                  {req.avatar}
                </div>
                <div>
                  <p className="font-semibold text-white">{req.name}</p>
                  <p className="text-xs text-white/40 capitalize">{req.role}</p>
                </div>
              </div>

              {/* Timestamp */}
              <p className="text-xs text-white/25 mb-4">Requested {timeSince(req.ts)}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => approveRequest(req.reqId)}
                  className="flex-1 bg-green-900/40 hover:bg-green-900/70 border border-green-900/60 text-green-400 text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => rejectRequest(req.reqId)}
                  className="flex-1 bg-red-900/20 hover:bg-red-900/40 border border-red-900/40 text-red-400 text-sm font-semibold py-2 rounded-lg transition-colors"
                >
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
