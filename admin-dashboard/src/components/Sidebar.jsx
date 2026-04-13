import { NavLink } from 'react-router-dom'
import { useAdmin } from '../context/AdminContext'

const NAV = [
  { to: '/dashboard', icon: '▦',  label: 'Dashboard' },
  { to: '/pending',   icon: '⏳', label: 'Pending'   },
  { to: '/groups',    icon: '🔒', label: 'Channels'  },
  { to: '/members',   icon: '👥', label: 'Members'   },
  { to: '/audit',     icon: '📋', label: 'Audit Log' },
]

export default function Sidebar() {
  const { logout, isConnected, pendingRequests } = useAdmin()

  return (
    <aside className="w-56 bg-dark-800 border-r border-white/5 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-green-700 text-xl">🛡</span>
          <span className="font-bold tracking-widest text-sm text-white">SECURECOMM</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-xs text-white/30">{isConnected ? 'Connected' : 'Reconnecting…'}</span>
        </div>
      </div>

      <div className="px-3 pt-2 pb-1">
        <p className="text-[10px] text-white/20 tracking-widest px-2 py-1">HQ ADMIN</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors relative
               ${isActive
                 ? 'bg-green-900/40 text-green-600 font-medium'
                 : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`
            }
          >
            <span className="text-base w-5 text-center">{icon}</span>
            <span>{label}</span>
            {label === 'Pending' && pendingRequests.length > 0 && (
              <span className="ml-auto bg-green-800 text-green-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-white/5">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <span className="text-base w-5 text-center">⏻</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
