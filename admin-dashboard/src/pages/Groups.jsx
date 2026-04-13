import { useState } from 'react'
import { useAdmin } from '../context/AdminContext'

export default function Groups() {
  const { groups, allUsers, onlineUsers, createGroup, deleteGroup, addMember, removeMember } = useAdmin()
  const [showCreate, setShowCreate] = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newDesc,    setNewDesc]    = useState('')
  const [selected,   setSelected]   = useState(null) // groupId

  const handleCreate = () => {
    if (!newName.trim()) return
    createGroup(newName.trim(), newDesc.trim())
    setNewName('')
    setNewDesc('')
    setShowCreate(false)
  }

  const selectedGroup = groups.find(g => g.groupId === selected)
  const memberIds     = new Set(selectedGroup?.members?.map(m => m.user_id ?? m.userId) ?? [])
  const nonMembers    = allUsers.filter(u => !memberIds.has(u.userId))
  const isOnline      = (userId) => onlineUsers.some(u => u.userId === userId)

  return (
    <div className="p-8 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-wide text-white">Secure Channels</h1>
          <p className="text-sm text-white/30 mt-1">{groups.length} channel{groups.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-green-900/40 hover:bg-green-900/70 border border-green-900/60 text-green-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Channel
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-700 border border-white/10 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-base font-bold mb-4">Create Secure Channel</h2>
            <input
              autoFocus
              placeholder="Channel name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="w-full bg-dark-600 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-800 mb-3"
            />
            <input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              className="w-full bg-dark-600 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-800 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm text-white/40 hover:text-white">Cancel</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-green-900 hover:bg-green-800 text-white text-sm font-semibold rounded-lg">Create</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Groups list */}
        <div className="w-72 shrink-0 flex flex-col gap-2 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-white/20">
              <span className="text-4xl mb-3">🔒</span>
              <p className="text-sm">No channels yet</p>
              <p className="text-xs mt-1">Create one to get started</p>
            </div>
          ) : groups.map(g => (
            <button
              key={g.groupId}
              onClick={() => setSelected(g.groupId)}
              className={`text-left p-4 rounded-xl border transition-colors ${
                selected === g.groupId
                  ? 'bg-green-900/30 border-green-900/60'
                  : 'bg-dark-700 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-white truncate">{g.name}</p>
                  {g.description && (
                    <p className="text-xs text-white/30 mt-0.5 truncate">{g.description}</p>
                  )}
                </div>
                <span className="text-xs text-white/30 ml-2 mt-0.5 shrink-0">
                  {g.members?.length ?? 0} members
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Group detail */}
        <div className="flex-1 min-w-0">
          {!selectedGroup ? (
            <div className="flex items-center justify-center h-full text-white/20">
              <p className="text-sm">Select a channel to manage members</p>
            </div>
          ) : (
            <div className="bg-dark-700 border border-white/5 rounded-xl p-6 h-full flex flex-col">
              {/* Group header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedGroup.name}</h2>
                  {selectedGroup.description && (
                    <p className="text-sm text-white/40 mt-1">{selectedGroup.description}</p>
                  )}
                </div>
                <button
                  onClick={() => { deleteGroup(selectedGroup.groupId); setSelected(null) }}
                  className="text-xs text-red-500/60 hover:text-red-400 border border-red-900/30 hover:border-red-900/60 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete Channel
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Current members */}
                <div className="flex flex-col">
                  <p className="text-[10px] tracking-widest text-white/30 mb-3">
                    MEMBERS ({selectedGroup.members?.length ?? 0})
                  </p>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {(selectedGroup.members ?? []).length === 0 ? (
                      <p className="text-xs text-white/20 py-4 text-center">No members yet</p>
                    ) : (selectedGroup.members ?? []).map(m => {
                      const uid  = m.user_id ?? m.userId
                      const online = isOnline(uid)
                      return (
                        <div key={uid} className="flex items-center gap-2.5 p-2 rounded-lg bg-dark-600">
                          <span className="text-lg">{m.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{m.name}</p>
                            <p className="text-[10px] text-white/30 capitalize">{m.role}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-white/20'}`} />
                            <button
                              onClick={() => removeMember(selectedGroup.groupId, uid)}
                              className="text-red-500/50 hover:text-red-400 text-xs px-2 py-0.5 rounded transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Add members */}
                <div className="flex flex-col">
                  <p className="text-[10px] tracking-widest text-white/30 mb-3">
                    ADD PERSONNEL ({nonMembers.length} available)
                  </p>
                  <div className="flex-1 overflow-y-auto space-y-1.5">
                    {nonMembers.length === 0 ? (
                      <p className="text-xs text-white/20 py-4 text-center">All users are members</p>
                    ) : nonMembers.map(u => {
                      const online = isOnline(u.userId)
                      return (
                        <div key={u.userId} className="flex items-center gap-2.5 p-2 rounded-lg bg-dark-600/50">
                          <span className="text-lg">{u.avatar}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/70 truncate">{u.name}</p>
                            <p className="text-[10px] text-white/30 capitalize">{u.role}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-green-500' : 'bg-white/20'}`} />
                            <button
                              onClick={() => addMember(selectedGroup.groupId, u.userId)}
                              className="text-green-500/70 hover:text-green-400 text-xs px-2 py-0.5 rounded transition-colors"
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
