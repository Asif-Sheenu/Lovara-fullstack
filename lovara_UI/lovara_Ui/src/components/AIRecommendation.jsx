import React, { useState, useEffect } from 'react';
import { generalService } from '../services/api';

/**
 * AIRecommendation Component
 * A premium AI-powered recommendation feature for the booking flow.
 * @param {string|number} workId - ID of the service.
 * @param {string} selectedDate - Selected date.
 * @param {string} [weather] - Optional weather condition.
 */
const AIRecommendation = ({ workId, selectedDate, weather }) => {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [error, setError] = useState(null);
  const [displayText, setDisplayText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const fetchRecommendation = async () => {
    if (!selectedDate) {
      setError("Please select a preferred date first to unlock AI intelligence.");
      setTimeout(() => setError(null), 4000);
      return;
    }

    setLoading(true);
    setError(null);
    setRecommendation(null);
    setDisplayText("");

    try {
      // Small artificial delay to enhance the "thinking" feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const response = await generalService.getRecommendation({
        work_id: workId,
        date: selectedDate,
        ...(weather && { weather })
      });
      // Expected structure: { recommendation: "..." }
      setRecommendation(response.data.message);
    } catch (err) {
      console.error("AI Recommendation Error:", err);
      // Respectful error handling using axios interceptor message or fallback
      setError(err.message || "Our AI concierge is momentarily resting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Typing effect for the AI response
 useEffect(() => {
  if (recommendation && typeof recommendation === 'string') {
    setIsTyping(true);
    let index = 0;

    const interval = setInterval(() => {
      if (index < recommendation.length) {
        setDisplayText((prev) => prev + recommendation.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 25);

    return () => clearInterval(interval);
  }
}, [recommendation]);

  return (
    <div className="my-8 w-full font-['Outfit']">
      <style>{`
        @keyframes aiFadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes aiPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
        .animate-ai-fade-up { animation: aiFadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-ai-pulse { animation: aiPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
      `}</style>
      {!recommendation && !loading && (
        <button
          onClick={fetchRecommendation}
          className="group relative w-full overflow-hidden rounded-xl transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]"
        >
          {/* Animated Gradient Border */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-stone-400 to-amber-600 opacity-60 group-hover:opacity-100 group-hover:animate-pulse" />
          
          <div className="relative m-[1px] flex items-center justify-center gap-3 rounded-[11px] bg-[#1A1714] px-6 py-4 transition-all duration-500 group-hover:bg-opacity-90">
            <span className="text-lg animate-bounce group-hover:scale-125 transition-transform duration-500">✨</span>
            <span className="text-[10px] font-bold tracking-[0.25em] text-amber-500 uppercase group-hover:text-amber-400">
              Get AI Recommendation
            </span>
            
            {/* Subtle glow effect on hover */}
            <div className="absolute inset-0 -z-10 bg-amber-500/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </div>
        </button>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center gap-5 rounded-2xl border border-stone-100 bg-white/80 p-10 text-center backdrop-blur-md shadow-sm animate-ai-fade-up">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 rounded-full border-[3px] border-amber-500/10" />
            <div className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-amber-500" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-amber-500/10 flex items-center justify-center">
                <span className="text-xs">🧠</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold tracking-[0.3em] text-stone-400 uppercase">Consulting AI Oracle</p>
            <p className="text-xs text-stone-600 font-medium italic animate-pulse">
                "Analyzing weather patterns and historical reviews..."
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/30 p-4 text-center animate-ai-fade-up">
          <div className="flex items-center justify-center gap-2 text-red-600">
            <span className="text-sm">⚠️</span>
            <p className="text-[11px] font-semibold tracking-wide">{error}</p>
          </div>
        </div>
      )}

      {recommendation && (
        <div className="group relative overflow-hidden rounded-2xl border border-stone-100 bg-white p-6 shadow-2xl shadow-stone-200/50 animate-ai-fade-up">
          {/* Premium aesthetics: Decorative background elements */}
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-stone-500/5 blur-3xl" />
          
          <div className="mb-5 flex items-center justify-between border-b border-stone-50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/20">
                <span className="text-sm">🪄</span>
              </div>
              <div>
                <p className="text-[9px] font-extrabold tracking-[0.35em] text-amber-600 uppercase">AI Recommendation</p>
                <p className="text-[10px] font-medium text-stone-400">Lovara Concierge Edition</p>
              </div>
            </div>
            {!isTyping && (
                <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>

          <div className="relative min-h-[80px]">
            <p className="font-['Cormorant'] text-lg leading-relaxed text-stone-800 italic first-letter:text-3xl first-letter:font-bold first-letter:text-amber-600 first-letter:mr-1">
              {displayText}
              {isTyping && (
                <span className="ml-1 inline-block h-5 w-[2px] animate-pulse bg-amber-500 align-middle" />
              )}
            </p>
          </div>

          {!isTyping && (
            <div className="mt-6 flex items-center justify-between border-t border-stone-50 pt-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400">Date Fit:</span>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600 uppercase">Optimal</span>
              </div>
              <button 
                onClick={() => {
                    setRecommendation(null);
                    setDisplayText("");
                }}
                className="text-[10px] font-bold text-stone-400 hover:text-amber-600 uppercase tracking-widest transition-colors duration-300 flex items-center gap-1"
              >
                Refresh ↺
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIRecommendation;
