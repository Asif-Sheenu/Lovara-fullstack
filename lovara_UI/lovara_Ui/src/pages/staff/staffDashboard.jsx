import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { vendorService, chatService, BACKEND_URL } from "../../services/api";
import { NotificationBell } from "../../components/NotificationToast";
import ChatRoom from "../../components/ChatRoom";
import { useAuth } from "../../context/Authcontext";

const GF = "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,300;0,400;0,500;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";

const NAV = [
  { label: "Overview", icon: "◈" },
  { label: "Portfolio", icon: "◻" },
  { label: "Bookings", icon: "◷" },
  { label: "Reviews", icon: "◇" },
  { label: "Messages", icon: "◎" },
  { label: "Settings", icon: "◉" },
];

const PORTFOLIO_PLACEHOLDER = [
  { id: 1, title: "Udaipur Palace Wedding", tag: "Wedding", likes: 248, rating: 4.9, img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400&q=80" },
  { id: 2, title: "Goa Beachfront Ceremony", tag: "Destination", likes: 192, rating: 4.8, img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
  { id: 3, title: "Mumbai Rooftop Soirée", tag: "Corporate", likes: 317, rating: 5.0, img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=400&q=80" },
  { id: 4, title: "Kerala Backwaters Retreat", tag: "Wedding", likes: 156, rating: 4.7, img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&q=80" },
  { id: 5, title: "Jaipur Heritage Gala", tag: "Luxury", likes: 289, rating: 4.9, img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?w=400&q=80" },
  { id: 6, title: "Shimla Winter Wedding", tag: "Wedding", likes: 204, rating: 4.8, img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=400&q=80" },
];

const BOOKINGS = [
  { id: "LV-2401", client: "Priya Sharma", event: "Destination Wedding · Goa", date: "Mar 14, 2025", status: "Confirmed", value: "₹2,40,000" },
  { id: "LV-2402", client: "Arjun Mehta", event: "Corporate Gala · Mumbai", date: "Mar 22, 2025", status: "Pending", value: "₹85,000" },
  { id: "LV-2403", client: "Isha Kapoor", event: "Engagement · Udaipur", date: "Apr 5, 2025", status: "Confirmed", value: "₹1,20,000" },
  { id: "LV-2404", client: "Rohan Verma", event: "Wedding · Jaipur", date: "Apr 18, 2025", status: "Review", value: "₹3,60,000" },
];

const REVIEWS = [
  { name: "Priya S.", rating: 5, text: "Absolutely breathtaking work. Every detail was crafted with such care and elegance.", date: "Feb 2025", avatar: "P" },
  { name: "Asha M.", rating: 5, text: "Lovara connected us with the best vendor we could have asked for. Magical experience.", date: "Jan 2025", avatar: "A" },
  { name: "Kiran R.", rating: 4, text: "Professional, creative, and incredibly responsive. Will definitely book again.", date: "Jan 2025", avatar: "K" },
];

const STATUS_COLORS = {
  Confirmed: { bg: "rgba(180,210,185,0.15)", color: "#5a9a6e", border: "rgba(90,154,110,0.25)" },
  Pending: { bg: "rgba(201,169,110,0.12)", color: "#b8904a", border: "rgba(201,169,110,0.3)" },
  Review: { bg: "rgba(180,160,220,0.12)", color: "#8a6ab8", border: "rgba(138,106,184,0.25)" },
};

export default function VendorDashboard({ notifHistory, clearHistory }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [active, setActive] = useState("Overview");
  const [liked, setLiked] = useState({});
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [loadingWorks, setLoadingWorks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newWork, setNewWork] = useState({ title: "", description: "", tags: "", latitude: "", longitude: "", images: [] });
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedWorkForImages, setSelectedWorkForImages] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [hoveredNav, setHoveredNav] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingWorkId, setEditingWorkId] = useState(null);
  const [vendorBookings, setVendorBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Chat States
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch (e) { console.error(e); }
    }

    // Handle URL parameters for tab/room selection
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab");
    const room = params.get("room");
    if (tab) setActive(tab);
    if (room) {
      setSelectedRoomId(room);
      setActive("Messages");
    }
  }, [location]);

  const fetchWorks = async () => {
    try {
      setLoadingWorks(true);
      const res = await vendorService.getVendorWorks();
      setWorks(res.data || []);
    } catch (err) { console.error("Failed to fetch works", err); }
    finally { setLoadingWorks(false); }
  };

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await vendorService.getVendorBookings();
      const bookings = res.data || [];
      setVendorBookings(bookings);

      // Fetch weather for each booking
      bookings.map(async (b) => {
        try {
          const wRes = await generalService.getBookingWeather(b.id);
          setVendorBookings(prev => prev.map(item => 
            item.id === b.id ? { ...item, weather: wRes.data } : item
          ));
        } catch (err) {
          console.error(`Failed to fetch weather for booking ${b.id}:`, err);
        }
      });
    } catch (err) { console.error("Failed to fetch bookings", err); }
    finally { setLoadingBookings(false); }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const res = await chatService.getUserRooms();
      setChatRooms(res.data || []);
      if (res.data?.length > 0 && !selectedRoomId) {
        setSelectedRoomId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error("Failed to fetch chat rooms", err);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (active === "Portfolio") fetchWorks();
    if (active === "Bookings" || active === "Overview") fetchBookings();
    if (active === "Messages") fetchRooms();
  }, [active]);

  const handleUpdateBooking = async (id, status) => {
    try {
      await vendorService.updateBookingStatus(id, status);
      alert(`Booking ${status.toLowerCase()} successfully`);
      fetchBookings();
    } catch (err) { alert(err.message || "Failed to update booking status"); }
  };

  const handleCreateWork = async (e) => {
    e.preventDefault();
    try {
      setCreateLoading(true);
      
      const lat = parseFloat(newWork.latitude);
      const lng = parseFloat(newWork.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) throw new Error("Latitude must be between -90 and 90");
      if (isNaN(lng) || lng < -180 || lng > 180) throw new Error("Longitude must be between -180 and 180");

      if (isEditMode) {
        await vendorService.updateWork(editingWorkId, {
          title: newWork.title,
          description: newWork.description,
          tags: newWork.tags,
          latitude: lat,
          longitude: lng
        });
        alert("Work updated successfully");
      } else {
        const res = await vendorService.createWork({ title: newWork.title, description: newWork.description, tags: newWork.tags, latitude: lat, longitude: lng });
        const workId = res.data.id;
        if (newWork.images && newWork.images.length > 0) {
          const formData = new FormData();
          Array.from(newWork.images).forEach(file => formData.append("images", file));
          await vendorService.uploadWorkImages(workId, formData);
        }
        alert("Work created successfully");
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setEditingWorkId(null);
      setNewWork({ title: "", description: "", tags: "", latitude: "", longitude: "", images: [] });
      fetchWorks();
    } catch (err) {
      console.error(err);
      alert("Action failed: " + (err.message || "Unknown error"));
    } finally { setCreateLoading(false); }
  };

  const handleEditClick = (work) => {
    setIsEditMode(true);
    setEditingWorkId(work.id);
    setNewWork({
      title: work.title,
      description: work.description,
      tags: work.tags,
      latitude: work.latitude || "",
      longitude: work.longitude || "",
      images: [] // images can't be pre-filled for input type=file
    });
    setIsModalOpen(true);
  };

  const handleDeleteWork = async (workId) => {
    if (!window.confirm("Are you sure you want to delete this work?")) return;
    try {
      await vendorService.deleteWork(workId);
      fetchWorks();
    } catch (err) { alert("Failed to delete work"); }
  };

  const handleImageUpload = async (e, workId) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) formData.append("images", files[i]);
    try {
      setUploadLoading(true);
      await vendorService.uploadWorkImages(workId, formData);
      fetchWorks();
      alert("Images uploaded successfully");
    } catch (err) { alert("Failed to upload images: " + (err.message || "Unknown error")); }
    finally { setUploadLoading(false); }
  };

  const getWorkThumbnail = (work) => {
    if (!work?.images || work.images.length === 0) return "/placeholder.jpg";
    const url = work.images[0]?.image_url;
    if (!url) return "/placeholder.jpg";
    if (url.startsWith("http")) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  const toggleLike = (id) => setLiked(l => ({ ...l, [id]: !l[id] }));
  const userName = user?.business_name || user?.full_name || "Atelier Blanc";
  const userInitials = userName.charAt(0).toUpperCase();

  const SIDEBAR_W = sidebarCollapsed ? 72 : 240;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#F5F3EF", minHeight: "100vh", display: "flex" }}>
      <style>{`
        @import url('${GF}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(20px);} to { opacity:1; transform:translateY(0);} }
        @keyframes fadeIn { from { opacity:0;} to { opacity:1;} }
        @keyframes slideIn { from { opacity:0; transform:translateX(-12px);} to { opacity:1; transform:translateX(0);} }
        @keyframes pulse { 0%,100%{opacity:0.5; transform:scale(1);} 50%{opacity:1; transform:scale(1.3);} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #D9D5CE; border-radius: 4px; }

        .nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 18px; margin: 2px 10px;
          border-radius: 10px; cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
          text-decoration: none; position: relative; overflow: hidden;
        }
        .nav-link::before {
          content: ''; position: absolute; inset: 0; border-radius: 10px;
          background: linear-gradient(135deg, rgba(201,169,110,0.15), rgba(201,169,110,0.05));
          opacity: 0; transition: opacity 0.2s;
        }
        .nav-link:hover::before, .nav-link.active::before { opacity: 1; }
        .nav-link:hover .nav-label { color: #C9A96E !important; }

        .card {
          background: #fff; border-radius: 16px;
          border: 1px solid rgba(0,0,0,0.06);
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
          transition: box-shadow 0.25s, transform 0.25s;
        }
        .card:hover { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }

        .card-lift:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.1); }

        .btn-primary {
          background: #1C1917; color: #FAF8F5; border: none;
          padding: 11px 24px; font-size: 11px; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500;
          transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px;
        }
        .btn-primary:hover { background: #2d2926; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(28,25,23,0.3); }

        .btn-ghost {
          background: transparent; color: #6b6560; border: 1px solid #e0ddd8;
          padding: 10px 20px; font-size: 11px; letter-spacing: 0.08em;
          text-transform: uppercase; cursor: pointer; border-radius: 8px;
          font-family: 'DM Sans', sans-serif; font-weight: 500; transition: all 0.2s;
        }
        .btn-ghost:hover { border-color: #C9A96E; color: #C9A96E; }

        .stat-card { animation-name: fadeUp; animation-duration: 0.5s; animation-timing-function: ease; animation-fill-mode: both; }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }

        .portfolio-card { animation-name: fadeUp; animation-duration: 0.45s; animation-timing-function: ease; animation-fill-mode: both; }
        .portfolio-card:nth-child(1) { animation-delay: 0.05s; }
        .portfolio-card:nth-child(2) { animation-delay: 0.1s; }
        .portfolio-card:nth-child(3) { animation-delay: 0.15s; }
        .portfolio-card:nth-child(4) { animation-delay: 0.2s; }
        .portfolio-card:nth-child(5) { animation-delay: 0.25s; }
        .portfolio-card:nth-child(6) { animation-delay: 0.3s; }

        .input-field {
          width: 100%; background: #F8F6F2; border: 1.5px solid transparent;
          border-radius: 10px; padding: 12px 16px;
          font-size: 14px; color: #1a1a1a; outline: none;
          font-family: 'DM Sans', sans-serif; transition: all 0.2s;
        }
        .input-field:focus { border-color: #C9A96E; background: #fff; box-shadow: 0 0 0 3px rgba(201,169,110,0.12); }
        .input-field::placeholder { color: #bbb; }

        .tag-badge {
          display: inline-flex; align-items: center;
          background: rgba(201,169,110,0.12); color: #a07830;
          border: 1px solid rgba(201,169,110,0.25);
          padding: 3px 10px; border-radius: 20px;
          font-size: 10px; font-weight: 500; letter-spacing: 0.06em; text-transform: uppercase;
        }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(10,8,6,0.75);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
          animation: fadeIn 0.2s ease;
        }
        .modal-panel {
          background: #fff; width: 100%; max-width: 480px; border-radius: 20px;
          padding: 40px; animation: fadeUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
          box-shadow: 0 24px 60px rgba(0,0,0,0.2);
        }

        .message-bubble {
          max-width: 62%; padding: 13px 18px; border-radius: 16px;
          font-size: 13.5px; line-height: 1.65;
          font-family: 'DM Sans', sans-serif;
        }

        .sidebar-toggle { 
          cursor: pointer; transition: all 0.2s; 
          width: 28px; height: 28px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          color: #6a6460;
        }
        .sidebar-toggle:hover { background: rgba(255,255,255,0.08); color: #C9A96E; }

        .upload-zone {
          border: 2px dashed #d8d4ce; border-radius: 12px; padding: 28px;
          text-align: center; cursor: pointer; transition: all 0.25s;
        }
        .upload-zone:hover { border-color: #C9A96E; background: rgba(201,169,110,0.04); }

        .row-hover { transition: background 0.15s; }
        .row-hover:hover { background: #FAFAF8 !important; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: SIDEBAR_W, minHeight: "100vh",
        background: "linear-gradient(180deg, #1A1714 0%, #1C1917 100%)",
        display: "flex", flexDirection: "column",
        position: "fixed", top: 0, left: 0, zIndex: 100,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
        borderRight: "1px solid rgba(255,255,255,0.04)",
      }}>
        {/* Logo area */}
        <div style={{ padding: "28px 18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(135deg, #C9A96E 0%, #a07830 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 15, fontWeight: 700, color: "#1C1917",
                fontFamily: "'Playfair Display', serif",
              }}>L</div>
              {!sidebarCollapsed && (
                <div style={{ animation: "slideIn 0.2s ease" }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 18, fontWeight: 500, color: "#FAF8F5", letterSpacing: "0.02em",
                    whiteSpace: "nowrap",
                  }}>
                    Lov<span style={{ color: "#C9A96E" }}>ara</span>
                  </div>
                  <div style={{ fontSize: 9, color: "#4a4540", letterSpacing: "0.2em", textTransform: "uppercase", marginTop: 2 }}>
                    Vendor Portal
                  </div>
                </div>
              )}
            </div>
            <div className="sidebar-toggle" onClick={() => setSidebarCollapsed(c => !c)} style={{ flexShrink: 0, fontSize: 12 }}>
              {sidebarCollapsed ? "›" : "‹"}
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 0", overflowY: "auto" }}>
          {NAV.map(({ label, icon }) => {
            const isActive = active === label;
            return (
              <div
                key={label}
                className={`nav-link${isActive ? " active" : ""}`}
                onClick={() => setActive(label)}
                title={sidebarCollapsed ? label : ""}
                style={{ justifyContent: sidebarCollapsed ? "center" : "flex-start" }}
              >
                <span style={{
                  fontSize: 15, flexShrink: 0,
                  color: isActive ? "#C9A96E" : "rgba(255,255,255,0.4)",
                  transition: "color 0.2s",
                }}>{icon}</span>
                {!sidebarCollapsed && (
                  <span
                    className="nav-label"
                    style={{
                      fontSize: 12.5, letterSpacing: "0.04em",
                      color: isActive ? "#C9A96E" : "rgba(255,255,255,0.45)",
                      fontWeight: isActive ? 500 : 400,
                      whiteSpace: "nowrap", animation: "slideIn 0.2s ease",
                      transition: "color 0.2s",
                    }}
                  >{label}</span>
                )}
                {isActive && !sidebarCollapsed && (
                  <div style={{
                    marginLeft: "auto", width: 5, height: 5, borderRadius: "50%",
                    background: "#C9A96E", flexShrink: 0,
                  }} />
                )}
              </div>
            );
          })}
        </nav>

        {/* Profile section */}
        <div style={{ padding: "16px 18px 24px", borderTop: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: sidebarCollapsed ? 0 : 16 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #C9A96E, #8a6a30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#1C1917", fontWeight: 700,
              fontFamily: "'Playfair Display', serif",
            }}>{userInitials}</div>
            {!sidebarCollapsed && (
              <div style={{ overflow: "hidden", animation: "slideIn 0.2s ease" }}>
                <div style={{ fontSize: 12.5, color: "#e0dbd5", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {userName}
                </div>
                <div style={{ fontSize: 10, color: "#4a4540", letterSpacing: "0.08em", marginTop: 1 }}>
                  {user?.status === 'APPROVED' ? '✓ Verified Vendor' : 'Vendor'}
                </div>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
            <button 
              onClick={() => { logout(); navigate("/login"); }}
              style={{
                width: "100%", padding: "10px", borderRadius: 8,
                background: "rgba(217,106,90,0.1)", border: "1px solid rgba(217,106,90,0.2)",
                color: "#ff8a7a", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em",
                textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
                fontFamily: "'DM Sans', sans-serif"
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(217,106,90,0.2)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(217,106,90,0.1)"; }}
            >
              Log Out
            </button>
          )}
          
          {sidebarCollapsed && (
             <div 
               onClick={() => { logout(); navigate("/login"); }}
               style={{ 
                 cursor: "pointer", width: 36, height: 36, display: "flex", 
                 alignItems: "center", justifyContent: "center", color: "#ff8a7a",
                 fontSize: 18, marginTop: 12
               }} 
               title="Log Out"
             >
               ⏻
             </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main style={{ marginLeft: SIDEBAR_W, flex: 1, minHeight: "100vh", transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)" }}>

        {/* Top bar */}
        <header style={{
          height: 64, borderBottom: "1px solid rgba(0,0,0,0.06)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", background: "rgba(245,243,239,0.9)",
          backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "#bbb", letterSpacing: "0.14em", textTransform: "uppercase" }}>{active}</span>
          </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <NotificationBell notifications={notifHistory} onClear={clearHistory} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,169,110,0.1)", padding: "5px 12px", borderRadius: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ab87a", animation: "pulse 2.5s ease infinite" }} />
              <span style={{ fontSize: 10, color: "#7ab87a", fontWeight: 500, letterSpacing: "0.06em" }}>Live</span>
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #C9A96E, #8a6a30)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#1C1917", fontWeight: 700, cursor: "pointer",
              fontFamily: "'Playfair Display', serif",
              boxShadow: "0 2px 8px rgba(201,169,110,0.3)",
            }}>{userInitials}</div>
          </div>
        </header>

        <div style={{ padding: "36px 32px", animation: "fadeIn 0.35s ease" }}>

          {/* ══ OVERVIEW ══ */}
          {active === "Overview" && (
            <div>
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Dashboard</div>
                <h1 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 36, fontWeight: 400, color: "#1a1a1a", marginBottom: 6, lineHeight: 1.2,
                }}>
                  Good morning, <em style={{ color: "#C9A96E" }}>{userName}.</em>
                </h1>
                <p style={{ fontSize: 13, color: "#9a9490", letterSpacing: "0.02em" }}>
                  Here's how your studio is performing this month.
                </p>
              </div>

              {/* Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
                {[
                  { label: "Total Bookings", value: vendorBookings.length, delta: "+12%", sub: "vs last month", icon: "◷" },
                  { label: "Pending", value: vendorBookings.filter(b => b.status === 'PENDING').length, delta: "Needs action", sub: "this week", icon: "◎" },
                  { label: "Confirmed", value: vendorBookings.filter(b => b.status === 'APPROVED').length, delta: "Verified", sub: "active events", icon: "◇" },
                  { label: "Venue Reach", value: "Goa · Udaipur", delta: "+3 cities", sub: "seasonal hubs", icon: "◈" },
                ].map((s, i) => (
                  <div key={i} className="card stat-card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>{s.label}</div>
                      <span style={{ fontSize: 13, color: "#d8d0c4" }}>{s.icon}</span>
                    </div>
                    <div style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: 34, fontWeight: 400, color: "#1a1a1a", marginBottom: 10, lineHeight: 1,
                    }}>{s.value}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11, color: "#5a9a6e", fontWeight: 600,
                        background: "rgba(90,154,110,0.1)", padding: "2px 8px", borderRadius: 6,
                      }}>{s.delta}</span>
                      <span style={{ fontSize: 10, color: "#bbb" }}>{s.sub}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bookings + Quick Actions */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}>
                {/* Recent Bookings */}
                <div className="card" style={{ padding: "28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, color: "#1a1a1a" }}>
                      Upcoming Bookings
                    </h3>
                    <span
                      onClick={() => setActive("Bookings")}
                      style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.12em", cursor: "pointer", textTransform: "uppercase", fontWeight: 500 }}
                    >View all →</span>
                  </div>
                  {vendorBookings.slice(0, 3).map((b, i) => (
                    <div key={b.id} className="row-hover" style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "14px 12px", borderRadius: 10, margin: "0 -12px",
                      borderBottom: i < 2 ? "1px solid #f0ece8" : "none",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                          background: `hsl(${i * 60 + 30}, 30%, 92%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 600, color: `hsl(${i * 60 + 30}, 40%, 40%)`,
                          fontFamily: "'Playfair Display', serif",
                        }}>{(b.client_name || b.user_name || "?")[0]}</div>
                        <div>
                          <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500, marginBottom: 2 }}>{b.client_name || b.user_name}</div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ fontSize: 11, color: "#aaa" }}>{b.work_title || "Consultation Inquiry"}</div>
                            {b.weather && (
                              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(201,169,110,0.08)", padding: "1px 6px", borderRadius: 4 }}>
                                <span style={{ fontSize: 10 }}>{b.weather.condition?.toLowerCase().includes("rain") ? "🌧️" : "🌤️"}</span>
                                <span style={{ fontSize: 9, color: "#a07830", fontWeight: 500 }}>{b.weather.avg_temp}°C</span>
                              </div>
                            )}
                          </div>
                          {b.weather?.condition?.toLowerCase().includes("rain") && (
                            <div style={{ fontSize: 9, color: "#c9705a", fontWeight: 600, marginTop: 4 }}>⚠️ Rain Expected</div>
                          )}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 600, marginBottom: 4 }}>{b.value}</div>
                        <span style={{
                          fontSize: 9, padding: "3px 10px", borderRadius: 20,
                          letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500,
                          background: b.status === 'APPROVED' ? 'rgba(90,154,110,0.1)' : 'rgba(201,169,110,0.1)', 
                          color: b.status === 'APPROVED' ? '#5a9a6e' : '#C9A96E',
                          border: `1px solid ${b.status === 'APPROVED' ? 'rgba(90,154,110,0.2)' : 'rgba(201,169,110,0.2)'}`,
                        }}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right column */}
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div
                    onClick={() => setActive("Portfolio")}
                    className="upload-zone"
                    style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
                  >
                    <div style={{ fontSize: 28, color: "#d4cfc9", marginBottom: 10 }}>◻</div>
                    <div style={{ fontSize: 12, color: "#aaa", letterSpacing: "0.06em", fontWeight: 500 }}>Upload New Work</div>
                    <div style={{ fontSize: 10, color: "#ccc", marginTop: 4 }}>Add to your portfolio</div>
                  </div>
                  <div
                    onClick={() => setActive("Reviews")}
                    style={{
                      background: "linear-gradient(135deg, #1C1917, #2a2320)", borderRadius: 16,
                      padding: "24px", textAlign: "center", cursor: "pointer",
                      border: "1px solid rgba(201,169,110,0.15)",
                      transition: "all 0.25s",
                    }}
                  >
                    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "#C9A96E", lineHeight: 1 }}>4.92</div>
                    <div style={{ fontSize: 18, color: "#C9A96E", margin: "8px 0 4px" }}>★★★★★</div>
                    <div style={{ fontSize: 9, color: "#4a4540", letterSpacing: "0.16em", textTransform: "uppercase" }}>Average Rating</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ PORTFOLIO ══ */}
          {active === "Portfolio" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Your Work</div>
                  <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: "#1a1a1a", marginBottom: 4 }}>
                    Portfolio
                  </h1>
                  <p style={{ fontSize: 13, color: "#9a9490" }}>Showcase your finest work to the world.</p>
                </div>
                <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
                  <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Create Work
                </button>
              </div>

              {loadingWorks && (
                <div style={{ padding: "80px", textAlign: "center", color: "#bbb" }}>
                  <div style={{
                    width: 28, height: 28, border: "2.5px solid #f0ece8",
                    borderTop: "2.5px solid #C9A96E", borderRadius: "50%",
                    animation: "spin 0.8s linear infinite", margin: "0 auto 16px"
                  }} />
                  <div style={{ fontSize: 12, letterSpacing: "0.08em" }}>Sourcing your portfolio pieces…</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
                {works.length === 0 && !loadingWorks && (
                  <div style={{
                    gridColumn: "1 / -1", padding: "80px 40px", textAlign: "center",
                    border: "2px dashed #e0ddd8", borderRadius: 16,
                  }}>
                    <div style={{ fontSize: 32, color: "#e0ddd8", marginBottom: 12 }}>◻</div>
                    <p style={{ color: "#bbb", fontSize: 14, marginBottom: 4 }}>No works yet</p>
                    <p style={{ color: "#ccc", fontSize: 12 }}>Start your journey by creating your first work.</p>
                  </div>
                )}
                {works.map((p, idx) => (
                  <div key={p.id} className="card card-lift portfolio-card" style={{ overflow: "hidden", cursor: "pointer" }} onClick={() => navigate(`/vendor/work/${p.id}`)}>
                    <div style={{ position: "relative", height: 210, overflow: "hidden" }}>
                      <img
                        src={getWorkThumbnail(p)} alt={p.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform 0.4s ease" }}
                      />
                      <div style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%)",
                      }} />
                      <div style={{ position: "absolute", top: 12, left: 12 }}>
                        <span className="tag-badge" style={{ backdropFilter: "blur(8px)", background: "rgba(28,25,23,0.7)" }}>
                          {p.tags || "Portfolio"}
                        </span>
                      </div>
                      <div style={{
                        position: "absolute", bottom: 12, right: 12,
                        background: "rgba(28,25,23,0.7)", backdropFilter: "blur(6px)",
                        borderRadius: 8, padding: "4px 10px",
                        fontSize: 11, color: "#C9A96E", fontWeight: 600,
                      }}>
                        ★ 5.0
                      </div>
                    </div>

                    <div style={{ padding: "20px" }}>
                      <div style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 600, marginBottom: 6, letterSpacing: "0.01em" }}>{p.title}</div>
                      <p style={{ fontSize: 12, color: "#9a9490", lineHeight: 1.6, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.description}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f0ece8" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#d4cfc9" }} />
                        <span style={{ fontSize: 11, color: "#bbb" }}>{p.images?.length || 0} media assets</span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }} onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-ghost"
                          onClick={() => handleEditClick(p)}
                          style={{ padding: "9px 12px", fontSize: 10 }}
                        >
                          Edit Details
                        </button>
                        <label className="btn-primary" style={{ padding: "9px 12px", fontSize: 10, textAlign: "center", cursor: "pointer" }}>
                          + Images
                          <input type="file" multiple hidden onChange={(e) => handleImageUpload(e, p.id)} />
                        </label>
                        <button
                          onClick={() => handleDeleteWork(p.id)}
                          style={{
                            gridColumn: "span 2", background: "transparent", border: "none",
                            color: "#c07060", padding: "8px", fontSize: 10, letterSpacing: "0.1em",
                            textTransform: "uppercase", cursor: "pointer", fontWeight: 500,
                            opacity: 0.75, transition: "opacity 0.2s",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                          onMouseEnter={e => e.target.style.opacity = 1}
                          onMouseLeave={e => e.target.style.opacity = 0.75}
                        >
                          Archive Project
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ BOOKINGS ══ */}
          {active === "Bookings" && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Schedule</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: "#1a1a1a", marginBottom: 4 }}>
                  Bookings
                </h1>
                <p style={{ fontSize: 13, color: "#9a9490" }}>Manage all your confirmed and pending events.</p>
              </div>

              <div className="card" style={{ overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#FAFAF8" }}>
                      {["Booking ID", "Client", "Event", "Date", "Weather", "Status", "Actions"].map(h => (
                        <th key={h} style={{
                          padding: "14px 20px", textAlign: h === "Actions" ? "center" : "left",
                          fontSize: 9, color: "#bbb", letterSpacing: "0.2em",
                          textTransform: "uppercase", fontWeight: 600,
                          borderBottom: "1px solid #f0ece8",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vendorBookings.map((b, i) => (
                      <tr key={b.id} className="row-hover" style={{ borderBottom: i < vendorBookings.length - 1 ? "1px solid #f5f2ef" : "none" }}>
                        <td style={{ padding: "18px 20px" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#C9A96E", fontWeight: 500 }}>#LV-{b.id}</span>
                        </td>
                        <td style={{ padding: "18px 20px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: 8,
                              background: `hsl(${i * 55 + 20}, 30%, 92%)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 13, fontWeight: 600, color: `hsl(${i * 55 + 20}, 40%, 40%)`,
                              fontFamily: "'Playfair Display', serif", flexShrink: 0,
                            }}>{(b.client_name || b.user_name || "A")[0]}</div>
                            <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>{b.client_name || b.user_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "18px 20px", fontSize: 12.5, color: "#777" }}>{b.work_title || "Consultation Inquiry"}</td>
                        <td style={{ padding: "18px 20px", fontSize: 12, color: "#999", fontFamily: "'DM Mono', monospace" }}>{new Date(b.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "18px 20px" }}>
                          {b.weather ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 14 }}>{b.weather.condition?.toLowerCase().includes("rain") ? "🌧️" : "🌤️"}</span>
                                <span style={{ fontSize: 12, color: "#1a1a1a", fontWeight: 500 }}>{b.weather.avg_temp}°C</span>
                              </div>
                              <div style={{ fontSize: 10, color: "#aaa", textTransform: "capitalize" }}>{b.weather.condition}</div>
                              {b.weather.condition?.toLowerCase().includes("rain") && (
                                <div style={{ fontSize: 9, color: "#c9705a", fontWeight: 600 }}>⚠️ Warning: Rain</div>
                              )}
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: "#ccc" }}>No data</span>
                          )}
                        </td>
                        <td style={{ padding: "18px 20px" }}>
                          <span style={{
                            fontSize: 9, padding: "4px 12px", borderRadius: 20,
                            letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600,
                            background: b.status === 'APPROVED' ? 'rgba(90,154,110,0.1)' : 'rgba(201,169,110,0.1)', 
                            color: b.status === 'APPROVED' ? '#5a9a6e' : '#C9A96E',
                            border: `1px solid ${b.status === 'APPROVED' ? 'rgba(90,154,110,0.2)' : 'rgba(201,169,110,0.2)'}`,
                          }}>{b.status}</span>
                        </td>
                        <td style={{ padding: "18px 20px" }}>
                           <div style={{ display: "flex", gap: 8 }}>
                             {b.status === 'PENDING' && (
                               <>
                                 <button 
                                   onClick={() => handleUpdateBooking(b.id, 'APPROVED')} 
                                   style={{ background: "#7ab87a", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                                 >Approve</button>
                                 <button 
                                   onClick={() => handleUpdateBooking(b.id, 'REJECTED')} 
                                   style={{ background: "#c9705a", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 4, fontSize: 10, cursor: "pointer" }}
                                 >Reject</button>
                               </>
                             )}
                             {b.status !== 'PENDING' && <span style={{ fontSize: 10, color: "#bbb" }}>Processed</span>}
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ REVIEWS ══ */}
          {active === "Reviews" && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Reputation</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: "#1a1a1a" }}>Reviews</h1>
              </div>

              <div style={{ display: "flex", gap: 20, marginBottom: 28 }}>
                <div style={{
                  background: "linear-gradient(135deg, #1C1917, #2a2320)",
                  borderRadius: 16, padding: "32px 40px", textAlign: "center",
                  border: "1px solid rgba(201,169,110,0.15)",
                }}>
                  <div style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: 58, color: "#C9A96E", fontWeight: 300, lineHeight: 1,
                  }}>4.92</div>
                  <div style={{ fontSize: 22, color: "#C9A96E", margin: "10px 0 8px" }}>★★★★★</div>
                  <div style={{ fontSize: 9, color: "#4a4540", letterSpacing: "0.18em", textTransform: "uppercase" }}>Average Rating</div>
                  <div style={{ fontSize: 11, color: "#5a5450", marginTop: 6 }}>From 48 reviews</div>
                </div>

                <div className="card" style={{ flex: 1, padding: "28px" }}>
                  <div style={{ fontSize: 11, color: "#bbb", letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 20, fontWeight: 500 }}>Rating Distribution</div>
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: "#C9A96E", width: 8, flexShrink: 0 }}>{"★".repeat(star === 5 ? 1 : 0)}</span>
                      <span style={{ fontSize: 11, color: "#bbb", width: 8, flexShrink: 0 }}>{star}</span>
                      <div style={{ flex: 1, height: 6, background: "#f0ece8", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          background: star >= 4 ? "linear-gradient(90deg, #C9A96E, #e8c888)" : "#d8d4ce",
                          width: star === 5 ? "78%" : star === 4 ? "16%" : star === 3 ? "4%" : "1%",
                          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                        }} />
                      </div>
                      <span style={{ fontSize: 11, color: "#bbb", width: 28, textAlign: "right" }}>
                        {star === 5 ? "78%" : star === 4 ? "16%" : star === 3 ? "4%" : "1%"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                {REVIEWS.map((r, i) => (
                  <div key={i} className="card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 12,
                        background: `linear-gradient(135deg, hsl(${i*80+30},40%,88%), hsl(${i*80+30},40%,82%))`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: `hsl(${i*80+30},40%,44%)`, fontWeight: 700,
                        fontFamily: "'Playfair Display', serif",
                      }}>{r.avatar}</div>
                      <div>
                        <div style={{ fontSize: 14, color: "#1a1a1a", fontWeight: 500 }}>{r.name}</div>
                        <div style={{ fontSize: 13, color: "#C9A96E", letterSpacing: "0.04em" }}>{"★".repeat(r.rating)}</div>
                      </div>
                      <div style={{ marginLeft: "auto", fontSize: 11, color: "#ccc", fontFamily: "'DM Mono', monospace" }}>{r.date}</div>
                    </div>
                    <p style={{
                      fontSize: 14, color: "#6a6460", lineHeight: 1.75,
                      fontFamily: "'Playfair Display', serif", fontStyle: "italic",
                      padding: "14px 18px", background: "#FAFAF8", borderRadius: 10,
                      borderLeft: "3px solid #f0e8d8",
                    }}>
                      "{r.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {active === "Messages" && (
            <div style={{ display: "flex", gap: 20, height: "calc(100vh - 140px)" }}>
              {/* Conversations list */}
              <div className="card" style={{ width: 290, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0ece8" }}>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 400, color: "#1a1a1a" }}>Messages</h3>
                </div>
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {roomsLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 12 }}>Loading conversations...</div>
                  ) : chatRooms.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "#bbb", fontSize: 12 }}>No inquiries yet.</div>
                  ) : (
                    chatRooms.map((c, i) => (
                      <div 
                        key={c.id} 
                        onClick={() => setSelectedRoomId(c.id.toString())}
                        className="row-hover" 
                        style={{
                          padding: "16px 20px", borderBottom: "1px solid #f8f5f2",
                          cursor: "pointer", background: selectedRoomId === c.id.toString() ? "rgba(201,169,110,0.05)" : "transparent",
                        }}
                      >
                        <div style={{ display: "flex", gap: 12 }}>
                          <div style={{ position: "relative", flexShrink: 0 }}>
                            <div style={{
                              width: 40, height: 40, borderRadius: 12,
                              background: `hsl(${i * 70 + 20}, 30%, 90%)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 15, fontWeight: 700, color: `hsl(${i * 70 + 20}, 40%, 45%)`,
                              fontFamily: "'Playfair Display', serif",
                            }}>{(c.user_name || c.name || "U")[0]}</div>
                            {c.online && <div style={{
                              position: "absolute", bottom: 1, right: 1,
                              width: 9, height: 9, borderRadius: "50%",
                              background: "#7ab87a", border: "2px solid #fff",
                            }} />}
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center" }}>
                              <span style={{ fontSize: 13, color: "#1a1a1a", fontWeight: 500 }}>{c.user_name || c.name}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 10, color: "#ccc", fontFamily: "'DM Mono', monospace" }}>{c.last_message_time || "1h"}</span>
                                {c.unread_count > 0 && (
                                  <div style={{
                                    width: 17, height: 17, borderRadius: "50%",
                                    background: "#C9A96E", display: "flex", alignItems: "center",
                                    justifyContent: "center", fontSize: 9, color: "#1C1917", fontWeight: 700,
                                  }}>{c.unread_count}</div>
                                )}
                              </div>
                            </div>
                            <div style={{ fontSize: 11.5, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {c.last_message || "Start the chat..."}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat panel */}
              <div style={{ flex: 1, height: "100%" }}>
                {selectedRoomId ? (
                  <ChatRoom roomId={selectedRoomId} currentUser={user} />
                ) : (
                  <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>◎</div>
                    <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18 }}>Select an inquiry to begin</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ SETTINGS ══ */}
          {active === "Settings" && (
            <div style={{ maxWidth: 580 }}>
              <div style={{ marginBottom: 36 }}>
                <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500, marginBottom: 8 }}>Account</div>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 400, color: "#1a1a1a", marginBottom: 4 }}>
                  Settings
                </h1>
                <p style={{ fontSize: 13, color: "#9a9490" }}>Manage your studio profile and preferences.</p>
              </div>

              <div className="card" style={{ padding: "32px" }}>
                {[
                  { label: "Studio Name", val: "Atelier Blanc", placeholder: "Your studio name" },
                  { label: "Email", val: "hello@atelierblanc.in", placeholder: "hello@example.com" },
                  { label: "Specialty", val: "Destination Weddings, Goa", placeholder: "Your specialty" },
                  { label: "Location", val: "Goa, India", placeholder: "City, Country" },
                ].map((f, i) => (
                  <div key={f.label} style={{ marginBottom: 24 }}>
                    <label style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.16em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 600 }}>
                      {f.label}
                    </label>
                    <input
                      className="input-field"
                      defaultValue={f.val}
                      placeholder={f.placeholder}
                    />
                  </div>
                ))}

                <div style={{ paddingTop: 8 }}>
                  <button className="btn-primary" style={{ width: "100%", justifyContent: "center", padding: "14px" }}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ══ CREATE/EDIT WORK MODAL ══ */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setIsEditMode(false); }}>
          <div className="modal-panel" onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 9, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>
                {isEditMode ? "Update Entry" : "New Entry"}
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, fontWeight: 400, color: "#1a1a1a", marginBottom: 6 }}>
                {isEditMode ? "Edit Project Details" : "Create New Work"}
              </h2>
              <p style={{ fontSize: 13, color: "#9a9490" }}>{isEditMode ? "Modify your work item details." : "Describe your project to attract potential clients."}</p>
            </div>

            <form onSubmit={handleCreateWork}>
              {[
                { label: "Title", key: "title", placeholder: "e.g. Udaipur Summer Wedding", type: "text", required: true },
                { label: "Tags", key: "tags", placeholder: "e.g. Wedding, Luxury, Destination", type: "text", required: false },
                { label: "Latitude", key: "latitude", placeholder: "e.g. 27.2046", type: "number", required: true, step: "any" },
                { label: "Longitude", key: "longitude", placeholder: "e.g. 77.4977", type: "number", required: true, step: "any" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.16em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 600 }}>{f.label}</label>
                  <input
                    className="input-field"
                    type={f.type}
                    step={f.step}
                    required={f.required}
                    value={newWork[f.key]}
                    onChange={e => setNewWork({ ...newWork, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                  />
                </div>
              ))}

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.16em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 600 }}>Description</label>
                <textarea
                  className="input-field"
                  required
                  value={newWork.description}
                  onChange={e => setNewWork({ ...newWork, description: e.target.value })}
                  placeholder="Tell the story of this event…" 
                  style={{ minHeight: 88, resize: "none" }}
                />
              </div>

              {!isEditMode && (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.16em", textTransform: "uppercase", display: "block", marginBottom: 8, fontWeight: 600 }}>Gallery Images</label>
                  <label style={{
                    display: "block", border: "2px dashed #e0ddd8", borderRadius: 12,
                    padding: "20px", textAlign: "center", cursor: "pointer",
                    transition: "all 0.2s", background: "#FAFAF8",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "#C9A96E"; e.currentTarget.style.background = "rgba(201,169,110,0.04)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e0ddd8"; e.currentTarget.style.background = "#FAFAF8"; }}
                  >
                    <div style={{ fontSize: 20, color: "#d4cfc9", marginBottom: 6 }}>◻</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginBottom: 2 }}>
                      {newWork.images?.length > 0 ? `${newWork.images.length} file(s) selected` : "Click to upload images"}
                    </div>
                    <div style={{ fontSize: 10, color: "#ccc" }}>PNG, JPG, WEBP supported</div>
                    <input type="file" multiple hidden onChange={e => setNewWork({ ...newWork, images: e.target.files })} />
                  </label>
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button type="submit" className="btn-primary" disabled={createLoading} style={{ flex: 1, justifyContent: "center", padding: "14px", opacity: createLoading ? 0.7 : 1 }}>
                  {createLoading ? "Processing…" : (isEditMode ? "Save Changes" : "Create Project")}
                </button>
                <button type="button" className="btn-ghost" onClick={() => { setIsModalOpen(false); setIsEditMode(false); }} style={{ padding: "14px 20px" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}