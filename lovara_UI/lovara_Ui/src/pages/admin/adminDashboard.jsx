import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService, BACKEND_URL } from "../../services/api";
import { NotificationBell } from "../../components/NotificationToast";
import { useAuth } from "../../context/Authcontext";

const NAV = [
  { id: "Command",      icon: "◈", label: "Command"       },
  { id: "Vendors",      icon: "◇", label: "Vendors"       },
  { id: "Users",        icon: "○", label: "Users"         },
  { id: "Bookings",     icon: "▣", label: "Bookings"      },
  { id: "Risk Monitor", icon: "⚠", label: "Risk Monitor", alert: true },
  { id: "System",       icon: "◎", label: "System"        },
  { id: "Reports",      icon: "↓", label: "Reports"       },
];

const VENDORS = [
  { id:"V-001", name:"Atelier Blanc",     loc:"Goa",     bookings:48, revenue:"₹8.4L",  rating:4.9, status:"Active",  joined:"Jan 2024" },
  { id:"V-002", name:"Château Events",    loc:"Udaipur", bookings:32, revenue:"₹6.2L",  rating:5.0, status:"Active",  joined:"Feb 2024" },
  { id:"V-003", name:"The Golden Thread", loc:"Mumbai",  bookings:89, revenue:"₹3.1L",  rating:4.8, status:"Active",  joined:"Nov 2023" },
  { id:"V-004", name:"Rasa Studios",      loc:"Jaipur",  bookings:12, revenue:"₹94K",   rating:4.9, status:"Pending", joined:"Mar 2024" },
  { id:"V-005", name:"Lumière Co.",       loc:"Delhi",   bookings:27, revenue:"₹1.8L",  rating:4.7, status:"Active",  joined:"Dec 2023" },
  { id:"V-006", name:"Muse Collective",   loc:"Kerala",  bookings:61, revenue:"₹2.4L",  rating:4.8, status:"Flagged", joined:"Oct 2023" },
];

const USERS = [
  { id:"U-1291", name:"Priya Sharma", email:"priya@gmail.com", event:"Sep 2025 · Goa",     bookings:3, status:"Active"   },
  { id:"U-1290", name:"Arjun Mehta",  email:"arjun@gmail.com", event:"Oct 2025 · Mumbai",  bookings:1, status:"Active"   },
  { id:"U-1289", name:"Isha Kapoor",  email:"isha@gmail.com",  event:"Apr 2025 · Udaipur", bookings:5, status:"Active"   },
  { id:"U-1288", name:"Rohan Verma",  email:"rohan@gmail.com", event:"Apr 2025 · Jaipur",  bookings:2, status:"Inactive" },
  { id:"U-1287", name:"Kavya Nair",   email:"kavya@gmail.com", event:"Dec 2025 · Kerala",  bookings:4, status:"Active"   },
];

const BOOKINGS = [
  { id:"LV-2401", client:"Priya Sharma", vendor:"Atelier Blanc",    event:"Destination Wedding · Goa",  date:"Sep 14, 2025", value:"₹2,40,000", status:"Confirmed" },
  { id:"LV-2402", client:"Arjun Mehta",  vendor:"Lumière Co.",       event:"Corporate Gala · Mumbai",    date:"Mar 22, 2025", value:"₹85,000",   status:"Pending"   },
  { id:"LV-2403", client:"Isha Kapoor",  vendor:"Château Events",    event:"Engagement · Udaipur",       date:"Apr 5, 2025",  value:"₹1,20,000", status:"Confirmed" },
  { id:"LV-2404", client:"Rohan Verma",  vendor:"The Golden Thread", event:"Wedding · Jaipur",           date:"Apr 18, 2025", value:"₹3,60,000", status:"Disputed"  },
  { id:"LV-2405", client:"Kavya Nair",   vendor:"Muse Collective",   event:"Wedding · Kerala",           date:"Dec 8, 2025",  value:"₹1,80,000", status:"Pending"   },
];

const RISKS = [
  { location:"Goa",     month:"Sep 2025", score:78, level:"HIGH",   clients:12, alert:true  },
  { location:"Kerala",  month:"Sep 2025", score:82, level:"HIGH",   clients:8,  alert:true  },
  { location:"Mumbai",  month:"Oct 2025", score:34, level:"MEDIUM", clients:6,  alert:false },
  { location:"Udaipur", month:"Sep 2025", score:12, level:"LOW",    clients:15, alert:false },
  { location:"Jaipur",  month:"Nov 2025", score:18, level:"LOW",    clients:9,  alert:false },
];

