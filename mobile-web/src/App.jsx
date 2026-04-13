import { useState, useEffect, useRef, useCallback } from 'react';
import { connect, send, disconnect } from './ws.js';
import SplashScreen   from './screens/SplashScreen.jsx';
import LoginScreen    from './screens/LoginScreen.jsx';
import RegisterScreen from './screens/RegisterScreen.jsx';
import PendingScreen  from './screens/PendingScreen.jsx';
import GroupsScreen   from './screens/GroupsScreen.jsx';
import ChatScreen     from './screens/ChatScreen.jsx';
import './index.css';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [wsStatus, setWsStatus] = useState('disconnected');

  // User state
  const [user, setUser]     = useState(null); // { userId, name, role, avatar, token }
  const [reqId, setReqId]   = useState(null);

  // Chat state
  const [groups, setGroups]       = useState([]);
  const [globalMsgs, setGlobal]   = useState([]);
  const [groupMsgs, setGroupMsgs] = useState({}); // groupId → []
  const [onlineUsers, setOnline]  = useState([]);
  const [activeGroup, setActive]  = useState(null); // { groupId, groupName }

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'register_pending':
        setReqId(msg.reqId);
        setScreen('pending');
        break;

      case 'register_error':
        alert(msg.message || 'Registration failed.');
        break;

      case 'approved':
        setUser({ userId: msg.userId, name: msg.name, role: msg.role, avatar: msg.avatar, token: msg.token });
        if (msg.token) localStorage.setItem('sc_token', msg.token);
        setScreen('groups');
        break;

      case 'rejected':
        alert(msg.message || 'Access denied by HQ.');
        setScreen('login');
        break;

      case 'login_error':
        alert(msg.message || 'Invalid credentials.');
        break;

      case 'welcome':
        setUser({ userId: msg.userId, name: msg.name, role: msg.role, avatar: msg.avatar, token: msg.token });
        if (msg.token) localStorage.setItem('sc_token', msg.token);
        setGlobal((msg.history || []).map(normalizeMsg));
        setOnline(msg.users || []);
        setGroups(msg.groups || []);
        setScreen('groups');
        break;

      case 'message': {
        const m = normalizeMsg(msg);
        if (m.groupId) {
          setGroupMsgs(prev => ({ ...prev, [m.groupId]: [...(prev[m.groupId] || []), m] }));
        } else {
          setGlobal(prev => [...prev, m]);
        }
        break;
      }

      case 'group_history':
        if (msg.groupId) {
          setGroupMsgs(prev => ({ ...prev, [msg.groupId]: (msg.messages || []).map(normalizeMsg) }));
        }
        break;

      case 'added_to_group':
        if (msg.group) setGroups(prev => prev.find(g => g.groupId === msg.group.groupId) ? prev : [...prev, msg.group]);
        break;

      case 'group_removed':
        setGroups(prev => prev.filter(g => g.groupId !== msg.groupId));
        setGroupMsgs(prev => { const n = { ...prev }; delete n[msg.groupId]; return n; });
        break;

      case 'user_joined':
      case 'user_left':
        setOnline(msg.users || []);
        break;

      case 'group_created':
      case 'group_updated':
        // handled server-side; groups refreshed via welcome/added_to_group
        break;
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    setTimeout(() => {
      connect(handleMessage, setWsStatus);
      setScreen('login');
    }, 1800);
    return () => disconnect();
  }, []);

  const doLogin    = (name, pass) => send({ type: 'login', name, password: pass });
  const doRegister = (name, role, pass) => send({ type: 'register', name, role, password: pass });
  const doSend     = (text, groupId) => send({ type: 'message', text, ...(groupId ? { groupId } : {}) });
  const doTyping   = (isTyping, groupId) => send({ type: 'typing', isTyping, ...(groupId ? { groupId } : {}) });
  const joinGroup  = (groupId) => send({ type: 'join_group', groupId });

  const doLogout = () => {
    localStorage.removeItem('sc_token');
    setUser(null);
    setGroups([]);
    setGlobal([]);
    setGroupMsgs({});
    setOnline([]);
    setActive(null);
    setScreen('login');
  };

  const openChat = (group) => {
    setActive(group);
    joinGroup(group.groupId);
    setScreen('chat');
  };

  if (screen === 'splash') return <SplashScreen />;
  if (screen === 'login')  return <LoginScreen  onLogin={doLogin} onGoRegister={() => setScreen('register')} wsStatus={wsStatus} />;
  if (screen === 'register') return <RegisterScreen onRegister={doRegister} onBack={() => setScreen('login')} />;
  if (screen === 'pending')  return <PendingScreen reqId={reqId} />;
  if (screen === 'groups')   return (
    <GroupsScreen
      user={user}
      groups={groups}
      onlineUsers={onlineUsers}
      wsStatus={wsStatus}
      onOpenChat={openChat}
      onLogout={doLogout}
    />
  );
  if (screen === 'chat') return (
    <ChatScreen
      user={user}
      group={activeGroup}
      messages={activeGroup ? (groupMsgs[activeGroup.groupId] || []) : globalMsgs}
      onSend={doSend}
      onTyping={doTyping}
      onBack={() => setScreen('groups')}
    />
  );
  return null;
}

function normalizeMsg(m) {
  const from = m.from || {};
  return {
    id:      m.id      || Math.random().toString(36),
    userId:  from.userId || m.from_user_id || '',
    name:    from.name   || m.from_name    || 'Unknown',
    role:    from.role   || m.from_role    || '',
    avatar:  from.avatar || m.from_avatar  || '👤',
    text:    m.text      || '',
    groupId: m.groupId   || null,
    ts:      m.ts        || Date.now(),
  };
}
