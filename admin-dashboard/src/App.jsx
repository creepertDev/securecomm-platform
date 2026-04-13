import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminProvider, useAdmin } from './context/AdminContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Pending from './pages/Pending'
import Groups from './pages/Groups'
import Members from './pages/Members'
import AuditLog from './pages/AuditLog'
import Sidebar from './components/Sidebar'

function AppRoutes() {
  const { isAuthenticated } = useAdmin()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  return (
    <div className="flex h-screen bg-dark-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/pending" element={<Pending />} />
          <Route path="/groups"  element={<Groups />} />
          <Route path="/members" element={<Members />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AdminProvider>
      <BrowserRouter basename="/hq">
        <AppRoutes />
      </BrowserRouter>
    </AdminProvider>
  )
}