const SERVICES = [
  { name:"Django Core API",      uptime:"99.98%", resp:"42ms",  status:"ONLINE"   },
  { name:"FastAPI Risk Service", uptime:"99.91%", resp:"128ms", status:"ONLINE"   },
  { name:"Redis Cache",          uptime:"100%",   resp:"2ms",   status:"ONLINE"   },
  { name:"WebSocket Server",     uptime:"99.87%", resp:"8ms",   status:"ONLINE"   },
  { name:"Celery Task Queue",    uptime:"99.95%", resp:"—",     status:"ONLINE"   },
  { name:"PostgreSQL Primary",   uptime:"100%",   resp:"18ms",  status:"ONLINE"   },
  { name:"Cloudinary CDN",       uptime:"99.99%", resp:"64ms",  status:"ONLINE"   },
  { name:"Email Service",        uptime:"97.2%",  resp:"340ms", status:"DEGRADED" },
];

const BADGE = {
  Active:    { c:"#34d399", bg:"rgba(52,211,153,.1)",  b:"rgba(52,211,153,.22)"  },
  Confirmed: { c:"#34d399", bg:"rgba(52,211,153,.1)",  b:"rgba(52,211,153,.22)"  },
  Pending:   { c:"#C9A96E", bg:"rgba(201,169,110,.1)", b:"rgba(201,169,110,.22)" },
  Flagged:   { c:"#f87171", bg:"rgba(248,113,113,.1)", b:"rgba(248,113,113,.22)" },
  Disputed:  { c:"#f87171", bg:"rgba(248,113,113,.1)", b:"rgba(248,113,113,.22)" },
  Inactive:  { c:"#4a5568", bg:"rgba(74,85,104,.1)",   b:"rgba(74,85,104,.22)"   },
  ONLINE:    { c:"#34d399", bg:"rgba(52,211,153,.1)",  b:"rgba(52,211,153,.22)"  },
  DEGRADED:  { c:"#C9A96E", bg:"rgba(201,169,110,.1)", b:"rgba(201,169,110,.22)" },
};

const RISK_C = { HIGH:"#f87171", MEDIUM:"#C9A96E", LOW:"#34d399" };

// ─── Micro-components ───────────────────────────────────────

function Badge({ s }) {
  const st = BADGE[s] || BADGE.Pending;
  return (
    <span style={{
      fontFamily:"'DM Mono',monospace", fontSize:10, fontWeight:500,
      letterSpacing:"0.07em", padding:"3px 10px", borderRadius:4,
      background:st.bg, color:st.c, border:`1px solid ${st.b}`,
    }}>{s.toUpperCase()}</span>
  );
}

function Th({ ch }) {
  return (
    <th style={{
      padding:"12px 18px", textAlign:"left",
      fontFamily:"'DM Mono',monospace", fontSize:10,
      color:"#4a5568", letterSpacing:"0.15em",
      borderBottom:"1px solid #253045", whiteSpace:"nowrap", fontWeight:400,
    }}>{ch}</th>
  );
}

function StatCard({ label, value, sub, accent, delay=0, onClick }) {
  return (
    <div onClick={onClick}
      style={{
        background:"#161c27", border:"1px solid #253045",
        borderTop:`2px solid ${accent}`, borderRadius:8, padding:"22px 20px",
        animationName: 'fadeUp', 
        animationDuration: '.45s', 
        animationDelay: `${delay}s`, 
        animationTimingFunction: 'ease', 
        animationFillMode: 'both',
        cursor: onClick?"pointer":"default",
        transition:"background .2s",
      }}
      onMouseEnter={e=>onClick&&(e.currentTarget.style.background="#1c2433")}
      onMouseLeave={e=>onClick&&(e.currentTarget.style.background="#161c27")}
    >
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", letterSpacing:"0.18em", marginBottom:14 }}>{label}</div>
      <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:40, fontWeight:300, color:accent, lineHeight:1, marginBottom:10 }}>{value}</div>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568" }}>{sub}</div>
    </div>
  );
}

