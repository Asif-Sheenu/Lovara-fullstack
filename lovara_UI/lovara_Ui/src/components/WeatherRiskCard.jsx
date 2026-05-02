import React, { useState, useEffect } from 'react';
import { generalService } from '../services/api';

/**
 * WeatherRiskCard Component
 * A premium SaaS-style dashboard card that displays weather predictions and rain risks for bookings.
 * 
 * @param {string|number} bookingId - The ID of the booking to fetch weather for.
 * @param {function} onViewDetails - Callback function for viewing booking details.
 */
const WeatherRiskCard = ({ bookingId, onViewDetails }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async () => {
    if (!bookingId) return;
    
    try {
      setLoading(true);
      setError(null);
      const res = await generalService.getBookingWeather(bookingId);
      
      // Expected backend structure: { "weather": { "condition": "...", "temperature": ..., "chance_of_rain": ..., "date": "..." } }
      if (res.data && res.data.weather) {
        setWeather(res.data.weather);
      } else {
        throw new Error("Invalid data format received from weather service");
      }
    } catch (err) {
      console.error("Weather fetch error:", err);
      setError("Unable to fetch weather data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, [bookingId]);

  // Loading State - Skeleton Loader
  if (loading) {
    return (
      <div className="max-w-md w-full p-6 bg-white rounded-2xl shadow-sm border border-stone-100 animate-pulse">
        <div className="flex justify-between items-start mb-8">
          <div className="space-y-2">
            <div className="h-2 w-20 bg-stone-100 rounded"></div>
            <div className="h-2 w-16 bg-stone-50 rounded"></div>
          </div>
          <div className="h-6 w-28 bg-stone-100 rounded-full"></div>
        </div>
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
             <div className="h-12 w-24 bg-stone-100 rounded-lg"></div>
             <div className="h-8 w-8 bg-stone-50 rounded-full"></div>
          </div>
          <div className="h-6 w-40 bg-stone-100 rounded-md"></div>
          <div className="h-16 w-full bg-stone-50 rounded-xl"></div>
        </div>
        <div className="h-12 w-full bg-stone-100 rounded-xl mb-6"></div>
        <div className="flex gap-3">
          <div className="h-10 flex-1 bg-stone-100 rounded-xl"></div>
          <div className="h-10 w-24 bg-stone-50 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Error State Handling
  if (error) {
    return (
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-red-50 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
          ⚠️
        </div>
        <h3 className="text-stone-900 font-bold mb-2">Connection Interrupted</h3>
        <p className="text-sm text-stone-500 mb-6 leading-relaxed">{error}. Please verify your network and try again.</p>
        <button 
          onClick={fetchWeather}
          className="px-6 py-2.5 bg-stone-900 text-white text-xs font-bold tracking-widest uppercase rounded-lg hover:bg-stone-800 transition-colors"
        >
          Retry Prediction
        </button>
      </div>
    );
  }

  if (!weather) return null;

  // Visual logic based on rain probability and condition
  const isRainy = weather.condition.toLowerCase().includes("rain") || weather.chance_of_rain > 0.6;
  const chancePercent = Math.round(weather.chance_of_rain * 100);

  return (
    <div className={`max-w-md w-full p-6 rounded-2xl shadow-sm border transition-all duration-500 hover:shadow-xl ${
      isRainy 
        ? "bg-gradient-to-br from-red-50/40 via-white to-amber-50/20 border-red-100" 
        : "bg-gradient-to-br from-sky-50/40 via-white to-emerald-50/20 border-stone-200"
    }`}>
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[10px] font-bold tracking-[0.25em] text-stone-400 uppercase mb-1.5">Weather Prediction</h3>
          <p className="font-mono text-[10px] text-stone-300">{weather.date}</p>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-colors ${
          isRainy 
            ? "bg-red-50 text-red-600 border-red-100" 
            : "bg-emerald-50 text-emerald-600 border-emerald-100"
        }`}>
          {isRainy ? "⚠ Weather Risk" : "☀️ Safe Weather"}
        </div>
      </div>

      {/* Main Meteorological Data */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[56px] font-light font-['Cormorant'] text-stone-900 leading-none">
            {Math.round(weather.temperature)}°
          </span>
          <span className="text-4xl filter drop-shadow-sm">
            {isRainy ? "🌧️" : "🌤️"}
          </span>
        </div>
        <h2 className="text-xl font-bold text-stone-800 capitalize tracking-tight mb-5">
          {weather.condition}
        </h2>

        {/* Rain Probability Indicator */}
        <div className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
           <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-stone-400 tracking-wider uppercase">Chance of Precipitation</span>
              <span className={`text-xs font-bold ${isRainy ? "text-red-500" : "text-emerald-500"}`}>{chancePercent}%</span>
           </div>
           <div className="h-2 w-full bg-stone-100/50 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ease-out rounded-full ${isRainy ? "bg-red-400" : "bg-emerald-400"}`}
                style={{ width: `${chancePercent}%` }}
              />
           </div>
        </div>
      </div>

      {/* AI Recommendation / Safety Messaging */}
      <div className={`flex items-start gap-3 p-4 rounded-xl border mb-8 transition-colors ${
        isRainy ? "bg-red-100/20 border-red-200/30" : "bg-emerald-100/20 border-emerald-200/30"
      }`}>
        <span className="text-base mt-0.5">{isRainy ? "⚠️" : "✨"}</span>
        <p className={`text-xs leading-relaxed font-medium ${isRainy ? "text-red-800" : "text-emerald-800"}`}>
          {isRainy 
            ? "This booking might be affected due to rain. Consider rescheduling to ensure the highest experience quality." 
            : "The sky looks clear and weather is optimal for this booking day. Proceed with confidence."}
        </p>
      </div>

      {/* Action Suite */}
      <div className="flex gap-3">
        <button 
          onClick={onViewDetails}
          className="flex-1 py-3.5 px-6 bg-stone-900 text-white text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl transition-all hover:bg-stone-800 hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-stone-900/10"
        >
          View Details
        </button>
        <button 
          onClick={fetchWeather}
          className="py-3.5 px-6 bg-white text-stone-900 border border-stone-200 text-[10px] font-bold tracking-[0.2em] uppercase rounded-xl transition-all hover:bg-stone-50 hover:border-stone-300"
          title="Refresh Prediction"
        >
          Refresh ↺
        </button>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .weather-card-animate {
          animation: fadeUp 0.6s ease-out both;
        }
      `}</style>
    </div>
  );
};

export default WeatherRiskCard;
