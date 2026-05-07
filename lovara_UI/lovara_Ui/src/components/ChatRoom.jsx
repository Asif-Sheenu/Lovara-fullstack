import React, { useState, useEffect, useRef } from "react";
import { clearExpiredToken } from "../services/api";

export default function ChatRoom({ roomId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);
  const scrollRef = useRef(null);
  const token = localStorage.getItem("access") || localStorage.getItem("token");

  // ✅ Get current user's ID for reliable left/right comparison
  const myId = currentUser?.id;

  useEffect(() => {
    clearExpiredToken();
    if (!roomId || !token) return;

    let unmounted = false;
    let timer;

    function connect() {
      if (unmounted) return;
      if (!token || token === "null") return;

      const socket = new WebSocket(`ws://13.234.111.32:8000/ws/chat/${roomId}/?token=${token}`);
      ws.current = socket;

      socket.onopen = () => {
        if (unmounted) { socket.close(); return; }
        console.log(`✅ Chat connected to room ${roomId}`);
        setConnected(true);
        setMessages([]);
      };

      socket.onmessage = (e) => {
        const data = JSON.parse(e.data);
        setMessages(prev => {
          // Avoid duplicate messages (history + live)
          const exists = prev.some(
            m => m.timestamp === data.timestamp && m.sender_id === data.sender_id
          );
          if (exists) return prev;
          return [...prev, data];
        });
      };

      socket.onclose = () => {
        setConnected(false);
        if (!unmounted) timer = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => console.error("Chat Socket Error", err);
    }

    connect();

    return () => {
      unmounted = true;
      clearTimeout(timer);
      if (ws.current) {
        ws.current.onopen = null;
        ws.current.onmessage = null;
        ws.current.onerror = null;
        ws.current.onclose = null;
        if (ws.current.readyState === WebSocket.OPEN) ws.current.close();
      }
    };
  }, [roomId, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = (e) => {
    e?.preventDefault();
    if (!input.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ message: input }));
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#fff", borderRadius: 16, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0ece8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#7ab87a" : "#c9705a" }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "#1a1a1a" }}>
            Concierge Room #{roomId}
          </span>
        </div>
        <span style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {connected ? "Connected" : "Reconnecting..."}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, background: "#fdfbf8" }}
      >
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.4 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✦</div>
            <p style={{ fontSize: 13, fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif" }}>Initialize the conversation...</p>
          </div>
        ) : (
          messages.map((m, i) => {
            // ✅ Use sender_id for reliable alignment — no name comparison needed
            const isMe = m.sender_id === myId;
            return (
              <div key={i} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%", display: "flex", flexDirection: "column", gap: 4 }}>
                {/* ✅ Show sender name only for OTHER person's messages */}
                {!isMe && (
                  <span style={{ fontSize: 10, color: "#C9A96E", fontWeight: 600, letterSpacing: "0.05em", paddingLeft: 4 }}>
                    {m.sender}
                  </span>
                )}
                <div style={{
                  padding: "12px 18px",
                  borderRadius: isMe ? "18px 18px 2px 18px" : "18px 18px 18px 2px",
                  background: isMe ? "#1C1917" : "#fff",
                  color: isMe ? "#FAF8F5" : "#1a1a1a",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                  border: isMe ? "none" : "1px solid #f0ece8",
                  fontSize: 14, lineHeight: 1.5
                }}>
                  {m.message}
                </div>
                <div style={{ fontSize: 9, color: "#bbb", textAlign: isMe ? "right" : "left", letterSpacing: "0.05em" }}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ padding: "20px 24px", borderTop: "1px solid #f0ece8", background: "#fff", display: "flex", gap: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Compose your message..."
          style={{ flex: 1, padding: "12px 20px", borderRadius: 12, border: "1px solid #f0ece6", outline: "none", fontSize: 14 }}
        />
        <button
          type="submit"
          style={{ background: "#C9A96E", color: "#1C1917", border: "none", borderRadius: 12, padding: "0 24px", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}