import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

const AdminContext = createContext(null)

const DEVICE_KEY = import.meta.env.VITE_DEVICE_KEY || 'sc-dk-inv-works-2024-secure'
const BASE_WS    = import.meta.env.VITE_WS_URL  || `ws://${window.location.hostname}:3000`
const API_URL    = import.meta.env.VITE_API_URL  || `http://${window.location.hostname}:3000`
const WS_URL     = `${BASE_WS}?dk=${encodeURIComponent(DEVICE_KEY)}`

export function AdminProvider({ children }) {
  const wsRef           = useRef(null)
  const reconnectTimer  = useRef(null)

  const [isConnected,    setIsConnected]    = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [adminId,        setAdminId]        = useState(null)
  const [onlineUsers,    setOnlineUsers]    = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [messageCount,   setMessageCount]   = useState(0)
  const [uptime,         setUptime]         = useState(0)
  const [auditLog,       setAuditLog]       = useState([])
  const [groups,         setGroups]         = useState([])   // [{groupId, name, description, members}]
  const [allUsers,       setAllUsers]       = useState([])   // all approved users

  // Poll /status for uptime + message count
  useEffect(() => {
    if (!isAuthenticated) return
    const poll = async () => {
      try {
        const res  = await fetch(`${API_URL}/status`)
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

    ws.onopen  = () => setIsConnected(true)

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      switch (msg.type) {

        case 'admin_welcome':
          setAdminId(msg.userId)
          setIsAuthenticated(true)
          setPendingRequests(msg.pendingRequests ?? [])
          setOnlineUsers(msg.users ?? [])
          setMessageCount(msg.messageCount ?? 0)
          setGroups(msg.groups ?? [])
          setAllUsers(msg.allUsers ?? [])
          break

        case 'login_error':
          alert(msg.message)
          break

        case 'new_request':
          setPendingRequests(prev =>
            prev.find(r => r.reqId === msg.request.reqId) ? prev : [msg.request, ...prev]
          )
          break

        case 'request_resolved':
          setPendingRequests(msg.pendingRequests ?? [])
          if (msg.action === 'approved' && msg.newUser) {
            setAllUsers(prev => [...prev, msg.newUser])
          }
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

        case 'group_created':
          setGroups(prev =>
            prev.find(g => g.groupId === msg.group.groupId) ? prev : [...prev, msg.group]
          )
          break

        case 'group_deleted':
          setGroups(prev => prev.filter(g => g.groupId !== msg.groupId))
          break

        case 'group_updated':
          setGroups(prev => prev.map(g =>
            g.groupId === msg.groupId ? { ...g, members: msg.members } : g
          ))
          break

        default: break
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
    if (wsRef.current?.readyState === WebSocket.OPEN)
      wsRef.current.send(JSON.stringify(data))
  }, [])

  const adminLogin      = useCallback((password) => send({ type: 'admin_login', password }), [send])
  const approveRequest  = useCallback((reqId)    => send({ type: 'approve', reqId }), [send])
  const rejectRequest   = useCallback((reqId)    => send({ type: 'reject', reqId }), [send])
  const createGroup     = useCallback((name, description) => send({ type: 'create_group', name, description }), [send])
  const deleteGroup     = useCallback((groupId)  => send({ type: 'delete_group', groupId }), [send])
  const addMember       = useCallback((groupId, userId) => send({ type: 'add_member', groupId, userId }), [send])
  const removeMember    = useCallback((groupId, userId) => send({ type: 'remove_member', groupId, userId }), [send])

  const logout = useCallback(() => {
    wsRef.current?.close()
    setIsAuthenticated(false)
    setAdminId(null)
    setOnlineUsers([])
    setPendingRequests([])
    setAuditLog([])
    setGroups([])
    setAllUsers([])
  }, [])

  return (
    <AdminContext.Provider value={{
      isConnected, isAuthenticated,
      adminId, onlineUsers, pendingRequests,
      messageCount, uptime, auditLog,
      groups, allUsers,
      adminLogin, approveRequest, rejectRequest,
      createGroup, deleteGroup, addMember, removeMember,
      logout,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export const useAdmin = () => useContext(AdminContext)
