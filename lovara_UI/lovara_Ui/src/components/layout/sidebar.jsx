import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/Authcontext';

const NAV = [
  { label: "Discover",     icon: "✦", sub: "Collections", path: "/user?tab=Discover" },
  { label: "Artisans",     icon: "⊛", sub: "Vendors",     path: "/user?tab=Artisans" },
  { label: "Saved",        icon: "◇", sub: "Wishlist",    path: "/user?tab=Saved" },
  { label: "My Bookings",  icon: "◈", sub: "Events",      path: "/user?tab=My Bookings" },
  { label: "Messages",     icon: "◎", sub: "Inbox",       path: "/user?tab=Messages" },
  { label: "AI Search",    icon: "🪄", sub: "Discovery",   path: "/user/ai-search" },
  { label: "Account",      icon: "◉", sub: "Profile",     path: "/user?tab=Account" },
];

const Sidebar = ({ activeLabel }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user?.full_name || "Premium User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-[#FDFBF8] to-[#F8F5F0] flex flex-col fixed top-0 left-0 z-[100] border-r border-black/5 shadow-2xl shadow-black/5 font-['Jost']">
      {/* Wordmark */}
      <div className="p-8 pb-6 border-b border-black/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#C9A96E] to-[#8a6028] flex items-center justify-center font-['Cormorant_Garamond'] text-2xl text-[#FDFBF8] font-semibold shadow-lg shadow-[#C9A96E]/30">
            L
          </div>
          <div>
            <div className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#1a1612] tracking-wide leading-none">
              Lov<span className="text-[#C9A96E] italic">ara</span>
            </div>
            <div className="font-['DM_Mono'] text-[8px] color-[#C9A96E]/70 tracking-[0.3em] uppercase mt-1">
              Luxury Events
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {NAV.map(({ label, icon, sub, path }) => {
          const isA = activeLabel === label;
          return (
            <div 
              key={label} 
              className={`flex items-center gap-3.5 px-5 py-3 mx-3 rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300 group ${
                isA ? 'bg-[#C9A96E]/10' : 'hover:bg-[#C9A96E]/5'
              }`}
              onClick={() => navigate(path)}
            >
              {/* Active Indicator Bar */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full bg-gradient-to-b from-[#C9A96E] to-[#a07830] transition-all duration-500 ${
                isA ? 'h-[60%]' : 'h-0'
              }`} />
              
              <span className={`text-[13px] w-5 text-center transition-colors duration-300 ${isA ? 'text-[#C9A96E]' : 'text-[#c0b8ac] group-hover:text-[#C9A96E]'}`}>
                {icon}
              </span>
              <div className="leading-tight">
                <div className={`text-[11.5px] font-medium tracking-wide transition-colors duration-300 ${isA ? 'text-[#C9A96E]' : 'text-[#4a4038]'}`}>
                  {label}
                </div>
                <div className="text-[8.5px] tracking-[0.1em] opacity-40 font-['DM_Mono'] mt-0.5">
                  {sub}
                </div>
              </div>
              {isA && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C9A96E] animate-pulse shadow-[0_0_8px_rgba(201,169,110,0.8)]" />
              )}
            </div>
          );
        })}
      </nav>

      {/* User tile */}
      <div className="p-4 pt-0 mb-6 border-t border-black/5">
        <div className="bg-gradient-to-br from-[#f5f0e8] to-[#ede5d8] rounded-2xl p-4 border border-[#C9A96E]/15 mb-3 mt-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex-shrink-0 bg-gradient-to-br from-[#C9A96E] to-[#8a6028] flex items-center justify-center font-['Cormorant_Garamond'] text-lg text-[#FDFBF8] font-bold shadow-md shadow-[#C9A96E]/30">
              {userInitials}
            </div>
            <div className="overflow-hidden">
              <div className="text-[13px] text-[#1a1612] font-medium tracking-tight truncate">{userName}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7ab87a] animate-pulse" />
                <span className="font-['DM_Mono'] text-[8px] text-[#C9A96E]/70 tracking-widest uppercase truncate">Gold Member</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { logout(); navigate("/login"); }}
          className="w-full py-3 rounded-xl bg-[#d96a5a]/10 border border-[#d96a5a]/20 text-[#d96a5a] text-[10px] font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:bg-[#d96a5a]/20 hover:border-[#d96a5a]/30"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
