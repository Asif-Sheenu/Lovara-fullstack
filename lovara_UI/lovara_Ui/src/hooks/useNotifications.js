import { useEffect, useRef, useState } from "react";
import { clearExpiredToken } from "../services/api";

/**
 * Hook to manage real-time notifications via WebSocket.
 */
export function useNotifications() {
    const ws = useRef(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("access") || localStorage.getItem("token");
        if (!token || token === "null") return;

        ws.current = new WebSocket(`ws://localhost:8000/ws/notifications/?token=${token}`);

        ws.current.onopen = () => console.log("WS connected");

        ws.current.onmessage = (e) => {
            try {
                const data = JSON.parse(e.data);
                setNotifications((prev) => [data.message, ...prev]);
                // Also show an alert as requested in previous steps if needed, 
                // but here we are primarily collecting for the UI badge.
                if (data.message) {
                    console.log("New notification:", data.message);
                }
            } catch (err) {
                console.error("Error parsing notification message", err);
            }
        };

        ws.current.onerror = (e) => console.error("WS error", e);

        ws.current.onclose = () => console.log("WS disconnected");

        return () => {
            if (ws.current) {
                ws.current.onopen = null;
                ws.current.onmessage = null;
                ws.current.onerror = null;
                ws.current.onclose = null;
                if (ws.current.readyState === WebSocket.OPEN) {
                    ws.current.close();
                }
            }
        };
    }, []);

    return { notifications };
}
