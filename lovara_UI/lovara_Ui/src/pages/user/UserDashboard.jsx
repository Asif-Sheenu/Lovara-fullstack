import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { generalService, chatService, authService, BACKEND_URL } from "../../services/api";
import { NotificationBell } from "../../components/NotificationToast";
import ChatRoom from "../../components/ChatRoom";
import { useAuth } from "../../context/Authcontext";

const GF = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Jost:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap";

const NAV = [
  { label: "Discover",     icon: "✦", sub: "Collections" },
  { label: "Artisans",     icon: "⊛", sub: "Vendors" },
  { label: "Saved",        icon: "◇", sub: "Wishlist" },
  { label: "My Bookings",  icon: "◈", sub: "Events" },
  { label: "Messages",     icon: "◎", sub: "Inbox" },
  { label: "AI Search",    icon: "🪄", sub: "Discovery" },
  { label: "Account",      icon: "◉", sub: "Profile" },
];

// Initial static data replaced by state in component


const FILTERS = ["All", "Wedding", "Photography", "Floral", "Catering", "Décor"];

export default function UserDashboard({ notifHistory, clearHistory }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("Discover");
  const [saved, setSaved] = useState({});
  const [filter, setFilter] = useState("All");
  const [user, setUser] = useState(null);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [works, setWorks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Chat States
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("1");
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  // User Booking States
  const [userBookings, setUserBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) { try { setUser(JSON.parse(s)); } catch {} }
  }, []);

  const fetchAllWorks = async () => {
    try {
      setLoadingWorks(true);
      setSelectedVendor(null);
      const res = await generalService.getAllWorks();
      setWorks(res.data || []);
      const m = {};
      (res.data || []).forEach(w => { if (w.is_favorited) m[w.id] = true; });
      setSaved(m);
    } catch (err) { console.error(err); }
    finally { setLoadingWorks(false); }
  };

  const fetchVendorWorks = async (vendor) => {
    try {
      setLoadingWorks(true);
      setSelectedVendor(vendor);
      setActive("Discover");
      setSearchQuery(""); // Clear search to show all works of this vendor
      const res = await generalService.getWorksByVendor(vendor.id);
      setWorks(res.data || []);
      const m = {};
      (res.data || []).forEach(w => { if (w.is_favorited) m[w.id] = true; });
      setSaved(m);
      window.scrollTo(0, 0);
    } catch (err) { 
      console.error(err); 
      fetchAllWorks(); // Fallback to all works on error
    }
    finally { setLoadingWorks(false); }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await chatService.getUserRooms();
      setChatRooms(res.data || []);
      // If we just navigated here with a roomId, it will be handled by the effect below
    } catch (err) {
      console.error("Failed to fetch chat rooms", err);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await generalService.getUserBookings();
      const bookings = res.data || [];
      setUserBookings(bookings);

      // Fetch AI recommendations in parallel
      bookings.forEach(async (b) => {
        try {
          const recRes = await generalService.getRecommendation({
            work_id: b.work,
            date: b.service_date || b.created_at
          });
          if (recRes.data && recRes.data.message) {
            setUserBookings(prev => prev.map(item => 
              item.id === b.id ? { ...item, recommendation: recRes.data.message } : item
            ));
          }
        } catch (err) {
          console.warn(`Could not fetch recommendation for booking ${b.id}:`, err);
        }
      });

      // Fetch weather for each booking
      bookings.map(async (b) => {
        try {
          const wRes = await generalService.getBookingWeather(b.id);
          setUserBookings(prev => prev.map(item => 
            item.id === b.id ? { ...item, weather: wRes.data } : item
          ));
        } catch (err) {
          console.error(`Failed to fetch weather for booking ${b.id}:`, err);
        }
      });
    } catch (err) {
      console.error("Failed to fetch user bookings", err);
    } finally {
      setLoadingBookings(false);
    }
  };



  const fetchVendors = async () => {
    try {
      setLoadingVendors(true);
      const res = await authService.getAllVendors();
      setVendors(res.data || []);
    } catch (err) {
      console.error("Failed to fetch vendors", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (active === "Discover" && !selectedVendor) {
      // Small timeout to prevent the all-works fetch from overriding the vendor fetch during immediate state transition
      setTimeout(() => fetchAllWorks(), 0);
    }
    if (active === "Saved") fetchAllWorks();
    if (active === "Messages") fetchRooms();
    if (active === "Artisans") fetchVendors();
    if (active === "My Bookings") fetchUserBookings();
  }, [active]);

  useEffect(() => {
    // 1. Check navigation state (from internal navigate calls)
    if (location.state?.activeTab) {
      setActive(location.state.activeTab);
      if (location.state.roomId) {
        setSelectedRoomId(location.state.roomId.toString());
      }
    } 
    // 2. Check URL query parameters (for deep linking / external navigation)
    else {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab");
      const room = params.get("room");
      
      if (tab) setActive(tab);
      if (room) {
        setSelectedRoomId(room);
        setActive("Messages"); // Switch to messages if a room is specified
      }
    }
  }, [location]);

  const userName = user?.full_name || "Priya Sharma";
  const firstName = userName.split(" ")[0];
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const toggleSave = async (id, e) => {
    e?.stopPropagation();
    setSaved(s => ({ ...s, [id]: !s[id] }));
    try { await generalService.toggleFavorite(id); }
    catch { setSaved(s => ({ ...s, [id]: !s[id] })); }
  };

  const getWorkThumbnail = (work) => {
    return work.images?.[0]?.image_url || "/placeholder.jpg";
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm("Are you certain you wish to cancel this engagement?")) return;
    try {
      await generalService.cancelBooking(id);
      alert("Engagement cancelled successfully.");
      fetchUserBookings();
    } catch (err) { alert(err.message || "Failed to cancel booking."); }
  };

  const filteredWorks = works.filter(v =>
    (filter === "All" || v.tags?.includes(filter)) &&
    (!searchQuery || v.title?.toLowerCase().includes(searchQuery.toLowerCase()) || v.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div style={{ fontFamily: "'Jost', sans-serif", background: "#F7F4EF", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('${GF}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold:        #C9A96E;
          --gold-deep:   #a07830;
          --gold-pale:   rgba(201,169,110,0.10);
          --gold-border: rgba(201,169,110,0.22);
          --ink:         #1a1612;
          --ink-2:       #2e2820;
          --cream:       #F7F4EF;
          --white:       #FDFBF8;
          --warm-100:    #F2EDE5;
          --warm-200:    #E8E0D4;
          --muted:       #9a9088;
          --border:      rgba(0,0,0,0.07);
        }

        @keyframes fadeUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes pulse    { 0%,100%{opacity:.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
        @keyframes drift    { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes revealW  { from{width:0} to{width:var(--w)} }
        @keyframes shimmer  {
          0%   { background-position: -400% center }
          100% { background-position:  400% center }
        }
        @keyframes goldShimmer {
          0%,100% { opacity: 0.7 }
          50%     { opacity: 1 }
        }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.25); border-radius: 3px; }

        /* ── SIDEBAR ── */
        .nav-link {
          display: flex; align-items: center; gap: 13px;
          padding: 12px 18px; margin: 2px 12px; border-radius: 14px;
          cursor: pointer; position: relative; overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-link::before {
          content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 3px; height: 0; border-radius: 0 3px 3px 0;
          background: linear-gradient(to bottom, #C9A96E, #a07830);
          transition: height 0.35s cubic-bezier(0.34,1.56,0.64,1);
        }
        .nav-link.active::before { height: 58%; }
        .nav-link:hover { background: rgba(201,169,110,0.06); }
        .nav-link.active { background: rgba(201,169,110,0.1); }
        .nav-icon { font-size: 13px; flex-shrink: 0; transition: color 0.2s; width: 20px; text-align: center; }
        .nav-text { line-height: 1.2; }
        .nav-label { font-size: 11.5px; font-weight: 500; letter-spacing: 0.04em; transition: color 0.2s; }
        .nav-sub   { font-size: 8.5px; letter-spacing: 0.1em; opacity: 0.4; margin-top: 1px; font-family: 'DM Mono', monospace; }
        .nav-dot   { margin-left: auto; width: 5px; height: 5px; border-radius: 50%; background: var(--gold); flex-shrink: 0; animation: pulse 2s ease infinite; }

        /* ── CARDS ── */
        .work-card {
          background: var(--white); border-radius: 22px; overflow: hidden; cursor: pointer;
          border: 1px solid rgba(0,0,0,0.055);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.03);
          transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s, border-color 0.3s;
          animation-name: fadeUp; animation-duration: 0.55s; animation-timing-function: ease; animation-fill-mode: both;
          position: relative;
        }
        .work-card:hover {
          transform: translateY(-8px) scale(1.015);
          box-shadow: 0 20px 60px rgba(0,0,0,0.11), 0 4px 16px rgba(0,0,0,0.06);
          border-color: rgba(201,169,110,0.28);
        }
        .work-card:nth-child(1){animation-delay:.05s} .work-card:nth-child(2){animation-delay:.1s}
        .work-card:nth-child(3){animation-delay:.15s} .work-card:nth-child(4){animation-delay:.2s}
        .work-card:nth-child(5){animation-delay:.25s} .work-card:nth-child(6){animation-delay:.3s}

        .card-img-wrap { overflow: hidden; }
        .card-img { transition: transform 0.8s cubic-bezier(0.16,1,0.3,1); display: block; width: 100%; height: 100%; object-fit: cover; }
        .work-card:hover .card-img { transform: scale(1.07); }

        /* ── SAVE BTN ── */
        .save-btn {
          position: absolute; top: 14px; right: 14px; z-index: 5;
          width: 38px; height: 38px; border-radius: 50%; border: none;
          background: rgba(255,255,255,0.9); backdrop-filter: blur(10px);
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          font-size: 16px; box-shadow: 0 2px 14px rgba(0,0,0,0.1);
          transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
        }
        .save-btn:hover { transform: scale(1.2); box-shadow: 0 4px 20px rgba(0,0,0,0.15); }

        /* ── FILTER PILLS ── */
        .filter-pill {
          padding: 9px 22px; font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase;
          border-radius: 30px; cursor: pointer; font-weight: 500; transition: all 0.22s;
          background: transparent; font-family: 'Jost', sans-serif; white-space: nowrap;
          border: 1.5px solid #e0d8cc; color: #9a9088;
        }
        .filter-pill:hover { border-color: var(--gold); color: var(--gold); }
        .filter-pill.on {
          background: var(--ink); color: var(--gold);
          border-color: transparent;
          box-shadow: 0 4px 16px rgba(26,22,18,0.2);
        }

        /* ── SEARCH ── */
        .search-wrap {
          display: flex; align-items: center; gap: 10px;
          background: var(--white); border: 1.5px solid var(--border);
          border-radius: 14px; padding: 10px 16px; width: 256px;
          transition: all 0.28s; box-shadow: 0 1px 4px rgba(0,0,0,0.04);
        }
        .search-wrap.focused {
          border-color: var(--gold-border); box-shadow: 0 0 0 3px rgba(201,169,110,0.1);
        }
        .search-in {
          background: none; border: none; outline: none; font-size: 12.5px;
          color: var(--ink); font-family: 'Jost', sans-serif; width: 100%; letter-spacing: 0.02em;
        }
        .search-in::placeholder { color: #c0b8ac; }

        /* ── BUTTONS ── */
        .btn-dark {
          background: var(--ink); color: #FDFBF8; border: none; border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 9.5px; letter-spacing: 0.16em;
          text-transform: uppercase; font-weight: 600; cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 16px rgba(26,22,18,0.18);
        }
        .btn-dark:hover { background: #2e2820; transform: translateY(-2px); box-shadow: 0 8px 28px rgba(26,22,18,0.28); }

        .btn-gold {
          background: linear-gradient(135deg, #C9A96E 0%, #b08840 100%);
          color: #1a1612; border: none; border-radius: 12px;
          font-family: 'Jost', sans-serif; font-size: 9.5px; letter-spacing: 0.16em;
          text-transform: uppercase; font-weight: 700; cursor: pointer;
          transition: all 0.28s cubic-bezier(0.4,0,0.2,1);
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          box-shadow: 0 4px 18px rgba(201,169,110,0.3), inset 0 1px 0 rgba(255,255,255,0.25);
        }
        .btn-gold:hover { transform: translateY(-2px); box-shadow: 0 10px 32px rgba(201,169,110,0.42), inset 0 1px 0 rgba(255,255,255,0.25); }

        .btn-ghost {
          background: transparent; border: 1.5px solid #e0d8cc; color: #9a9088;
          border-radius: 12px; font-family: 'Jost', sans-serif; font-size: 9.5px;
          letter-spacing: 0.14em; text-transform: uppercase; cursor: pointer; font-weight: 500;
          transition: all 0.22s; display: inline-flex; align-items: center; justify-content: center;
        }
        .btn-ghost:hover { border-color: var(--gold); color: var(--gold); background: var(--gold-pale); }

        /* ── EYEBROW ── */
        .eyebrow {
          font-family: 'DM Mono', monospace; font-size: 9px; letter-spacing: 0.34em;
          text-transform: uppercase; color: var(--gold);
          display: flex; align-items: center; gap: 12px;
        }
        .eyebrow::before { content:''; width:20px; height:1px; background: linear-gradient(90deg, var(--gold), transparent); }

        /* ── SURFACE ── */
        .card-surface {
          background: var(--white); border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.055);
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.03);
        }
        .card-warm {
          background: var(--warm-100); border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.04);
        }
        .card-ink {
          background: var(--ink); border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.12);
        }

        /* ── FIELD INPUTS ── */
        .field-in, .field-sel {
          width: 100%; background: var(--warm-100);
          border: 1.5px solid transparent; border-radius: 13px;
          padding: 14px 18px; font-size: 13.5px; color: var(--ink); outline: none;
          font-family: 'Jost', sans-serif; transition: all 0.25s; letter-spacing: 0.02em;
        }
        .field-in:focus, .field-sel:focus {
          border-color: var(--gold-border); background: var(--white);
          box-shadow: 0 0 0 3px rgba(201,169,110,0.1);
        }
        .field-in::placeholder { color: #c0b8ac; }
        .field-sel { appearance: none; cursor: pointer; }

        /* ── BOOKING ROW ── */
        .booking-row {
          background: var(--white); border: 1px solid rgba(0,0,0,0.055);
          border-radius: 18px; padding: 24px 30px;
          display: grid; grid-template-columns: 1fr auto auto auto;
          align-items: center; gap: 32px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.04);
          transition: all 0.28s; animation-name: fadeUp; animation-duration: 0.5s; animation-timing-function: ease; animation-fill-mode: both;
        }
        .booking-row:hover {
          border-color: rgba(201,169,110,0.28);
          box-shadow: 0 6px 24px rgba(0,0,0,0.08);
          transform: translateX(4px);
        }

        /* ── MESSAGES ── */
        .convo-row {
          padding: 17px 22px; cursor: pointer; border-bottom: 1px solid rgba(0,0,0,0.04);
          transition: background 0.18s; display: flex; gap: 13px; align-items: center;
        }
        .convo-row:hover { background: #F7F4EF; }
        .convo-row.active-chat { background: rgba(201,169,110,0.07); border-left: 2.5px solid var(--gold); }

        .bubble {
          max-width: 64%; padding: 13px 18px; border-radius: 18px;
          font-size: 13.5px; line-height: 1.65; font-family: 'Jost', sans-serif; letter-spacing: 0.02em;
        }

        /* ── STATUS BADGE ── */
        .status-badge {
          font-size: 8.5px; padding: 5px 14px; border-radius: 20px;
          letter-spacing: 0.14em; text-transform: uppercase; font-weight: 600;
          font-family: 'DM Mono', monospace;
        }

        /* ── GOLD DIVIDER ── */
        .gold-div { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent); }

        /* ── RISK STAT ── */
        .risk-stat {
          background: var(--warm-100); border-radius: 16px; padding: 26px;
          text-align: center; border: 1px solid rgba(0,0,0,0.04);
          transition: all 0.25s;
        }
        .risk-stat:hover { border-color: rgba(201,169,110,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.06); }

        /* ── HERO BANNER ── */
        .hero-banner {
          position: relative; border-radius: 28px; overflow: hidden;
          background: linear-gradient(135deg, #1a1612 0%, #2e2418 55%, #1a1612 100%);
          border: 1px solid rgba(201,169,110,0.15);
        }
        .hero-banner::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,169,110,0.5), transparent);
        }
        .hero-banner::after {
          content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent);
        }
      `}</style>

      {/* ══════════ SIDEBAR ══════════ */}
      <aside style={{
        width: 256, minHeight: "100vh",
        background: "linear-gradient(180deg, #FDFBF8 0%, #F8F5F0 100%)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, zIndex: 100,
        borderRight: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.04)",
      }}>
        {/* Wordmark */}
        <div style={{ padding: "32px 26px 26px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: "linear-gradient(135deg, #C9A96E, #8a6028)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontSize: 21, color: "#FDFBF8", fontWeight: 600,
              boxShadow: "0 4px 14px rgba(201,169,110,0.35)",
            }}>L</div>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: "#1a1612", letterSpacing: "0.04em", lineHeight: 1 }}>
                Lov<span style={{ color: "#C9A96E", fontStyle: "italic" }}>ara</span>
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 7.5, color: "rgba(201,169,110,0.7)", letterSpacing: "0.36em", textTransform: "uppercase", marginTop: 3 }}>Luxury Events</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "18px 0", overflowY: "auto" }}>
          {NAV.map(({ label, icon, sub }) => {
            const isA = active === label;
            return (
              <div key={label} className={`nav-link${isA ? " active" : ""}`} onClick={() => {
                if (label === "AI Search") {
                  navigate("/user/ai-search");
                  return;
                }
                if (label === "Discover" && selectedVendor) {
                  setSelectedVendor(null);
                  fetchAllWorks();
                }
                setActive(label);
              }}>
                <span className="nav-icon" style={{ color: isA ? "#C9A96E" : "#c0b8ac" }}>{icon}</span>
                <div className="nav-text">
                  <div className="nav-label" style={{ color: isA ? "#C9A96E" : "#4a4038" }}>{label}</div>
                  <div className="nav-sub">{sub}</div>
                </div>
                {isA && <div className="nav-dot" />}
              </div>
            );
          })}
        </nav>

        {/* User tile */}
        <div style={{ padding: "16px 18px 26px", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{
            background: "linear-gradient(135deg, #f5f0e8, #ede5d8)",
            borderRadius: 16, padding: "18px 20px",
            border: "1px solid rgba(201,169,110,0.15)",
            marginBottom: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                background: "linear-gradient(135deg, #C9A96E, #8a6028)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#FDFBF8", fontWeight: 700,
                boxShadow: "0 4px 14px rgba(201,169,110,0.3)",
              }}>{userInitials}</div>
              <div>
                <div style={{ fontSize: 13, color: "#1a1612", fontWeight: 500, letterSpacing: "0.01em" }}>{userName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ab87a", animation: "pulse 2.5s ease infinite" }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(201,169,110,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" }}>Gold Member</span>
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => { logout(); navigate("/login"); }}
            style={{
              width: "100%", padding: "12px", borderRadius: 12,
              background: "rgba(217,106,90,0.08)", border: "1.5px solid rgba(217,106,90,0.15)",
              color: "#d96a5a", fontSize: 10, fontWeight: 600, letterSpacing: "0.15em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'Jost', sans-serif"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,106,90,0.15)"; e.currentTarget.style.borderColor = "rgba(217,106,90,0.3)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(217,106,90,0.08)"; e.currentTarget.style.borderColor = "rgba(217,106,90,0.15)"; }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* ══════════ MAIN ══════════ */}
      <main style={{ marginLeft: 256, flex: 1, minHeight: "100vh" }}>

        {/* Topbar */}
        <header style={{
          height: 66, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 44px", position: "sticky", top: 0, zIndex: 50,
          background: "rgba(247,244,239,0.90)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: "#c0b8ac", letterSpacing: "0.34em", textTransform: "uppercase" }}>{active}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className={`search-wrap${searchFocused ? " focused" : ""}`}>
              <span style={{ color: "#c0b8ac", fontSize: 15, flexShrink: 0 }}>⌕</span>
              <input className="search-in" placeholder="Search collections…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)} />
              {searchQuery && <span onClick={() => setSearchQuery("")} style={{ color: "#c0b8ac", cursor: "pointer", fontSize: 13, flexShrink: 0 }}>×</span>}
            </div>
            <NotificationBell notifications={notifHistory} onClear={clearHistory} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(122,184,122,0.1)", border: "1px solid rgba(122,184,122,0.22)", borderRadius: 20, padding: "6px 13px" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7ab87a", animation: "pulse 2.5s ease infinite" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#4a8a62", letterSpacing: "0.1em" }}>LIVE</span>
            </div>
            <div style={{
              width: 38, height: 38, borderRadius: 12, cursor: "pointer",
              background: "linear-gradient(135deg, #C9A96E, #8a6028)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: "#FDFBF8", fontWeight: 700,
              boxShadow: "0 3px 12px rgba(201,169,110,0.32)",
            }}>{userInitials}</div>
          </div>
        </header>

        <div style={{ padding: "48px 44px", animation: "fadeIn 0.35s ease" }}>

          {/* ════ DISCOVER ════ */}
          {active === "Discover" && (
            <div>
              {/* Hero */}
              <div className="hero-banner" style={{ marginBottom: 44, minHeight: 268 }}>
                {/* Warm glow orb */}
                <div style={{ position: "absolute", top: -60, right: -40, width: 380, height: 380, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,110,0.18) 0%, transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -40, left: "38%", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle, rgba(180,120,60,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ position: "relative", zIndex: 1, padding: "52px 60px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 52 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, animationName: "fadeUp", animationDuration: "0.8s", animationTimingFunction: "ease", animationDelay: "0.08s", animationFillMode: "both" }}>
                      <div style={{ width: 20, height: 1, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "rgba(201,169,110,0.8)", letterSpacing: "0.34em", textTransform: "uppercase" }}>Explore Masterpieces</span>
                    </div>
                    <h1 style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: "clamp(2.8rem, 4vw, 4.4rem)",
                      fontWeight: 300, lineHeight: 1.02, color: "#FAF8F5",
                      marginBottom: 18, letterSpacing: "-0.01em",
                      animationName: "fadeUp", animationDuration: "0.9s", animationTimingFunction: "ease", animationDelay: "0.14s", animationFillMode: "both",
                    }}>
                      The Art of<br />
                      <em style={{ color: "#C9A96E", fontStyle: "italic", fontWeight: 400 }}>Celebration.</em>
                    </h1>
                    <p style={{ fontSize: 13, color: "rgba(250,248,245,0.38)", lineHeight: 1.82, maxWidth: 400, letterSpacing: "0.04em", animationName: "fadeUp", animationDuration: "0.9s", animationTimingFunction: "ease", animationDelay: "0.2s", animationFillMode: "both" }}>
                      Curated works from the world's most distinguished event designers and planners.
                    </p>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "flex", gap: 0, animationName: "fadeUp", animationDuration: "0.9s", animationTimingFunction: "ease", animationDelay: "0.26s", animationFillMode: "both", paddingRight: 12 }}>
                    {[
                      { val: filteredWorks.length || "—", label: "Collections" },
                      { val: "4.9★", label: "Avg Rating" },
                      { val: "48+", label: "Cities" },
                    ].map((s, i) => (
                      <div key={i} style={{
                        textAlign: "center",
                        paddingLeft: i > 0 ? 36 : 0, marginLeft: i > 0 ? 36 : 0,
                        borderLeft: i > 0 ? "1px solid rgba(201,169,110,0.15)" : "none",
                      }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, color: "#C9A96E", fontWeight: 400, lineHeight: 1 }}>{s.val}</div>
                        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: "0.24em", textTransform: "uppercase", marginTop: 6 }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Vendor Indicator */}
              {selectedVendor && (
                <div style={{ 
                  marginBottom: 32, padding: "16px 24px", 
                  background: "rgba(201,169,110,0.06)", borderRadius: 16,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  border: "1px solid rgba(201,169,110,0.15)",
                  animationName: "fadeIn", animationDuration: "0.5s", animationTimingFunction: "ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", color: "#FDFBF8", fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600 }}>
                      {(selectedVendor.business_name || selectedVendor.full_name || selectedVendor.username || "V")[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: "#9a9088", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>Curated Artisan</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#1a1612", fontWeight: 500 }}>{selectedVendor.business_name || selectedVendor.full_name || selectedVendor.username}</div>
                    </div>
                  </div>
                  <button onClick={fetchAllWorks} style={{ 
                    background: "#1a1612", color: "#C9A96E", border: "none", 
                    padding: "8px 16px", borderRadius: 8, fontSize: 10, fontWeight: 600,
                    letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#2e2820"}
                  onMouseLeave={e => e.currentTarget.style.background = "#1a1612"}
                  >
                    View All Artisans ×
                  </button>
                </div>
              )}

              {/* Filters row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 36, flexWrap: "wrap" }}>
                {FILTERS.map(f => (
                  <button key={f} className={`filter-pill${filter === f ? " on" : ""}`} onClick={() => setFilter(f)}>{f}</button>
                ))}
                <span style={{ marginLeft: "auto", fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c0b8ac", letterSpacing: "0.1em" }}>
                  {filteredWorks.length} result{filteredWorks.length !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Loading */}
              {loadingWorks && (
                <div style={{ padding: "100px", textAlign: "center" }}>
                  <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 22px" }}>
                    <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 0, border: "2px solid transparent", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 1.1s linear infinite" }} />
                    <div style={{ position: "absolute", inset: 10, border: "1px solid transparent", borderTopColor: "rgba(201,169,110,0.3)", borderRadius: "50%", animation: "spin 0.65s linear infinite reverse" }} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c0b8ac", letterSpacing: "0.3em", textTransform: "uppercase" }}>Sourcing collections…</div>
                </div>
              )}

              {/* Cards grid */}
              {!loadingWorks && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                  {filteredWorks.length === 0 ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px 0" }}>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#c0b8ac", fontStyle: "italic" }}>No collections found.</div>
                    </div>
                  ) : filteredWorks.map(v => (
                    <div key={v.id} className="work-card" onClick={() => navigate(`/work/${v.id}`)}>
                      {/* Image */}
                      <div className="card-img-wrap" style={{ height: 240, position: "relative" }}>
                        <img 
                          src={v.images?.[0]?.image_url || "/placeholder.jpg"} 
                          alt={v.title} 
                          className="card-img" 
                        />
                        {/* Gradient */}
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,16,10,0.65) 0%, rgba(20,16,10,0.1) 45%, transparent 100%)" }} />

                        {/* Rating badge */}
                        <div style={{ position: "absolute", top: 14, left: 14, display: "flex", alignItems: "center", gap: 5, background: "rgba(253,251,248,0.92)", backdropFilter: "blur(8px)", borderRadius: 9, padding: "5px 11px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                          <span style={{ color: "#C9A96E", fontSize: 10 }}>★</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: "#1a1612", fontWeight: 400 }}>5.0</span>
                        </div>

                        {/* Save btn */}
                        <button className="save-btn" onClick={e => toggleSave(v.id, e)}>
                          <span style={{ color: saved[v.id] ? "#d96a5a" : "#c0b8ac", fontSize: 14, lineHeight: 1 }}>{saved[v.id] ? "♥" : "♡"}</span>
                        </button>

                        {/* Tag */}
                        {v.tags && (
                          <div style={{ position: "absolute", bottom: 14, left: 14 }}>
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, letterSpacing: "0.18em", textTransform: "uppercase", padding: "5px 13px", borderRadius: 20, background: "rgba(201,169,110,0.18)", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.3)", backdropFilter: "blur(8px)" }}>
                              {v.tags.split(",")[0].trim()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div style={{ padding: "24px 24px 20px" }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 500, color: "#1a1612", lineHeight: 1.2, marginBottom: 5, letterSpacing: "0.01em" }}>{v.title}</div>
                        <div 
                          className="vendor-link"
                          style={{ 
                            fontSize: 11.5, color: "#9a9088", letterSpacing: "0.05em", 
                            marginBottom: 20, display: "flex", alignItems: "center", gap: 6,
                            cursor: "pointer", width: "fit-content", transition: "color 0.2s"
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Find the vendor object and fetch its works
                            const vendorObj = vendors.find(vend => vend.vendor_name === v.vendor_name || vend.id === v.vendor_id || vend.id === v.user);
                            if (vendorObj) {
                              fetchVendorWorks(vendorObj);
                            } else {
                              // Fallback if vendor not in current list
                              fetchVendorWorks({ id: v.vendor_id || v.user, business_name: v.vendor_name });
                            }
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = "#C9A96E"}
                          onMouseLeave={e => e.currentTarget.style.color = "#9a9088"}
                        >
                          <span style={{ color: "#C9A96E", fontSize: 9 }}>◉</span>
                          {v.vendor_name || "Lovara Collective"}
                        </div>
                        <div className="gold-div" style={{ marginBottom: 20 }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8.5, color: "#c0b8ac", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Starting From</div>
                            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: "#1a1612", fontWeight: 500 }}>
                              ₹2.5L <span style={{ fontSize: 12, color: "#9a9088", fontFamily: "'Jost', sans-serif", fontWeight: 300 }}>base</span>
                            </div>
                          </div>
                          <button className="btn-dark" style={{ padding: "10px 20px", fontSize: 9 }}>View →</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ ARTISANS ════ */}
          {active === "Artisans" && (
            <div>
              <div style={{ marginBottom: 44 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>The Creators</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem,3.8vw,3.6rem)", fontWeight: 300, color: "#1a1612", marginBottom: 8 }}>
                  Curated <em style={{ color: "#C9A96E" }}>Artisans</em>
                </h1>
                <p style={{ fontSize: 12.5, color: "#9a9088", letterSpacing: "0.04em" }}>Discover the masterminds behind the most luxurious events.</p>
              </div>

              {loadingVendors ? (
                <div style={{ padding: "100px", textAlign: "center" }}>
                   <div style={{ position: "relative", width: 48, height: 48, margin: "0 auto 22px" }}>
                     <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "50%" }} />
                     <div style={{ position: "absolute", inset: 0, border: "2px solid transparent", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 1.1s linear infinite" }} />
                     <div style={{ position: "absolute", inset: 10, border: "1px solid transparent", borderTopColor: "rgba(201,169,110,0.3)", borderRadius: "50%", animation: "spin 0.65s linear infinite reverse" }} />
                   </div>
                   <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c0b8ac", letterSpacing: "0.3em", textTransform: "uppercase" }}>Sourcing artisans…</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
                  {vendors.map((v, i) => (
                    <div key={v.id} className="work-card" style={{ animationDelay: `${i * 0.09}s`, padding: "35px 30px", textAlign: "center" }} 
                      onClick={() => fetchVendorWorks(v)}>
                       <div style={{ width: 84, height: 84, margin: "0 auto 24px", position: "relative" }}>
                          <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: `hsl(${i * 45 + 10}, 30%, 85%)`, border: "2px solid #FDFBF8", boxShadow: "0 8px 24px rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: `hsl(${i * 45 + 10}, 40%, 30%)` }}>
                            {(v.business_name || v.full_name || v.username || "A")[0].toUpperCase()}
                          </div>
                          <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: "#1a1612", border: "2px solid #FDFBF8", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A96E", fontSize: 10 }}>★</div>
                       </div>
                       <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 500, color: "#1a1612", marginBottom: 8 }}>{v.business_name || v.full_name || v.username}</h3>
                       <p style={{ fontSize: 12, color: "#9a9088", letterSpacing: "0.05em", marginBottom: 24 }}>Event Design & Planning</p>
                       <button className="btn-ghost" style={{ padding: "12px 28px", fontSize: 9.5, letterSpacing: "0.2em" }}>View Collections</button>
                    </div>
                  ))}
                  {vendors.length === 0 && (
                     <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "100px 0", color: "#c0b8ac", fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>No artisans available at the moment.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ SAVED ════ */}
          {active === "Saved" && (
            <div>
              <div style={{ marginBottom: 44 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Your Selection</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem,3.8vw,3.6rem)", fontWeight: 300, color: "#1a1612", marginBottom: 8 }}>
                  Saved <em style={{ color: "#C9A96E" }}>Masterpieces</em>
                </h1>
                <p style={{ fontSize: 12.5, color: "#9a9088", letterSpacing: "0.04em" }}>Your curated shortlist of distinguished event professionals.</p>
              </div>

              {works.filter(v => saved[v.id]).length === 0 ? (
                <div style={{ textAlign: "center", padding: "120px 0" }}>
                  <div style={{ fontSize: 48, color: "rgba(201,169,110,0.25)", marginBottom: 20, animation: "drift 4s ease infinite" }}>◇</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c0b8ac", fontStyle: "italic", marginBottom: 8 }}>Nothing saved yet.</div>
                  <div style={{ fontSize: 12, color: "#c0b8ac", marginBottom: 36, letterSpacing: "0.04em" }}>Browse and save your favourite collections.</div>
                  <button className="btn-dark" style={{ padding: "13px 32px" }} onClick={() => setActive("Discover")}>Explore Collections →</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
                  {works.filter(v => saved[v.id]).map((v, i) => (
                    <div key={v.id} className="work-card" style={{ animationDelay: `${i * 0.09}s` }} onClick={() => navigate(`/work/${v.id}`)}>
                      <div className="card-img-wrap" style={{ height: 200, position: "relative" }}>
                        <img 
                          src={v.images?.[0]?.image_url || "/placeholder.jpg"} 
                          alt={v.title} 
                          className="card-img" 
                        />
                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(20,16,10,0.6) 0%, transparent 55%)" }} />
                        <button className="save-btn" onClick={e => toggleSave(v.id, e)}>
                          <span style={{ color: "#d96a5a", fontSize: 14 }}>♥</span>
                        </button>
                      </div>
                      <div style={{ padding: "20px 22px" }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: "#1a1612", fontWeight: 500, marginBottom: 4 }}>{v.title}</div>
                        <div style={{ fontSize: 11, color: "#9a9088", marginBottom: 14, letterSpacing: "0.04em" }}>{v.tags} · {v.vendor_name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 12, color: "#C9A96E", letterSpacing: "0.06em" }}>★ 5.0</span>
                          <button onClick={e => toggleSave(v.id, e)} style={{ fontSize: 9.5, color: "#c0b8ac", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "'Jost',sans-serif", fontWeight: 500, transition: "color 0.2s" }}
                            onMouseEnter={e => e.target.style.color = "#d96a5a"}
                            onMouseLeave={e => e.target.style.color = "#c0b8ac"}
                          >Remove</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ MY BOOKINGS ════ */}
          {active === "My Bookings" && (
            <div>
              <div style={{ marginBottom: 44 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Itinerary</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.4rem,3.8vw,3.6rem)", fontWeight: 300, color: "#1a1612", marginBottom: 8 }}>
                  My <em style={{ color: "#C9A96E" }}>Bookings</em>
                </h1>
                <p style={{ fontSize: 12.5, color: "#9a9088", letterSpacing: "0.04em" }}>Track and manage all your event vendor engagements.</p>
              </div>

              {/* Summary banner */}
              <div className="hero-banner" style={{ padding: "40px 52px", marginBottom: 28 }}>
                <div style={{ position: "absolute", right: -30, top: -30, width: 260, height: 260, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 0 }}>
                  {[
                    { label: "Grand Event",   val: "Destination Wedding", sub: "Goa, India", big: true  },
                    { label: "Save The Date", val: "September 14",         sub: "2025",       big: false },
                    { label: "Vendors",       val: "03",                   sub: "Confirmed",  big: false },
                    { label: "Total Value",   val: "₹4.05L",               sub: "Committed",  big: false },
                  ].map((item, i) => (
                    <div key={i} style={{ flex: item.big ? "1.5" : "1", paddingLeft: i > 0 ? 44 : 0, marginLeft: i > 0 ? 44 : 0, borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.07)" : "none" }}>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 8, color: "rgba(201,169,110,0.5)", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 9 }}>{item.label}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: item.big ? 24 : 30, color: item.big ? "#FAF8F5" : "#C9A96E", fontWeight: 400, lineHeight: 1.1, marginBottom: 3 }}>{item.val}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>

              {loadingBookings ? (
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <div style={{ position: "relative", width: 44, height: 44, margin: "0 auto 20px" }}>
                    <div style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(201,169,110,0.15)", borderRadius: "50%" }} />
                    <div style={{ position: "absolute", inset: 0, border: "2px solid transparent", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c0b8ac", letterSpacing: "0.25em", textTransform: "uppercase" }}>Assembling your itinerary…</div>
                </div>
              ) : userBookings.length === 0 ? (
                <div style={{ textAlign: "center", padding: "120px 0" }}>
                  <div style={{ fontSize: 44, color: "rgba(201,169,110,0.18)", marginBottom: 20 }}>◈</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: "#c0b8ac", fontStyle: "italic", marginBottom: 8 }}>No active bookings found.</div>
                  <div style={{ fontSize: 12, color: "#c0b8ac", marginBottom: 32, letterSpacing: "0.04em" }}>Begin your journey by selecting a curated artisan.</div>
                  <button className="btn-dark" style={{ padding: "13px 32px" }} onClick={() => setActive("Artisans")}>View Artisans →</button>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 13 }}>
                  {userBookings.map((b, i) => (
                    <div key={b.id} className="booking-row" style={{ animationDelay: `${i * 0.1}s`, display: "flex", flexDirection: "column", alignItems: "stretch", padding: "20px 30px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                          <div style={{
                            width: 54, height: 54, borderRadius: 16, flexShrink: 0,
                            background: `linear-gradient(135deg, hsl(${i * 55 + 20}, 32%, 92%), hsl(${i * 55 + 20}, 28%, 86%))`,
                            border: `1px solid hsl(${i * 55 + 20}, 28%, 82%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Cormorant Garamond', serif", fontSize: 22,
                            color: `hsl(${i * 55 + 20}, 42%, 35%)`, fontWeight: 600,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
                          }}>{(b.vendor_name || b.artisan_name || "V")[0]}</div>
                          <div>
                            <div style={{ fontSize: 15, color: "#1a1612", fontWeight: 600, marginBottom: 4, letterSpacing: "0.01em" }}>{b.vendor_name || b.artisan_name || "Artisan"}</div>
                            <div style={{ fontSize: 12, color: "#9a9088", letterSpacing: "0.03em" }}>{b.work_title || b.event || "Event Consultation"}</div>
                          </div>
                        </div>

                        {/* Weather Enrichment in Center */}
                        {b.weather ? (
                          <div style={{ textAlign: "center", background: "rgba(201,169,110,0.05)", padding: "10px 22px", borderRadius: 16, border: "1px solid rgba(201,169,110,0.12)", minWidth: 160 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
                              <span style={{ fontSize: 20 }}>{b.weather.condition?.toLowerCase().includes("rain") ? "🌧️" : "🌤️"}</span>
                              <div style={{ textAlign: "left" }}>
                                <div style={{ fontSize: 14, color: "#1a1612", fontWeight: 600, lineHeight: 1 }}>{b.weather.avg_temp}°C</div>
                                <div style={{ fontSize: 9, color: "#9a9088", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>{b.weather.condition}</div>
                              </div>
                            </div>
                            {b.weather.condition?.toLowerCase().includes("rain") && (
                              <div style={{ marginTop: 6, fontSize: 9.5, color: "#c9705a", fontWeight: 700, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                                <span>⚠️</span> RAIN EXPECTED
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: 10, color: "#c0b8ac", textTransform: "uppercase", letterSpacing: "0.14em" }}>Weather Data: N/A</div>
                        )}
                        
                        {/* Display AI Recommendation if available */}
                        {b.recommendation && (
                          <div style={{ flex: 1, marginLeft: 24, padding: "12px 18px", background: "rgba(201,169,110,0.03)", borderLeft: "2px solid #C9A96E", borderRadius: "0 8px 8px 0" }}>
                             <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                               <span style={{ fontSize: 13 }}>✨</span>
                               <span style={{ fontSize: 9, color: "#C9A96E", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase" }}>AI Concierge Note</span>
                             </div>
                             <div style={{ fontSize: 12, color: "#9a9088", fontStyle: "italic", lineHeight: 1.4 }}>"{b.recommendation}"</div>
                          </div>
                        )}

                        <div style={{ textAlign: "right" }}>
                           <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: "#9a9088", letterSpacing: "0.06em", marginBottom: 2 }}>{new Date(b.created_at || b.service_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                           <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: "#1a1612", fontWeight: 500, marginBottom: 8 }}>{b.amount || b.value || "Negotiable"}</div>
                           <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "flex-end" }}>
                              <span className="status-badge" style={{
                                background: b.status === "APPROVED" || b.status === "Confirmed" ? "rgba(74,138,98,0.1)" : "rgba(184,137,42,0.1)",
                                color:      b.status === "APPROVED" || b.status === "Confirmed" ? "#4a8a62" : "#b8892a",
                                border:     `1px solid ${b.status === "APPROVED" || b.status === "Confirmed" ? "rgba(74,138,98,0.22)" : "rgba(184,137,42,0.22)"}`,
                                padding: "4px 12px"
                              }}>{b.status}</span>
                              <button 
                                onClick={() => handleCancelBooking(b.id)}
                                style={{ background: "transparent", border: "1px solid rgba(192,101,74,0.15)", color: "rgba(192,101,74,0.7)", padding: "4px 12px", borderRadius: 12, fontSize: 9, cursor: "pointer", letterSpacing: "0.1em", fontWeight: 600 }}
                                onMouseEnter={e => { e.currentTarget.style.color = "#c0654a"; e.currentTarget.style.borderColor = "rgba(192,101,74,0.4)"; }}
                                onMouseLeave={e => { e.currentTarget.style.color = "rgba(192,101,74,0.7)"; e.currentTarget.style.borderColor = "rgba(192,101,74,0.15)"; }}
                              >CANCEL</button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ════ MESSAGES ════ */}
          {active === "Messages" && (
            <div style={{ display: "flex", gap: 22, height: "calc(100vh - 166px)" }}>
              {/* Conversations */}
              <div className="card-surface" style={{ width: 300, display: "flex", flexDirection: "column", overflow: "hidden", padding: 0 }}>
                <div style={{ padding: "22px 22px 16px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: "#1a1612" }}>Messages</h3>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {roomsLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 12 }}>Loading conversations...</div>
                  ) : chatRooms.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 12 }}>No private connections established yet.</div>
                  ) : (
                    chatRooms.map((c, i) => (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedRoomId(c.id.toString())}
                        className={`convo-row${selectedRoomId === c.id.toString() ? " active-chat" : ""}`}
                      >
                        <div style={{ position: "relative", flexShrink: 0 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 13,
                            background: `hsl(${i * 80 + 20}, 32%, 90%)`,
                            border: `1px solid hsl(${i * 80 + 20}, 28%, 82%)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "'Cormorant Garamond', serif", fontSize: 17,
                            color: `hsl(${i * 80 + 20}, 42%, 38%)`, fontWeight: 600,
                          }}>
                            {(c.vendor_name || c.name || "A")[0]}
                          </div>
                          {c.online && <div style={{ position: "absolute", bottom: 1, right: 1, width: 9, height: 9, borderRadius: "50%", background: "#7ab87a", border: "2.5px solid #FDFBF8" }} />}
                        </div>
                        <div style={{ flex: 1, overflow: "hidden" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: "#1a1612", fontWeight: 500 }}>{c.vendor_name || c.name}</span>
                            <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: "#c0b8ac" }}>{c.last_message_time || "1h"}</span>
                              {c.unread_count > 0 && <div style={{ width: 17, height: 17, borderRadius: "50%", background: "#C9A96E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#FDFBF8", fontWeight: 700 }}>{c.unread_count}</div>}
                            </div>
                          </div>
                          <div style={{ fontSize: 11.5, color: "#9a9088", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "0.02em" }}>
                            {c.last_message || "Start a conversation..."}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat */}
              <div style={{ flex: 1, height: "100%" }}>
                {selectedRoomId ? (
                  <ChatRoom roomId={selectedRoomId} currentUser={user} />
                ) : (
                  <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>Select a conversation to begin</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ ACCOUNT ════ */}
          {active === "Account" && (
            <div style={{ maxWidth: 580 }}>
              <div style={{ marginBottom: 44 }}>
                <div className="eyebrow" style={{ marginBottom: 16 }}>Profile</div>
                <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(2.4rem,3.8vw,3.6rem)", fontWeight: 300, color: "#1a1612", marginBottom: 8 }}>
                  Your <em style={{ color: "#C9A96E" }}>Account</em>
                </h1>
                <p style={{ fontSize: 12.5, color: "#9a9088", letterSpacing: "0.04em" }}>Manage your personal details and event preferences.</p>
              </div>

              {/* Profile card */}
              <div style={{
                background: "linear-gradient(135deg, #1a1612, #2a2018)",
                borderRadius: 24, padding: "36px 42px", marginBottom: 18,
                position: "relative", overflow: "hidden",
                border: "1px solid rgba(201,169,110,0.14)",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.45), transparent)" }} />
                <div style={{ position: "absolute", right: -20, bottom: -20, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(201,169,110,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 1 }}>
                  <div style={{
                    width: 66, height: 66, borderRadius: 18, flexShrink: 0,
                    background: "linear-gradient(135deg, #C9A96E, #8a6028)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#FDFBF8", fontWeight: 700,
                    boxShadow: "0 6px 24px rgba(201,169,110,0.3)",
                  }}>{userInitials}</div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, color: "#FAF8F5", fontWeight: 400, marginBottom: 7 }}>{userName}</div>
                    <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, background: "rgba(201,169,110,0.15)", color: "#C9A96E", padding: "4px 14px", borderRadius: 20, letterSpacing: "0.22em", textTransform: "uppercase", border: "1px solid rgba(201,169,110,0.25)" }}>Gold Member</span>
                  </div>
                </div>
              </div>

              {/* Fields */}
              <div className="card-surface" style={{ padding: "36px 40px", marginBottom: 16 }}>
                {[
                  { label: "Full Name",      val: userName,             ph: "Your full name" },
                  { label: "Email Address",  val: "priya@example.com",  ph: "your@email.com" },
                  { label: "Event Location", val: "Goa, India",         ph: "City, Country" },
                  { label: "Event Date",     val: "September 14, 2025", ph: "DD Month YYYY" },
                ].map((f, i) => (
                  <div key={f.label} style={{ marginBottom: i < 3 ? 22 : 0 }}>
                    <label style={{ fontFamily: "'DM Mono',monospace", fontSize: 8.5, color: "#c0b8ac", letterSpacing: "0.28em", textTransform: "uppercase", display: "block", marginBottom: 10 }}>{f.label}</label>
                    <input className="field-in" defaultValue={f.val} placeholder={f.ph} />
                  </div>
                ))}
                <div style={{ marginTop: 32 }}>
                  <button className="btn-gold" style={{ width: "100%", padding: "18px", fontSize: 9.5, letterSpacing: "0.22em" }}>Save Changes →</button>
                </div>
              </div>

              {/* Danger zone */}
              <div className="card-surface" style={{ padding: "20px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(192,101,74,0.12)" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#4a4038", fontWeight: 500, marginBottom: 2 }}>Delete Account</div>
                  <div style={{ fontSize: 11, color: "#9a9088" }}>Permanently remove your Lovara account.</div>
                </div>
                <button className="btn-ghost" style={{ padding: "10px 20px", fontSize: 9, color: "rgba(192,101,74,0.7)", borderColor: "rgba(192,101,74,0.2)", borderRadius: 11, letterSpacing: "0.14em" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(192,101,74,0.45)"; e.currentTarget.style.color = "#c0654a"; e.currentTarget.style.background = "rgba(192,101,74,0.06)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(192,101,74,0.2)"; e.currentTarget.style.color = "rgba(192,101,74,0.7)"; e.currentTarget.style.background = "transparent"; }}
                >Remove</button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}