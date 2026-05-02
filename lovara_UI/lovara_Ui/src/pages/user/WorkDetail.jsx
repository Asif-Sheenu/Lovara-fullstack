import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generalService, chatService, BACKEND_URL } from "../../services/api";
import AIRecommendation from "../../components/AIRecommendation";
import AIWeatherIntelligence from "../../components/AIWeatherIntelligence";

const GF = "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";

export default function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, text: "" });
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [hoverStar, setHoverStar] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [inquireLoading, setInquireLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [bookingWeather, setBookingWeather] = useState(null);
  const heroRef = useRef(null);
  const parallaxRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
      if (parallaxRef.current) {
        parallaxRef.current.style.transform = `translateY(${window.scrollY * 0.35}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchWorkData = async () => {
      try {
        setLoading(true);
        const res = await generalService.getWorkById(id);
        setWork(res.data);
        setLoadingReviews(true);
        const reviewRes = await generalService.getWorkReviews(id);
        setReviews(reviewRes.data || []);
      } catch (err) {
        console.error("Failed to fetch work details", err);
      } finally {
        setLoading(false);
        setLoadingReviews(false);
      }
    };
    fetchWorkData();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await generalService.addReview(id, { rating: newReview.rating, comment: newReview.text });
      setNewReview({ rating: 5, text: "" });
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      const res = await generalService.getWorkReviews(id);
      setReviews(res.data || []);
    } catch (err) {
      alert("Failed to share impression. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecureBooking = async () => {
    if (!selectedDate) {
      alert("Please select a preferred date for your event collection.");
      return;
    }
    try {
      setBookingLoading(true);
      const res = await generalService.createBooking(id, { service_date: selectedDate });
      
      // Capture weather data if available in the response
      if (res.data && res.data.weather) {
        console.log("Weather Data:", res.data.weather);
        setBookingWeather(res.data.weather);
      } else if (res.data && res.data.condition) {
        // Fallback if the weather data is flat in the response
        const flatWeather = {
          condition: res.data.condition,
          temperature: res.data.temperature,
          is_bad_weather: res.data.is_bad_weather
        };
        console.log("Weather Data:", flatWeather);
        setBookingWeather(flatWeather);
      }

      alert("Consultation request secured! Our concierge will connect with you within 2 hours.");

    } catch (err) {
      alert(err.message || "Failed to initialize booking consultation.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleEnquire = async () => {
    try {
      setInquireLoading(true);
      const vendorId = work.vendor_id || work.user; 
      
      if (!vendorId) {
        throw new Error("Unable to identify the artisan for this piece.");
      }

      const res = await chatService.getOrCreateRoom(vendorId);
      const roomId = res.data.room_id || res.data.id;

      // Navigate to dashboard and switch to messages tab with the new room
      // Using existing /user route with state as /messages is not yet defined in AppRoutes
      navigate("/user", { state: { activeTab: "Messages", roomId: roomId } });
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to establish a private connection.");
    } finally {
      setInquireLoading(false);
    }
  };

  const getFullImageUrl = (imgObj) => {
    const url = imgObj?.image_url;
    if (!url) return "/placeholder.jpg";
    return url.startsWith("http") ? url : `http://127.0.0.1:8000${url}`;
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0E0C0A", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('${GF}'); @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:0.3}50%{opacity:1}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 28px" }}>
          <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, border: "1px solid transparent", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
          <div style={{ position: "absolute", inset: 8, border: "1px solid transparent", borderTopColor: "rgba(201,169,110,0.4)", borderRadius: "50%", animation: "spin 0.8s linear infinite reverse" }} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "#4a4540", textTransform: "uppercase", animation: "pulse 2s ease infinite" }}>Curating your experience</div>
      </div>
    </div>
  );

  if (!work) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0E0C0A", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('${GF}');`}</style>
      <div style={{ fontFamily: "'Cormorant', serif", fontSize: 28, color: "#FAF8F5", marginBottom: 8, fontWeight: 300 }}>Collection piece not found</div>
      <div style={{ fontSize: 12, color: "#4a4540", marginBottom: 40, letterSpacing: "0.08em" }}>The requested work may have been archived or moved.</div>
      <button onClick={() => navigate(-1)} style={{ background: "transparent", color: "#C9A96E", border: "1px solid rgba(201,169,110,0.3)", padding: "14px 36px", cursor: "pointer", fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "'Outfit', sans-serif", transition: "all 0.3s" }}>← Return to Gallery</button>
    </div>
  );

  const allImages = work.images || [];
  const heroImage = allImages?.[0]?.image_url || "/placeholder.jpg";
  const galleryImages = allImages;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + (r.rating || 5), 0) / reviews.length).toFixed(1) : "5.0";

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#F6F4F0", minHeight: "100vh", cursor: "default" }}>
      <style>{`
        @import url('${GF}');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #C9A96E;
          --gold-light: #e8c888;
          --gold-dim: rgba(201,169,110,0.15);
          --dark: #0E0C0A;
          --dark-2: #1A1714;
          --cream: #F6F4F0;
          --text: #1a1714;
          --text-muted: #8a8480;
          --border: rgba(0,0,0,0.07);
        }

        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        @keyframes scaleIn { from{transform:scale(1.08);opacity:0}to{transform:scale(1);opacity:1} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(201,169,110,0.1)}50%{box-shadow:0 0 40px rgba(201,169,110,0.25)} }

        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.3); border-radius: 2px; }

        /* NAV */
        .nav-glass {
          background: rgba(14,12,10,0.0);
          border-bottom: 1px solid transparent;
          transition: all 0.5s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-glass.scrolled {
          background: rgba(14,12,10,0.88);
          border-bottom: 1px solid rgba(201,169,110,0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .nav-link-item {
          font-size: 9px; color: rgba(250,248,245,0.5); text-decoration: none;
          letter-spacing: 0.25em; text-transform: uppercase; font-weight: 500;
          transition: color 0.25s; position: relative; padding-bottom: 2px;
        }
        .nav-link-item::after {
          content: ''; position: absolute; bottom: 0; left: 0;
          width: 0; height: 1px; background: var(--gold);
          transition: width 0.3s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-link-item:hover { color: var(--gold); }
        .nav-link-item:hover::after { width: 100%; }

        /* HERO THUMBNAIL STRIP */
        .thumb-item {
          cursor: pointer; overflow: hidden; border-radius: 4px;
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
          opacity: 0.55; flex-shrink: 0;
        }
        .thumb-item:hover, .thumb-item.active { opacity: 1; }
        .thumb-item.active { box-shadow: 0 0 0 2px var(--gold); }

        /* GALLERY */
        .gallery-cell {
          overflow: hidden; border-radius: 6px; cursor: zoom-in;
          position: relative;
        }
        .gallery-cell img {
          transition: transform 1.4s cubic-bezier(0.16,1,0.3,1);
          display: block; width: 100%; height: 100%; object-fit: cover;
        }
        .gallery-cell:hover img { transform: scale(1.06); }
        .gallery-cell .overlay {
          position: absolute; inset: 0;
          background: rgba(14,12,10,0);
          transition: background 0.4s;
          display: flex; align-items: center; justify-content: center;
        }
        .gallery-cell:hover .overlay { background: rgba(14,12,10,0.25); }
        .gallery-cell .zoom-icon {
          opacity: 0; color: #fff; font-size: 22px;
          transition: opacity 0.3s; transform: scale(0.8);
          transition: all 0.3s;
        }
        .gallery-cell:hover .zoom-icon { opacity: 1; transform: scale(1); }

        /* LIGHTBOX */
        .lightbox-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(8,6,4,0.97);
          display: flex; align-items: center; justify-content: center;
          animation: fadeIn 0.25s ease;
          backdrop-filter: blur(12px);
        }
        .lightbox-img {
          max-width: 90vw; max-height: 88vh; object-fit: contain;
          border-radius: 4px; animation: scaleIn 0.3s ease;
          box-shadow: 0 40px 120px rgba(0,0,0,0.6);
        }

        /* CARDS */
        .card-premium {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.05);
          border-radius: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.03);
        }

        /* SIDEBAR CARD */
        .sidebar-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.06);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05), 0 32px 80px rgba(0,0,0,0.04);
        }

        /* BUTTONS */
        .btn-cta {
          width: 100%; padding: 18px; font-size: 10px; letter-spacing: 0.22em;
          text-transform: uppercase; cursor: pointer; font-weight: 600;
          border-radius: 12px; font-family: 'Outfit', sans-serif;
          transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }
        .btn-cta-primary {
          background: linear-gradient(135deg, #1A1714, #2a2320);
          color: #FAF8F5; border: none;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .btn-cta-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          background: linear-gradient(135deg, #2a2320, #3a3330);
        }
        .btn-cta-gold {
          background: linear-gradient(135deg, #C9A96E, #b89050);
          color: #1A1714; border: none;
          box-shadow: 0 4px 20px rgba(201,169,110,0.3);
          animation: glow 3s ease infinite;
        }
        .btn-cta-gold:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(201,169,110,0.45);
        }
        .btn-ghost-dark {
          background: transparent; color: #5a5450;
          border: 1.5px solid #e8e4de;
        }
        .btn-ghost-dark:hover {
          border-color: var(--gold); color: var(--gold);
          background: var(--gold-dim);
        }

        /* REVIEW STARS */
        .star-btn {
          cursor: pointer; font-size: 28px; transition: all 0.2s;
          background: none; border: none; padding: 0;
          line-height: 1;
        }
        .star-btn:hover { transform: scale(1.2); }

        /* TEXTAREA */
        .review-textarea {
          width: 100%; min-height: 140px;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 12px; padding: 20px;
          font-size: 14px; color: rgba(250,248,245,0.85);
          outline: none; font-family: 'Outfit', sans-serif;
          line-height: 1.65; resize: none;
          transition: border-color 0.25s, background 0.25s;
        }
        .review-textarea:focus {
          border-color: rgba(201,169,110,0.4);
          background: rgba(255,255,255,0.08);
        }
        .review-textarea::placeholder { color: rgba(255,255,255,0.2); }

        /* DIVIDER */
        .ornament-divider {
          display: flex; align-items: center; gap: 16px; margin: 0;
        }
        .ornament-divider::before, .ornament-divider::after {
          content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, rgba(201,169,110,0.25));
        }
        .ornament-divider::after { background: linear-gradient(90deg, rgba(201,169,110,0.25), transparent); }

        /* SECTION LABEL */
        .section-eyebrow {
          font-size: 9px; color: var(--gold); letter-spacing: 0.35em;
          text-transform: uppercase; font-weight: 600; display: flex;
          align-items: center; gap: 12px;
        }
        .section-eyebrow::before {
          content: ''; width: 20px; height: 1px; background: var(--gold);
        }

        /* REVIEW CARD */
        .review-card {
          background: #fff; border: 1px solid rgba(0,0,0,0.05);
          border-radius: 14px; padding: 28px;
          animation: fadeUp 0.5s ease both;
          transition: box-shadow 0.25s;
        }
        .review-card:hover {
          box-shadow: 0 8px 28px rgba(0,0,0,0.07);
        }

        /* BACK BTN */
        .back-btn {
          background: none; border: none; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          font-size: 9px; letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(250,248,245,0.55); font-weight: 500;
          transition: color 0.25s; font-family: 'Outfit', sans-serif;
          padding: 0;
        }
        .back-btn:hover { color: var(--gold); }
        .back-btn .arrow { transition: transform 0.25s; }
        .back-btn:hover .arrow { transform: translateX(-3px); }

        /* FEATURE TAGS */
        .feature-tag {
          display: inline-flex; align-items: center; gap: 6px;
          background: #F6F4F0; border: 1px solid #ece8e2;
          border-radius: 8px; padding: 8px 14px;
          font-size: 11px; color: #5a5450; font-weight: 500;
        }

        /* VENDOR AVATAR */
        .vendor-avatar {
          width: 56px; height: 56px; border-radius: 14px;
          background: linear-gradient(135deg, #C9A96E22, #C9A96E55);
          border: 1.5px solid rgba(201,169,110,0.3);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Cormorant', serif; font-size: 26px;
          color: var(--gold); font-weight: 500;
        }

        /* SUCCESS TOAST */
        .toast {
          position: fixed; bottom: 40px; left: 50%; transform: translateX(-50%);
          background: #1A1714; border: 1px solid rgba(201,169,110,0.25);
          border-radius: 12px; padding: 16px 28px; z-index: 9999;
          display: flex; align-items: center; gap: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
          animation: fadeUp 0.35s ease both;
        }
      `}</style>

      {/* ══ LIGHTBOX ══ */}
      {lightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <button onClick={() => setLightboxOpen(false)} style={{
            position: "fixed", top: 28, right: 36,
            background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", width: 44, height: 44, borderRadius: "50%",
            cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>

          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => Math.max(0, i - 1)); }}
            style={{ position: "fixed", left: 32, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>

          <img
            src={getFullImageUrl(galleryImages[lightboxIdx])}
            className="lightbox-img"
            alt="Full view"
            onClick={e => e.stopPropagation()}
          />

          <button onClick={(e) => { e.stopPropagation(); setLightboxIdx(i => Math.min(galleryImages.length - 1, i + 1)); }}
            style={{ position: "fixed", right: 32, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", width: 48, height: 48, borderRadius: "50%", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>

          <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.18em" }}>
            {lightboxIdx + 1} / {galleryImages.length}
          </div>
        </div>
      )}

      {/* ══ SUCCESS TOAST ══ */}
      {submitted && (
        <div className="toast">
          <span style={{ fontSize: 16, color: "#7ab87a" }}>✓</span>
          <span style={{ fontSize: 12, color: "#e0dbd5", letterSpacing: "0.04em" }}>Your impression has been shared. Thank you.</span>
        </div>
      )}

      {/* ══ NAVIGATION ══ */}
      <nav className={`nav-glass${scrolled ? " scrolled" : ""}`} style={{
        position: "fixed", top: 0, left: 0, width: "100%", zIndex: 1000,
        padding: "0 64px", height: 72,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <span className="arrow">←</span> Collection
        </button>

        <div style={{
          fontFamily: "'Cormorant', serif",
          fontSize: 22, fontWeight: 500, letterSpacing: "0.12em",
          color: "#FAF8F5",
        }}>
          LOVARA
        </div>

        <div style={{ display: "flex", gap: 36 }}>
          {["Story", "Gallery", "Reviews"].map(s => (
            <a key={s} href={`#${s.toLowerCase()}`} className="nav-link-item">{s}</a>
          ))}
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <div ref={heroRef} style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
        <div ref={parallaxRef} style={{ position: "absolute", inset: "-15%", zIndex: 0 }}>
          <img
            src={heroImage}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", animation: "scaleIn 2s cubic-bezier(0.16,1,0.3,1) both" }}
            alt={work.title}
          />
        </div>

        {/* Layered overlays for depth */}
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(135deg, rgba(14,12,10,0.7) 0%, rgba(14,12,10,0.1) 60%, transparent 100%)" }} />
        <div style={{ position: "absolute", inset: 0, zIndex: 1, background: "linear-gradient(to top, rgba(14,12,10,0.95) 0%, rgba(14,12,10,0.3) 40%, transparent 70%)" }} />

        {/* Grain texture overlay */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 2, opacity: 0.035,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }} />

        {/* Hero content */}
        <div style={{ position: "absolute", inset: 0, zIndex: 3, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 10% 80px" }}>

          <div style={{ animation: "fadeUp 1.1s cubic-bezier(0.16,1,0.3,1) 0.2s both" }}>
            <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(201,169,110,0.12)", border: "1px solid rgba(201,169,110,0.25)",
                borderRadius: 24, padding: "6px 16px",
              }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#C9A96E" }} />
                <span style={{ fontSize: 9, color: "#C9A96E", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: 600 }}>
                  {work.tags || "Exclusive Feature"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.07)", borderRadius: 24, padding: "6px 14px", backdropFilter: "blur(8px)" }}>
                <span style={{ color: "#C9A96E", fontSize: 11 }}>★</span>
                <span style={{ fontSize: 11, color: "rgba(250,248,245,0.85)", fontWeight: 500 }}>{avgRating}</span>
                <span style={{ fontSize: 10, color: "rgba(250,248,245,0.35)" }}>({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 style={{
              fontFamily: "'Cormorant', serif",
              fontSize: "clamp(3rem, 6vw, 6rem)",
              color: "#FAF8F5", fontWeight: 400, lineHeight: 1.0,
              marginBottom: 24, letterSpacing: "-0.01em",
              textShadow: "0 4px 40px rgba(0,0,0,0.3)",
            }}>
              {work.title}
            </h1>

            <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 48 }}>
              <div style={{ width: 48, height: 1, background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
              <span style={{ fontSize: 13, color: "rgba(250,248,245,0.55)", letterSpacing: "0.06em" }}>
                Crafted by <span 
                  onClick={() => navigate("/user", { state: { activeTab: "Artisans" } })}
                  style={{ color: "rgba(250,248,245,0.9)", fontWeight: 500, cursor: "pointer", borderBottom: "1px solid rgba(250,248,245,0.2)" }}
                >
                  {work.vendor_name || "Lovara Elite"}
                </span>
              </span>
            </div>

            {/* Thumbnail strip */}
            {galleryImages.length > 1 && (
              <div style={{ display: "flex", gap: 10, animationName: "fadeUp", animationDuration: "1s", animationTimingFunction: "ease", animationDelay: "0.5s", animationFillMode: "both" }}>
                {galleryImages.slice(0, 6).map((img, i) => (
                  <div
                    key={i}
                    className={`thumb-item${activeImage === i ? " active" : ""}`}
                    style={{ width: 64, height: 44 }}
                    onClick={() => { setActiveImage(i); setLightboxIdx(i); setLightboxOpen(true); }}
                  >
                    <img 
                      src={img?.image_url || "/placeholder.jpg"} 
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                      alt="" 
                    />
                  </div>
                ))}
                {galleryImages.length > 6 && (
                  <div style={{
                    width: 64, height: 44, borderRadius: 4, background: "rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "rgba(255,255,255,0.5)", cursor: "pointer",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}>+{galleryImages.length - 6}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)",
          zIndex: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animationName: "fadeIn", animationDuration: "1.5s", animationTimingFunction: "ease", animationDelay: "1.2s", animationFillMode: "both", opacity: scrolled ? 0 : 1, transition: "opacity 0.4s",
        }}>
          <span style={{ fontSize: 8, color: "rgba(250,248,245,0.3)", letterSpacing: "0.3em", textTransform: "uppercase" }}>Scroll</span>
          <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(201,169,110,0.6), transparent)" }} />
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "100px 64px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 80, alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div>

            {/* STORY */}
            <section id="story" style={{ marginBottom: 96 }}>
              <div className="section-eyebrow" style={{ marginBottom: 28 }}>The Narrative</div>
              <p style={{
                fontFamily: "'Cormorant', serif",
                fontSize: "clamp(1.4rem, 2.2vw, 1.9rem)",
                color: "#1a1714", lineHeight: 1.65, fontWeight: 400,
                animationName: "fadeUp", animationDuration: "0.8s", animationTimingFunction: "ease", animationDelay: "0.1s", animationFillMode: "both",
              }}>
                {work.description}
              </p>
              <div style={{ marginTop: 48, display: "flex", flexWrap: "wrap", gap: 10, animationName: "fadeUp", animationDuration: "0.8s", animationTimingFunction: "ease", animationDelay: "0.2s", animationFillMode: "both" }}>
                {["Luxury Execution", "Artisan Craftsmanship", "Bespoke Design", "Premium Venues"].map((tag, i) => (
                  <span key={i} className="feature-tag">
                    <span style={{ color: "#C9A96E", fontSize: 10 }}>◈</span> {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* STATS BAND */}
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              background: "#1A1714", borderRadius: 16, overflow: "hidden",
              marginBottom: 96, animationName: "fadeUp", animationDuration: "0.8s", animationTimingFunction: "ease", animationDelay: "0.2s", animationFillMode: "both",
            }}>
              {[
                { value: `${galleryImages.length}+`, label: "Portfolio Shots" },
                { value: avgRating, label: "Client Rating" },
                { value: `${reviews.length}`, label: "Verified Reviews" },
              ].map((s, i) => (
                <div key={i} style={{
                  padding: "36px 32px", textAlign: "center",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  <div style={{
                    fontFamily: "'Cormorant', serif", fontSize: 42, color: "#C9A96E",
                    fontWeight: 400, lineHeight: 1, marginBottom: 8,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#4a4540", letterSpacing: "0.22em", textTransform: "uppercase" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* GALLERY */}
            <section id="gallery" style={{ marginBottom: 96 }}>
              <div className="section-eyebrow" style={{ marginBottom: 36 }}>Visual Journal</div>

              {galleryImages.length === 0 ? (
                <div style={{ padding: "80px", textAlign: "center", border: "1px dashed #d8d4ce", borderRadius: 12, color: "#bbb" }}>
                  <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.3 }}>◻</div>
                  Gallery visuals are being processed.
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 14 }}>
                  {galleryImages.map((img, i) => {
                    // Varied grid layout
                    const patterns = [
                      { col: "span 7", row: "span 1", h: 440 },
                      { col: "span 5", row: "span 1", h: 440 },
                      { col: "span 4", row: "span 1", h: 320 },
                      { col: "span 4", row: "span 1", h: 320 },
                      { col: "span 4", row: "span 1", h: 320 },
                      { col: "span 5", row: "span 1", h: 380 },
                      { col: "span 7", row: "span 1", h: 380 },
                    ];
                    const p = patterns[i % patterns.length];
                    return (
                      <div
                        key={i}
                        className="gallery-cell"
                        style={{ gridColumn: p.col, height: p.h, animation: `fadeUp 0.7s ease ${i * 0.08}s both` }}
                        onClick={() => { setLightboxIdx(i); setLightboxOpen(true); }}
                      >
                        <img 
                          src={img?.image_url || "/placeholder.jpg"} 
                          alt={`${work.title} — ${i + 1}`} 
                        />
                        <div className="overlay">
                          <span className="zoom-icon">⊕</span>
                        </div>
                        <div style={{
                          position: "absolute", bottom: 14, right: 14,
                          background: "rgba(14,12,10,0.65)", backdropFilter: "blur(6px)",
                          borderRadius: 6, padding: "4px 10px",
                          fontSize: 9, color: "rgba(250,248,245,0.6)", letterSpacing: "0.1em",
                          opacity: 0, transition: "opacity 0.3s",
                        }} data-caption={`0${i + 1}`} />
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* REVIEWS LIST */}
            <section id="reviews" style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 36 }}>
                <div className="section-eyebrow">Acclaim & Impressions</div>
                <div style={{
                  fontFamily: "'Cormorant', serif", fontSize: 15,
                  color: "#9a9490", fontStyle: "italic",
                }}>{reviews.length} impression{reviews.length !== 1 ? "s" : ""} shared</div>
              </div>

              {reviews.length === 0 ? (
                <div className="card-premium" style={{ padding: "60px", textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cormorant', serif", fontSize: 22, color: "#bbb", fontStyle: "italic", marginBottom: 8 }}>No reflections shared yet.</div>
                  <div style={{ fontSize: 12, color: "#ccc" }}>Be the first to share your perspective below.</div>
                </div>
              ) : (
                <div style={{ display: "grid", gap: 16 }}>
                  {reviews.map((r, i) => (
                    <div key={i} className="review-card" style={{ animationDelay: `${i * 0.1}s` }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                          background: `hsl(${i * 70 + 25}, 28%, 90%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 18, fontWeight: 600, color: `hsl(${i * 70 + 25}, 35%, 42%)`,
                          fontFamily: "'Cormorant', serif",
                        }}>{(r.user_name || "E")[0]}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, color: "#1a1714", fontWeight: 600, marginBottom: 2 }}>
                            {r.user_name || "Esteemed Client"}
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 12, color: "#C9A96E", letterSpacing: "0.06em" }}>{"★".repeat(r.rating || 5)}</span>
                            <span style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.06em", textTransform: "uppercase" }}>Verified Experience</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 10, color: "#ccc", fontFamily: "'DM Mono', monospace", letterSpacing: "0.04em", flexShrink: 0 }}>
                          {r.created_at ? new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "2025"}
                        </div>
                      </div>
                      <div style={{
                        fontFamily: "'Cormorant', serif",
                        fontSize: 17, color: "#5a5450",
                        lineHeight: 1.75, fontStyle: "italic",
                        borderLeft: "2px solid #f0ece6", paddingLeft: 20, marginLeft: 0,
                      }}>
                        "{r.comment || r.text}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* LEAVE REVIEW */}
            <div style={{
              background: "linear-gradient(135deg, #1A1714 0%, #201D1A 100%)",
              borderRadius: 20, padding: "52px",
              border: "1px solid rgba(201,169,110,0.1)",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
                <div>
                  <div style={{ fontSize: 9, color: "#C9A96E", letterSpacing: "0.3em", textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Your Turn</div>
                  <h4 style={{ fontFamily: "'Cormorant', serif", fontSize: 30, color: "#FAF8F5", fontWeight: 400, marginBottom: 6 }}>
                    Share Your Perspective
                  </h4>
                  <p style={{ fontSize: 12, color: "rgba(250,248,245,0.35)", letterSpacing: "0.03em" }}>
                    Your insights help maintain our standard of excellence.
                  </p>
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: "rgba(201,169,110,0.1)", border: "1px solid rgba(201,169,110,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, color: "#C9A96E",
                }}>◇</div>
              </div>

              <form onSubmit={handleReviewSubmit}>
                {/* Star rating */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>Your Rating</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        className="star-btn"
                        onMouseEnter={() => setHoverStar(s)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setNewReview({ ...newReview, rating: s })}
                        style={{ color: s <= (hoverStar || newReview.rating) ? "#C9A96E" : "rgba(255,255,255,0.1)" }}
                      >★</button>
                    ))}
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 8, alignSelf: "center", letterSpacing: "0.06em" }}>
                      {["", "Poor", "Fair", "Good", "Great", "Exceptional"][hoverStar || newReview.rating]}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 14 }}>Your Impression</div>
                  <textarea
                    className="review-textarea"
                    required
                    value={newReview.text}
                    onChange={e => setNewReview({ ...newReview, text: e.target.value })}
                    placeholder="Describe your experience with this vendor — what made it remarkable..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-cta btn-cta-gold"
                  style={{ opacity: submitting ? 0.7 : 1, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? (
                    <>
                      <div style={{ width: 14, height: 14, border: "2px solid rgba(26,23,20,0.2)", borderTopColor: "#1A1714", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                      Submitting...
                    </>
                  ) : "Post Impression →"}
                </button>
              </form>
            </div>

          </div>

          {/* ══ SIDEBAR ══ */}
          <aside style={{ position: "sticky", top: 100 }}>
            <div className="sidebar-card" style={{ marginBottom: 20 }}>
              {/* Vendor info */}
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28, paddingBottom: 28, borderBottom: "1px solid #f0ece6" }}>
                <div className="vendor-avatar">{(work.vendor_name || "A")[0]}</div>
                <div>
                  <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Your Design Partner</div>
                  <div style={{ fontFamily: "'Cormorant', serif", fontSize: 22, color: "#1a1714", fontWeight: 500 }}>
                    {work.vendor_name || "Atelier Collective"}
                  </div>
                </div>
              </div>

              {/* Rating display */}
              <div style={{
                background: "#F6F4F0", borderRadius: 12, padding: "20px 24px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 28,
              }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant', serif", fontSize: 38, color: "#1a1714", fontWeight: 400, lineHeight: 1 }}>{avgRating}</div>
                  <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", textTransform: "uppercase", marginTop: 4 }}>Average Rating</div>
                </div>
                <div>
                  <div style={{ fontSize: 20, color: "#C9A96E", letterSpacing: "0.1em", marginBottom: 4 }}>★★★★★</div>
                  <div style={{ fontSize: 10, color: "#bbb", textAlign: "right" }}>{reviews.length} reviews</div>
                </div>
              </div>

              {/* Pricing / Availability */}
              <div style={{ marginBottom: 32 }}>
                {[
                  { label: "Starting Package", val: "₹2.5L", valColor: "#C9A96E" },
                  { label: "Availability", val: "Limited 2025 Slots", valColor: "#7ab87a" },
                  { label: "Location", val: "Pan-India · Destination", valColor: "#1a1714" },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 0",
                    borderBottom: i < 2 ? "1px solid #f5f2ef" : "none",
                  }}>
                    <span style={{ fontSize: 12, color: "#9a9490", fontWeight: 400 }}>{item.label}</span>
                    <span style={{ fontSize: 13, color: item.valColor, fontWeight: 600 }}>{item.val}</span>
                  </div>
                ))}
              </div>

              {/* Date Selection */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Preferred Event Date</div>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{ 
                    width: "100%", padding: "12px 16px", borderRadius: 8, 
                    border: "1px solid #f0ece6", backgroundColor: "#fff",
                    fontFamily: "'Outfit', sans-serif", fontSize: 13, color: "#1a1714",
                    outline: "none", transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#C9A96E"}
                  onBlur={(e) => e.target.style.borderColor = "#f0ece6"}
                />
              </div>

              {/* Weather Info Display */}
              {bookingWeather && (
                <div style={{ 
                  marginBottom: 28, padding: "24px", borderRadius: 20, 
                  background: "#FDFBF8", border: "1px solid rgba(201,169,110,0.18)",
                  animation: "fadeIn 0.6s ease",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.03)"
                }}>
                  <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 700, marginBottom: 18 }}>Weather Intel</div>
                  
                  {bookingWeather?.temperature != null && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ 
                        fontFamily: "'Cormorant', serif", fontSize: 44, color: "#1a1714", 
                        fontWeight: 300, lineHeight: 1 
                      }}>
                        {bookingWeather.temperature}°C
                      </div>
                    </div>
                  )}
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: bookingWeather.is_bad_weather ? 20 : 0 }}>
                    <span style={{ fontSize: 22 }}>
                      {bookingWeather.condition?.toLowerCase().includes("rain") ? "🌧️" : 
                       bookingWeather.condition?.toLowerCase().includes("cloud") ? "☁️" : "☀️"}
                    </span>
                    <div style={{ 
                      fontSize: 13, color: "#8a8480", fontWeight: 500, 
                      letterSpacing: "0.02em" 
                    }}>
                      {bookingWeather?.condition?.replace(/\b\w/g, c => c.toUpperCase()) || "Clear Sky"}
                    </div>
                  </div>

                  {bookingWeather.is_bad_weather && (
                    <div style={{ 
                      padding: "12px 16px", background: "rgba(201,112,90,0.06)", 
                      borderRadius: 12, border: "1px solid rgba(201,112,90,0.15)",
                      display: "flex", alignItems: "center", gap: 10
                    }}>
                      <span style={{ fontSize: 16 }}>⚠️</span>
                      <span style={{ fontSize: 11, color: "#c9705a", fontWeight: 600, lineHeight: 1.4 }}>
                        Service may be affected due to weather
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* AI/ML Weather Prediction & Intelligence */}
              {bookingWeather && (
                <div style={{ marginBottom: 32 }}>
                  <AIWeatherIntelligence weatherData={bookingWeather} />
                </div>
              )}

              {/* AI Recommendation Intelligence */}
              <AIRecommendation 
                workId={id} 
                selectedDate={selectedDate} 
                weather={bookingWeather?.condition}
              />

              {/* CTAs */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <button
                  className="btn-cta btn-cta-gold"
                  onClick={handleSecureBooking}
                  disabled={bookingLoading}
                  style={{ opacity: bookingLoading ? 0.7 : 1, cursor: bookingLoading ? "not-allowed" : "pointer" }}
                >
                  {bookingLoading ? "Securing..." : "Secure This Team"}
                </button>
                <button
                  className="btn-cta btn-ghost-dark"
                  onClick={handleEnquire}
                  disabled={inquireLoading}
                  style={{ 
                    border: "1.5px solid #e8e4de", 
                    color: "#5a5450", 
                    background: "transparent",
                    opacity: inquireLoading ? 0.7 : 1,
                    cursor: inquireLoading ? "not-allowed" : "pointer"
                  }}
                >
                  {inquireLoading ? "Connecting..." : "Message Vendor"}
                </button>
              </div>


              <div style={{ textAlign: "center", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7ab87a", animation: "glow 2s ease infinite" }} />
                <span style={{ fontSize: 11, color: "#9a9490" }}>Concierge response &lt; 2 hrs</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="card-premium" style={{ padding: "24px" }}>
              <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 16, textAlign: "center" }}>Why Lovara</div>
              {[
                { icon: "◈", label: "Curated Vendors Only", sub: "Every partner handpicked" },
                { icon: "◎", label: "Secure Booking", sub: "Fully encrypted & protected" },
                { icon: "◇", label: "5-Star Guarantee", sub: "Excellence or your money back" },
              ].map((t, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "12px 0", borderBottom: i < 2 ? "1px solid #f5f2ef" : "none",
                }}>
                  <div style={{ fontSize: 16, color: "#C9A96E", flexShrink: 0, width: 24, textAlign: "center" }}>{t.icon}</div>
                  <div>
                    <div style={{ fontSize: 12, color: "#1a1714", fontWeight: 500, marginBottom: 1 }}>{t.label}</div>
                    <div style={{ fontSize: 10, color: "#bbb" }}>{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

        </div>
      </div>

      {/* ══ FOOTER ══ */}
      <footer style={{ background: "#0E0C0A", padding: "80px 10% 60px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            fontFamily: "'Cormorant', serif",
            fontSize: 48, color: "#C9A96E", letterSpacing: "0.18em", fontWeight: 300,
            marginBottom: 20,
          }}>LOVARA</div>
          <div className="ornament-divider" style={{ maxWidth: 360, margin: "0 auto 20px" }}>
            <span style={{ fontSize: 10, color: "#4a4540", letterSpacing: "0.3em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              The Gold Standard of Event Curation
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 36, marginTop: 40, marginBottom: 60 }}>
            <button onClick={() => navigate("/user", { state: { activeTab: "Discover" } })} style={{ fontSize: 9, color: "#3a3530", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.22em", textTransform: "uppercase", transition: "color 0.2s" }}>Collection</button>
            <button onClick={() => navigate("/user", { state: { activeTab: "Artisans" } })} style={{ fontSize: 9, color: "#3a3530", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.22em", textTransform: "uppercase", transition: "color 0.2s" }}>Vendors</button>
            <a href="#" style={{ fontSize: 9, color: "#3a3530", textDecoration: "none", letterSpacing: "0.22em", textTransform: "uppercase" }}>Pricing</a>
            <a href="#" style={{ fontSize: 9, color: "#3a3530", textDecoration: "none", letterSpacing: "0.22em", textTransform: "uppercase" }}>Contact</a>
          </div>
          <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #2a2522, transparent)", marginBottom: 40 }} />
          <p style={{ fontSize: 10, color: "#2a2522", letterSpacing: "0.1em" }}>
            © 2025 Lovara Luxury Marketplace. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}