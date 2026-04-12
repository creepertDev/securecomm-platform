import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

const AdminContext = createContext(null)

// Reads WS URL from env, falls back to same host as the page
const WS_URL = import.meta.env.VITE_WS_URL || `ws://${window.location.hostname}:3000`
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`

export function AdminProvider({ children }) {
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const [isConnected, setIsConnected] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId, setAdminId] = useState(null)

  const [onlineUsers, setOnlineUsers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [messageCount, setMessageCount] = useState(0)
  const [uptime, setUptime] = useState(0)
  const [auditLog, setAuditLog] = useState([])

  // Poll /status for uptime + message count
  useEffect(() => {
    if (!isAuthenticated) return
    const poll = async () => {
      try {
        const res = await fetch(`${API_URL}/status`)
        const data = await res.json()
        setUptime(data.uptime ?? 0)
        setMessageCount(data.messageCount ?? 0)
      } catch { /* ignore */ }
    }
    poll()
    const id = setInterval(poll, 10_000)
    return () => clearInterval(id)
  }, [isAuthenticated])

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return
    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => setIsConnected(true)

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {
        case 'admin_welcome':
          setAdminId(msg.userId)
          setIsAuthenticated(true)
          setPendingRequests(msg.pendingRequests ?? [])
          setOnlineUsers(msg.users ?? [])
          setMessageCount(msg.messageCount ?? 0)
          break

        case 'login_error':
          alert(msg.message)
          break

        case 'new_request':
          setPendingRequests(prev => {
            if (prev.find(r => r.reqId === msg.request.reqId)) return prev
            return [msg.request, ...prev]
          })
          break

        case 'request_resolved':
          setPendingRequests(msg.pendingRequests ?? [])
          setAuditLog(prev => [{
            id: Date.now(),
            action: msg.action,
            actor: 'HQ Admin',
            target: msg.name,
            created_at: new Date().toISOString(),
          }, ...prev])
          break

        case 'user_joined':
        case 'user_left':
          setOnlineUsers(msg.users ?? [])
          break

        case 'action_ok':
          break // silently ack

        default:
          break
      }
    }

    ws.onclose = () => {
      setIsConnected(false)
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.onerror = () => ws.close()
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data))
    }
  }, [])

  const adminLogin = useCallback((password) => {
    send({ type: 'admin_login', password })
  }, [send])

  const approveRequest = useCallback((reqId) => {
    send({ type: 'approve', reqId })
  }, [send])

  const rejectRequest = useCallback((reqId) => {
    send({ type: 'reject', reqId })
  }, [send])

  const logout = useCallback(() => {
    wsRef.current?.close()
    setIsAuthenticated(false)
    setAdminId(null)
    setOnlineUsers([])
    setPendingRequests([])
    setAuditLog([])
  }, [])

  return (
    <AdminContext.Provider value={{
      isConnected, isAuthenticated,
      adminId, onlineUsers, pendingRequests,
      messageCount, uptime, auditLog,
      adminLogin, approveRequest, rejectRequest, logout,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
