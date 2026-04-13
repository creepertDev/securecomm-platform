import { useState, useEffect, useRef, useCallback } from 'react';
import { connect, send, disconnect } from './ws.js';
import SplashScreen   from './screens/SplashScreen.jsx';
import LoginScreen    from './screens/LoginScreen.jsx';
import RegisterScreen from './screens/RegisterScreen.jsx';
import PendingScreen  from './screens/PendingScreen.jsx';
import VpnScreen      from './screens/VpnScreen.jsx';
import GroupsScreen   from './screens/GroupsScreen.jsx';
import ChatScreen     from './screens/ChatScreen.jsx';
import RejectedScreen from './screens/RejectedScreen.jsx';
import './index.css';

export default function App() {
  const [screen, setScreen] = useState('splash');
  const [wsStatus, setWsStatus] = useState('disconnected');

  const [user, setUser]       = useState(null);
  const [reqId, setReqId]     = useState(null);
  const [wgConfig, setWgConfig] = useState(null);

  const [groups, setGroups]       = useState([]);
  const [globalMsgs, setGlobal]   = useState([]);
  const [groupMsgs, setGroupMsgs] = useState({});
  const [onlineUsers, setOnline]  = useState([]);
  const [activeGroup, setActive]  = useState(null);

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
        if (msg.wgConfig) {
          setWgConfig(msg.wgConfig);
          setScreen('vpn'); // First login — show VPN setup
        } else {
          setScreen('groups');
        }
        break;

      case 'rejected':
        setScreen('rejected');
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
        if (msg.wgConfig) setWgConfig(msg.wgConfig);
        setScreen('groups'); // Returning users go straight to groups
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
        if (msg.group) setGroups(prev =>
          prev.find(g => g.groupId === msg.group.groupId) ? prev : [...prev, msg.group]
        );
        break;

      case 'group_removed':
        setGroups(prev => prev.filter(g => g.groupId !== msg.groupId));
        setGroupMsgs(prev => { const n = { ...prev }; delete n[msg.groupId]; return n; });
        break;

      case 'user_joined':
      case 'user_left':
        setOnline(msg.users || []);
        break;
    }
  }, []);

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
    setUser(null); setGroups([]); setGlobal([]);
    setGroupMsgs({}); setOnline([]); setActive(null); setWgConfig(null);
    setScreen('login');
  };

  const openChat = (group) => {
    setActive(group);
    joinGroup(group.groupId);
    setScreen('chat');
  };

  if (screen === 'rejected')  return <RejectedScreen onBack={() => setScreen('login')} />;
  if (screen === 'splash')    return <SplashScreen />;
  if (screen === 'login')     return <LoginScreen onLogin={doLogin} onGoRegister={() => setScreen('register')} wsStatus={wsStatus} />;
  if (screen === 'register')  return <RegisterScreen onRegister={doRegister} onBack={() => setScreen('login')} />;
  if (screen === 'pending')   return <PendingScreen reqId={reqId} />;
  if (screen === 'vpn')       return <VpnScreen config={wgConfig} onContinue={() => setScreen('groups')} />;
  if (screen === 'groups')    return (
    <GroupsScreen
      user={user} groups={groups} onlineUsers={onlineUsers} wsStatus={wsStatus}
      onOpenChat={openChat} onLogout={doLogout}
      onShowVpn={wgConfig ? () => setScreen('vpn') : null}
    />
  );
  if (screen === 'chat') return (
    <ChatScreen
      user={user} group={activeGroup}
      messages={activeGroup ? (groupMsgs[activeGroup.groupId] || []) : globalMsgs}
      onSend={doSend} onTyping={doTyping} onBack={() => setScreen('groups')}
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
