import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

const NotificationContext = createContext();

let notifyGlobal = () => {};

export const notify = (message, type = "info") => {
  notifyGlobal(message, type);
};

export default function NotificationProvider({ children, wsToken }) {
  const [toasts, setToasts] = useState([]);
  const [history, setHistory] = useState([]);
  const wsRef = useRef(null);

  const addToast = (message, type = "info") => {
    const id = Date.now();
    const newNotif = { id, message, type, time: new Date() };
    
    setToasts((prev) => [...prev, newNotif]);
    setHistory((prev) => [newNotif, ...prev].slice(0, 50));

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 8000);
  };

  notifyGlobal = addToast;

  useEffect(() => {
    if (!wsToken) return;

    let unmounted = false;
    let timer;

    function connect() {
      if (unmounted) return;
      
      const token = localStorage.getItem("access") || localStorage.getItem("token");
      if (!token || token === "null") return;

      const socket = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);
      wsRef.current = socket;

      socket.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          let type = data.type || "info";
          
          // Auto-detect warning type for weather alerts if not specified
          if (!data.type && (data.message?.toLowerCase().includes("rain") || 
                            data.message?.toLowerCase().includes("weather") ||
                            data.message?.toLowerCase().includes("warning"))) {
            type = "warning";
          }
          
          addToast(data.message, type);
        } catch (err) {
          console.error("WS Parse Error", err);
        }
      };

      socket.onclose = () => {
        if (!unmounted) {
          timer = setTimeout(connect, 3000);
        }
      };
    }

    connect();
    
    return () => {
      unmounted = true;
      clearTimeout(timer);
      if (wsRef.current) {
        wsRef.current.onopen = null;
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.onclose = null;
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      }
    };
  }, [wsToken]);

  const clearHistory = () => setHistory([]);

  return (
    <NotificationContext.Provider value={{ history, clearHistory }}>
      {typeof children === "function" ? children({ history, clearHistory }) : children}
      {createPortal(
        <div style={{
          position: "fixed", top: 24, right: 24, zIndex: 10000,
          display: "flex", flexDirection: "column", gap: 12,
          pointerEvents: "none"
        }}>
          {toasts.map((t) => (
            <Toast key={t.id} toast={t} onRemove={() => setToasts((prev) => prev.filter(x => x.id !== t.id))} />
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}

function Toast({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const colors = {
    success: "#4a8a62",
    warning: "#C9A96E",
    error: "#c9705a",
    rejected: "#c9705a",
    message: "#C9A96E",
    info: "#C9A96E"
  };

  return (
    <div style={{
      minWidth: 300, padding: "16px 20px", borderRadius: 12,
      background: "#1C1917", color: "#FAF8F5",
      boxShadow: "0 12px 32px rgba(0,0,0,0.25)",
      borderLeft: `4px solid ${colors[toast.type] || colors.info}`,
      display: "flex", alignItems: "center", gap: 14,
      transform: visible ? "translateX(0)" : "translateX(40px)",
      opacity: visible ? 1 : 0,
      transition: "all 0.5s cubic-bezier(0.19, 1, 0.22, 1)",
      pointerEvents: "auto", cursor: "pointer"
    }} onClick={onRemove}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
          {toast.type || "Notification"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 400, color: "#e0dbd5" }}>{toast.message}</div>
      </div>
    </div>
  );
}

export function NotificationBell({ notifications, onClear }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
          background: "none", border: "none", cursor: "pointer", position: "relative",
          padding: 8, borderRadius: "50%", transition: "background 0.2s"
        }}
        onMouseEnter={(e) => e.target.style.background = "rgba(0,0,0,0.03)"}
        onMouseLeave={(e) => e.target.style.background = "none"}
      >
        <span style={{ fontSize: 20 }}>🔔</span>
        {notifications.length > 0 && (
          <div style={{
            position: "absolute", top: 6, right: 6,
            background: "#C9A96E", color: "#1C1917",
            borderRadius: "50%", width: 14, height: 14,
            fontSize: 9, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 0 0 2px #fff"
          }}>
            {notifications.length}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "100%", right: 0, marginTop: 12,
          width: 320, maxHeight: 400, background: "#fff",
          borderRadius: 16, boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.05)", zIndex: 1000,
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0ece8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", letterSpacing: "0.05em" }}>NOTIFICATIONS</span>
            <button onClick={onClear} style={{ background: "none", border: "none", fontSize: 11, color: "#C9A96E", cursor: "pointer" }}>Clear All</button>
          </div>
          <div style={{ overflowY: "auto", padding: "10px 0" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#999", fontSize: 12 }}>No new masterpieces.</div>
            ) : (
              notifications.map((n) => (
                <div key={n.id} style={{ padding: "12px 20px", borderBottom: "1px solid #f9f7f4" }}>
                  <div style={{ fontSize: 12.5, color: "#1a1a1a", marginBottom: 4 }}>{n.message}</div>
                  <div style={{ fontSize: 10, color: "#b0aba5" }}>{new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
