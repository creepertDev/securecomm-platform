import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function Login() {
  const { adminLogin, isConnected } = useAdmin()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!password) return
    setLoading(true)
    adminLogin(password)
    setTimeout(() => setLoading(false), 4000)
  }

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-900/20 border border-green-900/40 mb-4">
            <span className="text-3xl">🛡</span>
          </div>
          <h1 className="text-xl font-bold tracking-widest text-white">SECURECOMM</h1>
          <p className="text-xs text-white/30 tracking-widest mt-1">HQ COMMAND CENTRE</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-dark-700 border border-white/5 rounded-xl p-8 space-y-5">
          <div>
            <label className="block text-xs text-white/40 tracking-widest mb-2">HQ PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter HQ password"
              autoFocus
              className="w-full bg-dark-600 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-800 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConnected}
            className="w-full bg-green-900 hover:bg-green-800 disabled:opacity-40 text-white font-semibold py-3 rounded-lg text-sm tracking-widest transition-colors"
          >
            {loading ? 'AUTHENTICATING…' : 'LOGIN'}
          </button>

          <div className="flex items-center justify-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
            <span className="text-xs text-white/20">
              {isConnected ? 'Secure connection established' : 'Connecting to server…'}
            </span>
          </div>
        </form>
      </div>
    </div>
  )
}