function Surface({ children, style={} }) {
  return (
    <div style={{ background:"#161c27", border:"1px solid #253045", borderRadius:8, ...style }}>
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, title }) {
  return (
    <div style={{ marginBottom:26 }}>
      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", letterSpacing:"0.2em", marginBottom:7 }}>{eyebrow}</div>
      <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:300, color:"#eef1f6", letterSpacing:"-0.01em" }}>{title}</h1>
    </div>
  );
}

// ─── Main ───────────────────────────────────────────────────

export default function AdminDashboard({ notifHistory, clearHistory }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState("Command");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [stats, setStats] = useState({ users: "3,841", vendors: "312", bookings: "1,204", alerts: "2" });
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [pendingRes, usersRes, vendorsRes] = await Promise.all([
        authService.getPendingVendors(),
        authService.getAllUsers(),
        authService.getAllVendors()
      ]);
      setPendingVendors(pendingRes.data || []);
      setAllUsers(usersRes.data || []);
      setAllVendors(vendorsRes.data || []);
    } catch (err) {
      console.error("Failed to fetch admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (vendorId, status) => {
    try {
      if (status === 'APPROVED') {
        await authService.approveVendor(vendorId);
      } else {
        await authService.rejectVendor(vendorId);
      }
      // Refresh list
      fetchAllData();
      alert(`Vendor ${status === 'APPROVED' ? 'Approved' : 'Rejected'} successfully.`);
    } catch (err) {
      console.error(`Failed to ${status} vendor:`, err);
      alert(`Failed to ${status} vendor. Please try again.`);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
      }
    }
  }, []);

  const userName = user?.full_name || "Super Admin";
  // Get first two characters or first letters of first two words
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div style={{ fontFamily:"'Jost',sans-serif", background:"#0d1117", minHeight:"100vh", display:"flex", color:"#eef1f6" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

        @keyframes fadeUp  {from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes pulse   {0%,100%{opacity:.4}50%{opacity:1}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes glow    {0%,100%{box-shadow:0 0 8px rgba(201,169,110,.15)}50%{box-shadow:0 0 18px rgba(201,169,110,.3)}}

        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#0d1117}
        ::-webkit-scrollbar-thumb{background:#253045;border-radius:4px}

        .nav-link{
          display:flex;align-items:center;justify-content:space-between;
          padding:10px 22px;cursor:pointer;
          font-family:'DM Mono',monospace;font-size:10.5px;letter-spacing:.1em;
          color:rgba(238, 241, 246, 0.45);border-left:2px solid transparent;
          transition:all .18s ease;
        }
        .nav-link:hover{color:#8b96a8;background:rgba(255,255,255,.025);}
        .nav-link.active{color:#C9A96E;border-left-color:#C9A96E;background:rgba(201,169,110,.06);}

        .trow td{border-bottom:1px solid #1a2236;transition:background .12s;}
        .trow:last-child td{border-bottom:none;}
        .trow:hover td{background:rgba(255,255,255,.022);}

        .btn-ghost{
          background:none;border:none;cursor:pointer;padding:0;
          font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.08em;
          color:#4a5568;transition:color .15s;
        }
        .btn-ghost:hover{color:#C9A96E;}

        .report-row{
          background:#161c27;border:1px solid #253045;border-radius:8px;
          padding:18px 22px;cursor:pointer;display:flex;align-items:center;
          justify-content:space-between;transition:all .2s;margin-bottom:10px;
        }
        .report-row:hover{background:#1c2433;border-color:rgba(201,169,110,.35);}

        input,select{font-family:'DM Mono',monospace!important;}
        input::placeholder{color:#253045;}
        table{border-collapse:collapse;width:100%;}
      `}</style>

      {/* ═══ SIDEBAR ═══════════════════════════════════════ */}
      <aside style={{
        width:216, minHeight:"100vh",
        background:"#111827",
        borderRight:"1px solid #1e2a3d",
        display:"flex", flexDirection:"column",
        position:"fixed", top:0, left:0, zIndex:50,
      }}>

        {/* Logo */}
        <div style={{ padding:"26px 22px 20px", borderBottom:"1px solid #1e2a3d" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:5 }}>
            <div style={{ width:2, height:24, background:"#C9A96E", borderRadius:2 }}/>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:600, color:"#eef1f6", letterSpacing:"0.04em" }}>
              Lov<span style={{ color:"#C9A96E" }}>ara</span>
            </span>
          </div>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:8.5, color:"#253045", letterSpacing:"0.2em", marginLeft:11 }}>
            ADMIN CONSOLE · v2
          </div>
        </div>

        {/* Live pill */}
        <div style={{ padding:"11px 22px", borderBottom:"1px solid #1e2a3d", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399", animation:"pulse 2s ease infinite" }}/>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#34d399", letterSpacing:".1em" }}>SYSTEMS OPERATIONAL</span>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"12px 0" }}>
          {NAV.map(n=>(
            <div key={n.id} className={`nav-link${active===n.id?" active":""}`} onClick={()=>setActive(n.id)}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:13 }}>{n.icon}</span>
                <span>{n.label.toUpperCase()}</span>
              </div>
              {n.alert&&<span style={{ width:7, height:7, borderRadius:"50%", background:"#f87171", animation:"pulse 1.5s ease infinite", display:"inline-block" }}/>}
            </div>
          ))}
        </nav>

        {/* Admin user */}
        <div style={{ padding: "16px 22px", borderTop: "1px solid #1e2a3d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: "rgba(201,169,110,.1)", border: "1px solid rgba(201,169,110,.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#C9A96E", fontWeight: 500,
            }}>{userInitials}</div>
            <div>
              <div style={{ fontSize: 12, color: "#c5ccda", fontWeight: 500 }}>{userName}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: "#253045", marginTop: 1 }}>{user?.email || "lovara.in"}</div>
            </div>
          </div>
          
          <button 
            onClick={() => { logout(); navigate("/login"); }}
            style={{
              width: "100%", padding: "9px", borderRadius: 6,
              background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)",
              color: "#f87171", fontSize: 9, fontWeight: 600, letterSpacing: "0.1em",
              textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Mono', monospace"
            }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(248,113,113,0.15)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "rgba(248,113,113,0.08)"; }}
          >
            TERMINATE SESSION
          </button>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════ */}
      <main style={{ marginLeft:216, flex:1, display:"flex", flexDirection:"column" }}>

        {/* Topbar */}
        <header style={{
          height:56, borderBottom:"1px solid #1e2a3d",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"0 28px", background:"#111827",
          position:"sticky", top:0, zIndex:20,
        }}>
          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#2d3f58", letterSpacing:".12em" }}>
            LOVARA / {active.toUpperCase().replace(" ","_")}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:16 }}>
            <input
              value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                background:"#161c27", border:"1px solid #253045", borderRadius:6,
                padding:"7px 14px", fontSize:11, color:"#8b96a8",
                outline:"none", width:190,
              }}
            />
            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#253045" }}>
              {new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase()}
            </span>
            <NotificationBell notifications={notifHistory} onClear={clearHistory} />
            <div style={{
              width:34, height:34, borderRadius:8,
              background:"rgba(201,169,110,.1)", border:"1px solid rgba(201,169,110,.25)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily: "'DM Mono',monospace", fontSize: 11, color: "#C9A96E", cursor: "pointer",
            }}>{userInitials}</div>
          </div>
        </header>

        {/* Content */}
        <div style={{ padding:"28px 28px 40px", animation:"fadeIn .3s ease" }}>

          {/* ── COMMAND ────────────────────────────────────── */}
          {active==="Command"&&(
            <div>
              <SectionHead eyebrow="COMMAND CENTER" title="Platform Overview"/>

              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:22 }}>
                <StatCard label="TOTAL USERS"    value={allUsers.length || "..."} sub="+12 this week"     accent="#C9A96E" delay={0}    onClick={()=>setActive("Users")}/>
                <StatCard label="ACTIVE VENDORS" value={allVendors.length || "..."}   sub={`${pendingVendors.length} pending review`}  accent="#60a5fa" delay={0.07} onClick={()=>setActive("Vendors")}/>
                <StatCard label="LIVE BOOKINGS"  value="1,204" sub="₹4.2 Cr total GMV"  accent="#34d399" delay={0.14} onClick={()=>setActive("Bookings")}/>
                <StatCard label="RISK ALERTS"    value="2"     sub="Goa · Kerala · Sep" accent="#f87171" delay={0.21} onClick={()=>setActive("Risk Monitor")}/>
              </div>

              {/* Two column */}
              <div style={{ display:"grid", gridTemplateColumns:"1.45fr 1fr", gap:14 }}>

                {/* Recent bookings table */}
                <Surface>
                  <div style={{ padding:"18px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #1e2a3d" }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8b96a8", letterSpacing:".12em" }}>RECENT BOOKINGS</span>
                    <button className="btn-ghost" onClick={()=>setActive("Bookings")}>VIEW ALL →</button>
                  </div>
                  <table>
                    <tbody>
                      {BOOKINGS.slice(0,4).map(b=>(
                        <tr key={b.id} className="trow">
                          <td style={{ padding:"13px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#C9A96E" }}>{b.id}</td>
                          <td style={{ padding:"13px 18px" }}>
                            <div style={{ fontSize:13, color:"#eef1f6", fontWeight:500 }}>{b.client}</div>
                            <div style={{ fontSize:11, color:"#4a5568", marginTop:2 }}>{b.vendor}</div>
                          </td>
                          <td style={{ padding:"13px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568", whiteSpace:"nowrap" }}>{b.date}</td>
                          <td style={{ padding:"13px 18px" }}><Badge s={b.status}/></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Surface>

                {/* Right column */}
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  {/* Risk alerts */}
                  <Surface>
                    <div style={{ padding:"18px 20px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #1e2a3d" }}>
                      <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8b96a8", letterSpacing:".12em" }}>RISK ALERTS</span>
                      <button className="btn-ghost" onClick={()=>setActive("Risk Monitor")}>VIEW ALL →</button>
                    </div>
                    <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:10 }}>
                      {RISKS.filter(r=>r.alert).map((r,i)=>(
                        <div key={i} style={{
                          padding:"13px 16px", borderRadius:6,
                          background:"rgba(248,113,113,.06)",
                          border:"1px solid rgba(248,113,113,.18)",
                        }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
                            <span style={{ fontSize:13, color:"#eef1f6", fontWeight:500 }}>{r.location}</span>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#f87171", letterSpacing:".08em" }}>
                              {r.level} · {r.score}%
                            </span>
                          </div>
                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568" }}>
                            {r.clients} clients · Rain probability · {r.month}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Surface>

                  {/* System health mini */}
                  <Surface style={{ padding:"16px 18px" }}>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", letterSpacing:".16em", marginBottom:12 }}>PLATFORM HEALTH</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {SERVICES.slice(0,4).map(s=>(
                        <div key={s.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            <div style={{ width:5, height:5, borderRadius:"50%", background:s.status==="ONLINE"?"#34d399":"#C9A96E", animation:"pulse 2s ease infinite" }}/>
                            <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8b96a8" }}>{s.name}</span>
                          </div>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#253045" }}>{s.resp}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn-ghost" style={{ marginTop:12, fontSize:9, letterSpacing:".12em" }} onClick={()=>setActive("System")}>
                      VIEW ALL SERVICES →
                    </button>
                  </Surface>
                </div>
              </div>
            </div>
          )}

          {/* ── VENDORS ────────────────────────────────────── */}
          {active==="Vendors"&&(
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                <SectionHead eyebrow="VENDOR MANAGEMENT" title="All Vendors"/>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568", paddingBottom:4 }}>{allVendors.length} total</div>
              </div>
              
              {/* Pending Approvals Section */}
              {pendingVendors.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#C9A96E", letterSpacing:".2em", marginBottom:15 }}>PENDING APPROVALS</div>
                  <Surface style={{ overflow:"hidden", border: "1px solid rgba(201,169,110,.3)" }}>
                    <table>
                      <thead><tr>
                        {["ID","Vendor","Business","Specialty","Docs","Actions"].map(h=><Th key={h} ch={h}/>)}
                      </tr></thead>
                      <tbody>
                        {pendingVendors.map(v=>(
                          <tr key={v.id} className="trow">
                            <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#C9A96E" }}>{v.id || 'N/A'}</td>
                            <td style={{ padding:"14px 18px" }}>
                              <div style={{ fontSize:13, color:"#eef1f6", fontWeight:500 }}>{v.full_name}</div>
                              <div style={{ fontSize:11, color:"#4a5568", marginTop:2 }}>{v.email}</div>
                            </td>
                            <td style={{ padding:"14px 18px", fontSize:12, color:"#8b96a8" }}>{v.business_name}</td>
                            <td style={{ padding:"14px 18px", fontSize:12, color:"#8b96a8" }}>{v.specialty}</td>
                            <td style={{ padding:"14px 18px" }}>
                              {v.certificate ? (
                                <button 
                                  onClick={() => setSelectedCert(v.certificate.replace(/^\/+/, ''))}
                                  className="btn-ghost"
                                  style={{ color: "#C9A96E", textDecoration: "underline" }}
                                >VIEW</button>
                              ) : (
                                <span style={{ fontSize:10, color:"#4a5568" }}>N/A</span>
                              )}
                            </td>
                            <td style={{ padding:"14px 18px" }}>
                              <div style={{ display:"flex", gap:14 }}>
                                <button 
                                  onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
                                  style={{
                                    background: "rgba(52,211,153,.1)", color: "#34d399",
                                    border: "1px solid rgba(52,211,153,.2)", padding: "4px 10px",
                                    borderRadius: 4, cursor: "pointer", fontSize: 10,
                                    fontFamily: "'DM Mono',monospace"
                                  }}
                                >APPROVE</button>
                                <button 
                                  onClick={() => handleUpdateStatus(v.id, 'REJECTED')}
                                  style={{
                                    background: "rgba(248,113,113,.1)", color: "#f87171",
                                    border: "1px solid rgba(248,113,113,.2)", padding: "4px 10px",
                                    borderRadius: 4, cursor: "pointer", fontSize: 10,
                                    fontFamily: "'DM Mono',monospace"
                                  }}
                                >REJECT</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Surface>
                </div>
              )}

              <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", letterSpacing:".2em", marginBottom:15 }}>REGISTERED VENDORS</div>
              <Surface style={{ overflow:"hidden" }}>
                <table>
                  <thead><tr>
                    {["ID","Vendor","Location","Bookings","Revenue","Rating","Status","Actions"].map(h=><Th key={h} ch={h}/>)}
                  </tr></thead>
                  <tbody>
                    {allVendors.map(v=>(
                      <tr key={v.id} className="trow">
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#C9A96E" }}>{v.id || 'N/A'}</td>
                        <td style={{ padding:"14px 18px" }}>
                          <div style={{ fontSize:13, color:"#eef1f6", fontWeight:500 }}>{v.business_name || v.full_name}</div>
                          <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", marginTop:3 }}>Joined {v.date_joined ? new Date(v.date_joined).toLocaleDateString() : 'Recent'}</div>
                        </td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8b96a8" }}>{v.location || 'Pan India'}</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#8b96a8" }}>0</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#eef1f6", fontWeight:500 }}>₹0</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#C9A96E" }}>★ {v.rating || '5.0'}</td>
                        <td style={{ padding:"14px 18px" }}><Badge s={v.status || 'Active'}/></td>
                        <td style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", gap:14 }}>
                            <button className="btn-ghost" onClick={() => alert(`Reviewing documents for ${v.full_name}`)}>VIEW Docs</button>
                            <button className="btn-ghost" style={{ color:v.status==="Flagged"?"#34d399":"#f87171" }}>
                              {v.status==="Flagged"?"UNFLAG":"FLAG"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            </div>
          )}

          {/* ── USERS ──────────────────────────────────────── */}
          {active==="Users"&&(
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:24 }}>
                <SectionHead eyebrow="USER MANAGEMENT" title="All Users"/>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568", paddingBottom:4 }}>{allUsers.length} registered</div>
              </div>
              <Surface style={{ overflow:"hidden" }}>
                <table>
                  <thead><tr>
                    {["ID","Name","Email","Upcoming Event","Bookings","Status","Actions"].map(h=><Th key={h} ch={h}/>)}
                  </tr></thead>
                  <tbody>
                    {allUsers.map(u=>(
                      <tr key={u.id} className="trow">
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#C9A96E" }}>{u.id || 'N/A'}</td>
                        <td style={{ padding:"14px 18px", fontSize:13, color:"#eef1f6", fontWeight:500 }}>{u.full_name}</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#8b96a8" }}>{u.email}</td>
                        <td style={{ padding:"14px 18px", fontSize:12, color:"#8b96a8" }}>{u.wants_to_be_staff ? 'Vendor Track' : 'Client Profile'}</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#8b96a8" }}>0</td>
                        <td style={{ padding:"14px 18px" }}><Badge s={u.status || 'Active'}/></td>
                        <td style={{ padding:"14px 18px" }}>
                          <div style={{ display:"flex", gap:14 }}>
                            <button className="btn-ghost" onClick={() => alert(`Details for ${u.full_name}`)}>VIEW</button>
                            <button className="btn-ghost" style={{ color:"#f87171" }}>SUSPEND</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            </div>
          )}

          {/* ── BOOKINGS ───────────────────────────────────── */}
          {active==="Bookings"&&(
            <div>
              <SectionHead eyebrow="BOOKING MANAGEMENT" title="All Bookings"/>
              <Surface style={{ overflow:"hidden" }}>
                <table>
                  <thead><tr>
                    {["ID","Client","Vendor","Event","Date","Value","Status"].map(h=><Th key={h} ch={h}/>)}
                  </tr></thead>
                  <tbody>
                    {BOOKINGS.map(b=>(
                      <tr key={b.id} className="trow">
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#C9A96E" }}>{b.id}</td>
                        <td style={{ padding:"14px 18px", fontSize:13, color:"#eef1f6", fontWeight:500 }}>{b.client}</td>
                        <td style={{ padding:"14px 18px", fontSize:12, color:"#8b96a8" }}>{b.vendor}</td>
                        <td style={{ padding:"14px 18px", fontSize:12, color:"#8b96a8" }}>{b.event}</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568", whiteSpace:"nowrap" }}>{b.date}</td>
                        <td style={{ padding:"14px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#eef1f6", fontWeight:500 }}>{b.value}</td>
                        <td style={{ padding:"14px 18px" }}><Badge s={b.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            </div>
          )}

          {/* ── RISK MONITOR ───────────────────────────────── */}
          {active==="Risk Monitor"&&(
            <div>
              <SectionHead eyebrow="AI RISK DETECTION · FASTAPI" title="Risk Monitor"/>

              {/* Alert banner */}
              <div style={{
                padding:"13px 20px", marginBottom:20, borderRadius:7,
                background:"rgba(248,113,113,.07)", border:"1px solid rgba(248,113,113,.24)",
                display:"flex", alignItems:"center", gap:12,
              }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:"#f87171", flexShrink:0, animation:"pulse 1.5s ease infinite" }}/>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"#f87171", letterSpacing:".05em" }}>
                  2 HIGH RISK ALERTS — Goa &amp; Kerala — September 2025 — 20 clients affected
                </span>
              </div>

              <div style={{ display:"grid", gap:11 }}>
                {RISKS.map((r,i)=>(
                  <Surface key={i} style={{
                    padding:"20px 24px",
                    borderColor:r.alert?"rgba(248,113,113,.28)":"#253045",
                  }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                          <span style={{ fontSize:16, color:"#eef1f6", fontWeight:500 }}>{r.location}</span>
                          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#4a5568", letterSpacing:".1em" }}>{r.month}</span>
                          {r.alert&&<span style={{ color:"#f87171", fontSize:12 }}>⚠</span>}
                        </div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568" }}>
                          {r.clients} clients with active bookings this period
                        </div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:42, fontWeight:300, color:RISK_C[r.level], lineHeight:1 }}>
                          {r.score}%
                        </div>
                        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:RISK_C[r.level], letterSpacing:".14em", marginTop:3 }}>
                          {r.level} RISK
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div style={{ height:3, background:"#1e2a3d", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${r.score}%`, background:RISK_C[r.level], borderRadius:2, transition:"width 1s ease" }}/>
                    </div>
                  </Surface>
                ))}
              </div>
            </div>
          )}

          {/* ── SYSTEM ─────────────────────────────────────── */}
          {active==="System"&&(
            <div>
              <SectionHead eyebrow="INFRASTRUCTURE" title="System Status"/>

              {/* Summary */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:22 }}>
                <StatCard label="SERVICES ONLINE" value="7/8"   sub="1 service degraded"   accent="#34d399" delay={0}/>
                <StatCard label="SYSTEM UPTIME"   value="99.7%" sub="30-day rolling"         accent="#C9A96E" delay={0.07}/>
                <StatCard label="AVG RESPONSE"    value="75ms"  sub="across all endpoints"  accent="#60a5fa" delay={0.14}/>
              </div>

              <Surface style={{ overflow:"hidden" }}>
                <table>
                  <thead><tr>
                    {["Service","Uptime","Avg Response","Status"].map(h=><Th key={h} ch={h}/>)}
                  </tr></thead>
                  <tbody>
                    {SERVICES.map(s=>(
                      <tr key={s.name} className="trow">
                        <td style={{ padding:"15px 18px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{
                              width:6, height:6, borderRadius:"50%", flexShrink:0,
                              background:s.status==="ONLINE"?"#34d399":"#C9A96E",
                              animation:"pulse 2.2s ease infinite",
                            }}/>
                            <span style={{ fontSize:13, color:"#eef1f6", fontWeight:500 }}>{s.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:"15px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#eef1f6", fontWeight:500 }}>{s.uptime}</td>
                        <td style={{ padding:"15px 18px", fontFamily:"'DM Mono',monospace", fontSize:11, color:"#8b96a8" }}>{s.resp}</td>
                        <td style={{ padding:"15px 18px" }}><Badge s={s.status}/></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Surface>
            </div>
          )}

          {/* ── REPORTS ────────────────────────────────────── */}
          {active==="Reports"&&(
            <div style={{ maxWidth:620 }}>
              <SectionHead eyebrow="ANALYTICS & EXPORTS" title="Generate Reports"/>
              {[
                { icon:"◇", title:"Vendor Performance Report",  desc:"Ratings, bookings, revenue breakdown per vendor",  tag:"MONTHLY"   },
                { icon:"₹", title:"Platform Revenue Summary",   desc:"Total GMV, platform commissions, vendor payouts",  tag:"MONTHLY"   },
                { icon:"⚠", title:"AI Risk Analysis Report",    desc:"Weather risk scores, client alerts, predictions",  tag:"LIVE"      },
                { icon:"○", title:"User Acquisition Report",    desc:"Signups, funnel conversion, churn analysis",       tag:"WEEKLY"    },
                { icon:"▣", title:"Booking Dispute Log",        desc:"All disputed and flagged booking transactions",    tag:"ON DEMAND" },
              ].map((r,i)=>(
                <div key={i} className="report-row">
                  <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                    <div style={{
                      width:38, height:38, borderRadius:8, flexShrink:0,
                      background:"rgba(201,169,110,.08)", border:"1px solid rgba(201,169,110,.2)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:15, color:"#C9A96E",
                    }}>{r.icon}</div>
                    <div>
                      <div style={{ fontSize:14, color:"#eef1f6", fontWeight:500, marginBottom:3 }}>{r.title}</div>
                      <div style={{ fontFamily:"'DM Mono',monospace", fontSize:10, color:"#4a5568" }}>{r.desc}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:14, flexShrink:0 }}>
                    <span style={{ fontFamily:"'DM Mono',monospace", fontSize:9, color:"#253045", letterSpacing:".12em" }}>{r.tag}</span>
                    <span style={{ fontSize:16, color:"#C9A96E" }}>↓</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* ── Certificate Modal ────────────────────────── */}
        {selectedCert && (
          <div 
            onClick={() => setSelectedCert(null)}
            style={{
              position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
              background: "rgba(0,0,0,0.85)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(5px)", padding: "40px"
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                background: "#161c27", border: "1px solid #253045",
                borderRadius: 12, width: "100%", maxWidth: "900px", maxHeight: "90vh",
                display: "flex", flexDirection: "column", overflow: "hidden",
                animation: "fadeUp .3s ease"
              }}
            >
              <div style={{ 
                padding: "16px 24px", borderBottom: "1px solid #1e2a3d",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#8b96a8", letterSpacing: ".12em" }}>LICENSE / CERTIFICATE</span>
                <button 
                  onClick={() => setSelectedCert(null)}
                  style={{ background: "none", border: "none", color: "#4a5568", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center" }}
                >×</button>
              </div>
              <div style={{ flex: 1, padding: "2px", background: "#0d1117", minHeight: "600px" }}>
                {selectedCert.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={selectedCert} width="100%" height="600px" style={{ border: "none" }} />
                ) : (
                  <div style={{ height: "600px", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                    <img src={selectedCert} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="Certificate" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}