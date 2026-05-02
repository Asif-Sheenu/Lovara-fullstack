import React from 'react';
import { NotificationBell } from '../NotificationToast';

const Navbar = ({ activeLabel = "AI Search", notifications = [], onClearHistory = () => {} }) => {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user?.full_name || "User";
  const userInitials = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <header className="h-[66px] flex items-center justify-between px-10 sticky top-0 z-[50] bg-[#F7F4EF]/80 backdrop-blur-3xl border-b border-black/5">
      <div className="flex items-center gap-4">
        <span className="font-['DM_Mono'] text-[9px] text-[#c0b8ac] tracking-[0.4em] uppercase">User / {activeLabel}</span>
      </div>

      <div className="flex items-center gap-5">
        {/* Live Status indicator */}
        <div className="flex items-center gap-2 bg-[#7ab87a]/10 border border-[#7ab87a]/20 rounded-full px-3.5 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#7ab87a] animate-pulse" />
          <span className="font-['DM_Mono'] text-[9px] text-[#4a8a62] tracking-widest uppercase">Live System</span>
        </div>

        {/* Notif Bell */}
        <NotificationBell notifications={notifications} onClear={onClearHistory} />

        {/* User Profile Avatar */}
        <div className="w-9 h-9 rounded-xl cursor-pointer bg-gradient-to-br from-[#C9A96E] to-[#8a6028] flex items-center justify-center font-['Cormorant_Garamond'] text-sm text-[#FDFBF8] font-bold shadow-lg shadow-[#C9A96E]/20 transition-transform duration-300 hover:scale-110 active:scale-95">
          {userInitials}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
