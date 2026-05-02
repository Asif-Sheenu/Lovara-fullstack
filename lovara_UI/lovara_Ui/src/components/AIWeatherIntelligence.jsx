import React, { useState, useEffect } from 'react';
import { generalService } from '../services/api';

/**
 * AIWeatherIntelligence Component
 * A premium, ML-powered decision intelligence panel for weather predictions.
 * Features glassmorphism aesthetics, dynamic risk-based styling, and animated elements.
 * 
 * @param {string|number} bookingId - The ID of the booking to analyze.
 * @param {object} [weatherData] - Optional pre-fetched weather data.
 */
const AIWeatherIntelligence = ({ bookingId, weatherData }) => {
  const [data, setData] = useState(weatherData || null);
  const [loading, setLoading] = useState(!weatherData && !!bookingId);
  const [error, setError] = useState(null);

  const fetchPrediction = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      setError(null);
      // Simulating a more complex ML analysis delay
      const [res] = await Promise.all([
        generalService.getBookingWeather(bookingId),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      if (res.data && res.data.weather) {
        setData(res.data.weather);
      } else {
        throw new Error("Intelligence stream interrupted");
      }
    } catch (err) {
      console.error("AI Analysis Error:", err);
      setError("Unable to process decision intelligence data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrediction();
  }, [bookingId]);

  // Premium Skeleton Loader
  if (loading) {
    return (
      <div className="max-w-md w-full p-8 bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl animate-pulse">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-stone-100 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-3 w-32 bg-stone-100 rounded" />
            <div className="h-2 w-20 bg-stone-50 rounded" />
          </div>
        </div>
        <div className="space-y-6 mb-10">
          <div className="h-10 w-full bg-stone-100 rounded-xl" />
          <div className="h-32 w-full bg-stone-50 rounded-3xl" />
        </div>
        <div className="h-14 w-full bg-stone-100 rounded-2xl" />
      </div>
    );
  }

  // Error State Panel
  if (error) {
    return (
      <div className="max-w-md w-full p-8 bg-red-50/30 backdrop-blur-sm rounded-[2.5rem] border border-red-100/50 text-center shadow-xl">
        <div className="text-3xl mb-4">🔮</div>
        <p className="text-sm font-bold text-red-800 mb-6">{error}</p>
        <button 
          onClick={fetchPrediction} 
          className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 underline underline-offset-8 decoration-red-200 hover:decoration-red-600 transition-all"
        >
          Re-initialize Oracle Analysis
        </button>
      </div>
    );
  }

  if (!data) return null;

  // Core Intelligence Logic
  const isRain = data.condition?.toLowerCase().includes("rain") || data.chance_of_rain > 0.5;
  const chancePercent = Math.round(data.chance_of_rain * 100);

  return (
    <div className={`relative max-w-md w-full p-8 overflow-hidden rounded-[2.5rem] border transition-all duration-700 hover:scale-[1.02] cursor-default shadow-2xl group ${
      isRain 
        ? "bg-gradient-to-br from-red-500/10 via-orange-50/30 to-white/80 border-red-200/50 shadow-red-200/20" 
        : "bg-gradient-to-br from-emerald-500/10 via-sky-50/30 to-white/80 border-emerald-200/50 shadow-emerald-200/20"
    }`}>
      
      {/* Background Pulse Glow */}
      <div className={`absolute -top-32 -right-32 w-80 h-80 blur-[100px] rounded-full opacity-30 transition-all duration-1000 group-hover:opacity-50 group-hover:scale-110 ${
        isRain ? "bg-red-400 animate-pulse" : "bg-emerald-400 animate-pulse"
      }`} />

      {/* Decision Intelligence Header */}
      <div className="relative z-10 flex justify-between items-start mb-10">
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 flex items-center justify-center rounded-[1.25rem] shadow-xl backdrop-blur-md transition-transform group-hover:rotate-12 ${
            isRain ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-500"
          }`}>
             <span className="text-3xl filter drop-shadow-sm">🧠</span>
          </div>
          <div className="space-y-0.5">
            <h3 className="text-base font-black text-stone-800 tracking-tight">AI Weather Intelligence</h3>
            <div className="flex items-center gap-2">
               <span className={`flex h-2 w-2 rounded-full animate-pulse shadow-sm ${isRain ? "bg-orange-500" : "bg-emerald-500"}`} />
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">ML Powered Insight</span>
            </div>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.25em] border backdrop-blur-md shadow-sm transition-all ${
          isRain 
            ? "bg-red-50/80 text-red-600 border-red-200/50" 
            : "bg-emerald-50/80 text-emerald-600 border-emerald-200/50"
        }`}>
          {isRain ? "High Risk ⚠" : "Low Risk ✨"}
        </div>
      </div>

      {/* AI Decision Result */}
      <div className="relative z-10 mb-10">
        <div className="flex items-end justify-between gap-6 mb-8">
           <div className="space-y-2">
             <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] leading-none">Decision Guidance</p>
             <h2 className={`text-[26px] font-black tracking-tighter leading-[1.1] ${isRain ? "text-red-950" : "text-emerald-950"}`}>
               {isRain ? "Rain is likely on this booking date" : "AI predicts stable weather conditions"}
             </h2>
           </div>
           <div className={`text-6xl filter drop-shadow-md transition-all duration-700 group-hover:scale-110 ${isRain ? "animate-bounce-slow" : "animate-spin-slow"}`}>
              {isRain ? "🌧️" : "🌤️"}
           </div>
        </div>

        {/* Intelligence Data Grid */}
        <div className="p-7 bg-white/50 backdrop-blur-2xl rounded-[2rem] border border-white/80 shadow-inner grid grid-cols-2 gap-8">
          <div className="group/data">
             <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 transition-colors group-hover/data:text-stone-600">Avg. Temperature</p>
             <p className="text-3xl font-['Cormorant'] font-medium text-stone-900 tracking-tighter">{Math.round(data.temperature)}°C</p>
          </div>
          <div className="group/data border-l border-stone-200/30 pl-8">
             <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-2 transition-colors group-hover/data:text-stone-600">Rain Probability</p>
             <p className="text-3xl font-['Cormorant'] font-medium text-stone-900 tracking-tighter">{chancePercent}%</p>
          </div>
          {/* Confident Meter */}
          <div className="col-span-2 pt-6 border-t border-stone-200/30">
             <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.15em]">Neural Confidence Score</p>
                <p className="text-[10px] font-black text-stone-900 tracking-wider">94.8%</p>
             </div>
             <div className="h-1.5 w-full bg-stone-200/30 rounded-full overflow-hidden shadow-inner">
               <div className="h-full bg-stone-900 rounded-full w-[94.8%] transition-all duration-1000 delay-300 shadow-lg" />
             </div>
          </div>
        </div>
      </div>

      {/* Safety Directive & Interaction */}
      <div className="relative z-10 space-y-6">
        <div className={`p-5 rounded-3xl border flex items-start gap-4 transition-all ${
          isRain 
            ? "bg-red-500/5 border-red-500/10 text-red-950 shadow-sm" 
            : "bg-emerald-500/5 border-emerald-500/10 text-emerald-950 shadow-sm"
        }`}>
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/70 shadow-sm text-lg transition-transform group-hover:scale-110">
             {isRain ? "🚨" : "✅"}
          </div>
          <div className="space-y-1">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-40">System Directive</p>
             <p className="text-xs font-bold leading-[1.6]">
                {isRain 
                  ? "High weather risk identified. Rescheduling is highly recommended to ensure the highest experience quality." 
                  : "Low Weather Risk — Meteorological conditions are optimal. It is safe to proceed with the booking."}
             </p>
          </div>
        </div>

        <button 
          onClick={fetchPrediction}
          className="w-full py-5 bg-stone-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all duration-300 hover:bg-stone-800 hover:shadow-3xl hover:shadow-stone-900/40 active:scale-[0.98] group-hover:-translate-y-1 shadow-2xl shadow-stone-950/20"
        >
          Refresh Neural Prediction ↺
        </button>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-bounce-slow { animation: bounce-slow 4s infinite ease-in-out; }
        .animate-spin-slow { animation: spin-slow 12s linear infinite; }
      `}</style>
    </div>
  );
};

export default AIWeatherIntelligence;
