import { useState, useEffect, useRef } from 'react';
import s from './screens.module.css';

export default function ChatScreen({ user, group, messages, onSend, onTyping, onBack }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Prevent screenshot via CSS (best effort on web)
  useEffect(() => {
    document.body.style.setProperty('-webkit-user-select', 'none');
    return () => document.body.style.removeProperty('-webkit-user-select');
  }, []);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    onSend(t, group?.groupId || null);
    setText('');
    clearTyping();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleChange = (e) => {
    setText(e.target.value);
    onTyping(true, group?.groupId);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => clearTyping(), 2000);
  };

  const clearTyping = () => {
    onTyping(false, group?.groupId);
    clearTimeout(typingTimer.current);
  };

  const fmt = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMe = (msg) => msg.userId === user?.userId;

  return (
    <div className={`${s.chatWrap} safe-top safe-bottom`}>
      {/* Header */}
      <div className={s.chatHeader}>
        <button className={s.iconBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div style={{flex:1}}>
          <div style={{fontWeight:700, fontSize:15}}>
            {group?.name || 'Global Channel'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className={s.msgList}>
        {messages.length === 0 && (
          <div className={s.empty} style={{marginTop:60}}>
            <p style={{fontSize:13}}>No messages yet. Say something.</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`${s.msgRow} ${isMe(m) ? s.msgRowMe : ''}`}>
            {!isMe(m) && <span className={s.msgAvatar}>{m.avatar}</span>}
            <div className={`${s.bubble} ${isMe(m) ? s.bubbleMe : s.bubbleThem}`}>
              {!isMe(m) && <div className={s.msgName}>{m.name} · {m.role}</div>}
              <div className={s.msgText}>{m.text}</div>
              <div className={s.msgTime}>{fmt(m.ts)}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`${s.inputBar} safe-bottom`}>
        <textarea
          className={s.msgInput}
          placeholder="Type a message…"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <button className={s.sendBtn} onClick={handleSend} disabled={!text.trim()}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
