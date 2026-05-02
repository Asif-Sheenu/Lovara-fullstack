import React, { useState, useRef, useEffect } from 'react';
import { generalService } from '../../services/api';
import Navbar from '../../components/layout/Navbar';
import Sidebar from '../../components/layout/sidebar';

/* ─── Google Fonts ─────────────────────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
  `}</style>
);

/* ─── Category tag colours ──────────────────────────────────────────────────── */
const TAG_STYLES = {
  Venue:        { bg: '#FDF0E0', color: '#96580A' },
  Photographer: { bg: '#EDF4F0', color: '#2A6B4A' },
  Florist:      { bg: '#F5EDF7', color: '#7B3E9D' },
  Videographer: { bg: '#EBF2FA', color: '#1D5F9E' },
  Caterer:      { bg: '#FFF0ED', color: '#C04A2A' },
  Planner:      { bg: '#F0F0F0', color: '#555555' },
};
const tagStyle = (tag) =>
  TAG_STYLES[tag] || { bg: '#F5F0E8', color: '#8B6B3D' };

/* ─── Suggestion chips ──────────────────────────────────────────────────────── */
const CHIPS = [
  'Beachfront venues in Amalfi',
  'Best destination photographers',
  'Luxury floral designers',
  'All-inclusive packages',
];

/* ─── Icons (inline SVG) ────────────────────────────────────────────────────── */
const SendIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);
const SpinnerIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
    <path d="M12 2a10 10 0 1 0 10 10" opacity="0.3"/>
    <path d="M12 2a10 10 0 0 1 10 10">
      <animateTransform attributeName="transform" type="rotate"
        from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
    </path>
  </svg>
);
const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
);
const WandIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
    stroke="#C9963E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 4V2M15 16v-2M8 9h2M20 9h2M17.8 6.2l1.4-1.4M12.2 6.2 10.8 4.8M17.8 11.8l1.4 1.4M12.2 11.8l-1.4 1.4"/>
    <path d="m2 22 10-10"/>
    <path d="m16.5 7.5-5 5"/>
  </svg>
);

/* ─── Styles (scoped via className prefix) ───────────────────────────────────── */
const css = `
.ai-search-root {
  --gold:        #C9963E;
  --gold-dark:   #A07830;
  --gold-light:  #F5E6C8;
  --gold-pale:   #FDF8F0;
  --cream:       #FAF7F2;
  --ink:         #1C1814;
  --ink-muted:   #6B5E50;
  --ink-faint:   #A89C8C;
  --border:      rgba(180,148,100,0.18);
  --border-soft: rgba(180,148,100,0.10);
  --white:       #FFFFFF;
  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   16px;
  --radius-xl:   22px;
  --font-display: 'Cormorant Garamond', Georgia, serif;
  --font-body:    'Jost', sans-serif;
  font-family: var(--font-body);
  color: var(--ink);
  background: var(--cream);
}

/* ── Layout ── */
.ais-layout   { display:flex; height:100vh; overflow:hidden; }
.ais-content  { margin-left:256px; flex:1; display:flex; flex-direction:column; overflow:hidden; }
.ais-main     { flex:1; overflow-y:auto; display:flex; flex-direction:column; }

/* ── Decorative bg ── */
.ais-bg {
  position:fixed; inset:0; pointer-events:none; z-index:0;
}
.ais-bg-orb1 {
  position:absolute; top:-120px; right:-80px;
  width:480px; height:480px; border-radius:50%;
  background: radial-gradient(circle, rgba(201,150,62,0.07) 0%, transparent 70%);
}
.ais-bg-orb2 {
  position:absolute; bottom:-100px; left:20%;
  width:360px; height:360px; border-radius:50%;
  background: radial-gradient(circle, rgba(201,150,62,0.05) 0%, transparent 70%);
}
.ais-bg-pattern {
  position:absolute; inset:0; opacity:0.018;
  background-image: repeating-linear-gradient(
    45deg, #8B6B3D 0px, #8B6B3D 1px, transparent 1px, transparent 28px
  );
}

/* ── Inner wrapper ── */
.ais-inner {
  position:relative; z-index:1; flex:1;
  display:flex; flex-direction:column;
  align-items:center; padding:40px 24px 32px;
  max-width:900px; margin:0 auto; width:100%;
}

/* ── Hero ── */
.ais-hero { text-align:center; margin-bottom:40px; }
.ais-hero-icon {
  width:56px; height:56px; border-radius:14px;
  background:var(--gold-light); display:inline-flex;
  align-items:center; justify-content:center;
  margin-bottom:18px;
  box-shadow: 0 2px 16px rgba(201,150,62,0.15);
}
.ais-hero-eyebrow {
  font-size:10px; letter-spacing:0.18em; text-transform:uppercase;
  color:var(--gold); font-weight:500; margin-bottom:10px;
}
.ais-hero-title {
  font-family:var(--font-display); font-size:clamp(34px,5vw,50px);
  font-weight:400; line-height:1.15; color:var(--ink);
  margin-bottom:12px; letter-spacing:0.01em;
}
.ais-hero-title em { font-style:italic; color:var(--gold); }
.ais-hero-sub {
  font-size:14px; color:var(--ink-muted); max-width:400px;
  margin:0 auto; line-height:1.7; font-weight:300;
}

/* ── Search box ── */
.ais-search-wrap { width:100%; max-width:640px; margin-bottom:14px; }
.ais-search-box {
  display:flex; align-items:center; gap:8px;
  background:var(--white); border:1px solid var(--border);
  border-radius:var(--radius-xl); padding:7px 7px 7px 20px;
  transition:border-color .2s, box-shadow .2s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.ais-search-box:focus-within {
  border-color:var(--gold);
  box-shadow: 0 0 0 3px rgba(201,150,62,0.12), 0 2px 12px rgba(0,0,0,0.06);
}
.ais-search-input {
  flex:1; border:none; background:transparent;
  font-family:var(--font-body); font-size:14px;
  color:var(--ink); outline:none; font-weight:300;
}
.ais-search-input::placeholder { color:var(--ink-faint); }
.ais-send-btn {
  width:38px; height:38px; border-radius:12px;
  background:var(--gold); border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#fff; transition:background .15s, transform .1s;
  flex-shrink:0;
}
.ais-send-btn:hover:not(:disabled) { background:var(--gold-dark); transform:scale(1.04); }
.ais-send-btn:active:not(:disabled) { transform:scale(0.97); }
.ais-send-btn:disabled { background:#D4C8B8; cursor:default; }

/* ── Chips ── */
.ais-chips { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; }
.ais-chip {
  padding:5px 15px; border-radius:20px;
  border:1px solid var(--border); font-size:12px;
  color:var(--ink-muted); cursor:pointer;
  background:var(--white); font-family:var(--font-body); font-weight:400;
  transition:all .15s; letter-spacing:0.01em;
}
.ais-chip:hover { border-color:var(--gold); color:var(--gold-dark); background:var(--gold-pale); }

/* ── Messages ── */
.ais-messages { width:100%; max-width:760px; display:flex; flex-direction:column; gap:22px; }

/* user bubble */
.ais-user-msg {
  align-self:flex-end; max-width:72%;
  background:var(--white); border:1px solid var(--border);
  border-radius:18px 18px 4px 18px;
  padding:13px 18px; font-size:14px; line-height:1.65;
  color:var(--ink); font-weight:300;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
  animation: ais-fadeup .35s ease both;
}

/* assistant block */
.ais-ai-block { width:100%; animation: ais-fadeup .4s ease both; }
.ais-ai-header { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
.ais-ai-avatar {
  width:30px; height:30px; border-radius:8px;
  background:var(--gold-light); display:flex;
  align-items:center; justify-content:center; flex-shrink:0;
}
.ais-ai-label { font-size:12px; font-weight:500; color:var(--ink); }
.ais-ai-count { font-size:11px; color:var(--ink-faint); margin-top:1px; }

/* result grid */
.ais-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(280px,1fr)); gap:12px; }
.ais-card {
  background:var(--white); border:1px solid var(--border);
  border-radius:var(--radius-lg); padding:20px;
  cursor:pointer; position:relative; overflow:hidden;
  transition:border-color .2s, box-shadow .2s, transform .18s;
  box-shadow:0 2px 8px rgba(0,0,0,0.04);
}
.ais-card:hover {
  border-color:var(--gold);
  box-shadow:0 6px 24px rgba(201,150,62,0.12);
  transform:translateY(-2px);
}
.ais-card::before {
  content:''; position:absolute; left:0; top:0; bottom:0;
  width:3px; background:var(--gold-light);
  transition:background .2s;
}
.ais-card:hover::before { background:var(--gold); }
.ais-card-tag {
  display:inline-block; font-size:10px; font-weight:500;
  letter-spacing:0.1em; text-transform:uppercase;
  border-radius:4px; padding:3px 9px; margin-bottom:10px;
}
.ais-card-title {
  font-family:var(--font-display); font-size:18px; font-weight:500;
  color:var(--ink); margin-bottom:6px; line-height:1.25;
  transition:color .15s;
}
.ais-card:hover .ais-card-title { color:var(--gold-dark); }
.ais-card-desc {
  font-size:12.5px; color:var(--ink-muted); line-height:1.7;
  display:-webkit-box; -webkit-line-clamp:3;
  -webkit-box-orient:vertical; overflow:hidden;
  font-weight:300;
}
.ais-card-footer {
  margin-top:16px; display:flex;
  align-items:center; justify-content:space-between;
}
.ais-card-cta {
  font-size:11px; letter-spacing:0.1em; text-transform:uppercase;
  color:var(--ink-faint); font-weight:500;
  transition:color .15s;
}
.ais-card:hover .ais-card-cta { color:var(--gold); }
.ais-card-arrow {
  color:var(--ink-faint); transition:color .15s, transform .2s;
  display:flex;
}
.ais-card:hover .ais-card-arrow { color:var(--gold); transform:translateX(3px); }

/* empty */
.ais-empty {
  background:var(--white); border:1px solid var(--border);
  border-radius:var(--radius-lg); padding:32px; text-align:center;
  color:var(--ink-muted); font-size:13px; font-weight:300;
  font-style:italic; width:100%;
}

/* loading */
.ais-loading {
  display:flex; align-items:center; gap:12px;
  background:var(--white); border:1px solid var(--border);
  border-radius:var(--radius-lg); padding:14px 18px;
  width:fit-content;
}
.ais-dot {
  width:7px; height:7px; border-radius:50%;
  background:var(--gold); animation:ais-bounce 1.1s infinite;
}
.ais-dot:nth-child(2) { animation-delay:0.18s; }
.ais-dot:nth-child(3) { animation-delay:0.36s; }
.ais-loading-txt {
  font-size:11px; letter-spacing:0.12em; text-transform:uppercase;
  color:var(--ink-faint); font-weight:500;
}

/* error */
.ais-error {
  background:#FFF4F4; border:1px solid #F5C5C5;
  color:#C03030; font-size:12px;
  padding:10px 16px; border-radius:8px; font-weight:400;
}

/* bottom search area when messages visible */
.ais-bottom-bar {
  position:sticky; bottom:0; z-index:10;
  background: linear-gradient(to top, var(--cream) 70%, transparent);
  padding:16px 24px 28px;
  display:flex; flex-direction:column; align-items:center; gap:12px;
  width:100%;
}

/* divider line */
.ais-divider {
  width:40px; height:1px; background:var(--border);
  margin:8px auto 0;
}

/* animations */
@keyframes ais-fadeup {
  from { opacity:0; transform:translateY(12px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes ais-bounce {
  0%,60%,100% { transform:translateY(0); opacity:.5; }
  30%         { transform:translateY(-5px); opacity:1; }
}

/* scrollbar */
.ais-main::-webkit-scrollbar { width:6px; }
.ais-main::-webkit-scrollbar-track { background:transparent; }
.ais-main::-webkit-scrollbar-thumb {
  background:rgba(180,148,100,0.25); border-radius:4px;
}
`;

/* ─── Main Component ─────────────────────────────────────────────────────────── */
const AISearch = () => {
  const [query, setQuery]       = useState('');
  const [isLoading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError]       = useState(null);
  const scrollRef               = useRef(null);
  const inputRef                = useRef(null);

  /* auto-scroll */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  /* focus input on mount */
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSearch = async (searchQuery) => {
    const q = (searchQuery ?? query).trim();
    if (!q || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setQuery('');
    setLoading(true);
    setError(null);

    try {
      const response = await generalService.aiSearch(q);
      const data = Array.isArray(response.data) ? response.data : [];
      setMessages(prev => [...prev, { role: 'assistant', content: data }]);
    } catch (err) {
      console.error('AI Search Error:', err);
      setError('Our AI concierge is momentarily unavailable. Please try again shortly.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="ai-search-root ais-layout">
      <FontLoader />
      <style>{css}</style>

      {/* Sidebar & Navbar (unchanged from your project) */}
      <Sidebar activeLabel="AI Search" />
      <div className="ais-content">
        <Navbar activeLabel="AI Search" />

        {/* Decorative background */}
        <div className="ais-bg" aria-hidden="true">
          <div className="ais-bg-pattern" />
          <div className="ais-bg-orb1" />
          <div className="ais-bg-orb2" />
        </div>

        {/* Scrollable main area */}
        <main className="ais-main" ref={scrollRef}>
          <div className="ais-inner">

            {/* ── Hero (hidden once messages appear) ── */}
            {!hasMessages && (
              <div className="ais-hero">
                <div className="ais-hero-icon"><WandIcon /></div>
                <p className="ais-hero-eyebrow">AI-powered discovery</p>
                <h1 className="ais-hero-title">
                  Find your <em>perfect</em><br />wedding vendors
                </h1>
                <p className="ais-hero-sub">
                  Describe what you're looking for — venues, photographers,
                  florists, planners — and our AI will surface the best matches
                  for your destination wedding.
                </p>
                <div className="ais-divider" />
              </div>
            )}

            {/* ── Message thread ── */}
            {hasMessages && (
              <div className="ais-messages">
                {messages.map((msg, idx) => (
                  <React.Fragment key={idx}>

                    {/* User bubble */}
                    {msg.role === 'user' && (
                      <div className="ais-user-msg">{msg.content}</div>
                    )}

                    {/* Assistant results */}
                    {msg.role === 'assistant' && (
                      <div className="ais-ai-block">
                        <div className="ais-ai-header">
                          <div className="ais-ai-avatar"><WandIcon /></div>
                          <div>
                            <div className="ais-ai-label">AI Concierge results</div>
                            <div className="ais-ai-count">
                              {msg.content.length > 0
                                ? `${msg.content.length} curated matches found`
                                : 'No matches found'}
                            </div>
                          </div>
                        </div>

                        {msg.content.length > 0 ? (
                          <div className="ais-grid">
                            {msg.content.map((item, i) => {
                              const ts = tagStyle(item.tag || item.category || '');
                              return (
                                <div
                                  key={i}
                                  className="ais-card"
                                  onClick={() => console.log('View:', item.title)}
                                  style={{ animationDelay: `${i * 60}ms` }}
                                >
                                  {(item.tag || item.category) && (
                                    <span
                                      className="ais-card-tag"
                                      style={{ background: ts.bg, color: ts.color }}
                                    >
                                      {item.tag || item.category}
                                    </span>
                                  )}
                                  <div className="ais-card-title">{item.title}</div>
                                  <p className="ais-card-desc">{item.description}</p>
                                  <div className="ais-card-footer">
                                    <span className="ais-card-cta">View profile</span>
                                    <span className="ais-card-arrow"><ArrowIcon /></span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="ais-empty">
                            No precise matches found — try broadening your search.
                          </div>
                        )}
                      </div>
                    )}
                  </React.Fragment>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="ais-loading">
                    <div className="ais-dot" />
                    <div className="ais-dot" />
                    <div className="ais-dot" />
                    <span className="ais-loading-txt">Searching curated vendors…</span>
                  </div>
                )}

                {/* Error */}
                {error && <div className="ais-error">⚠ {error}</div>}
              </div>
            )}

            {/* ── Search input (inline when no messages, sticky bar when messages exist) ── */}
            {!hasMessages && (
              <div className="ais-search-wrap" style={{ marginTop: 32 }}>
                <SearchBox
                  query={query}
                  setQuery={setQuery}
                  isLoading={isLoading}
                  onSearch={() => handleSearch()}
                  inputRef={inputRef}
                />
                <div className="ais-chips" style={{ marginTop: 14 }}>
                  {CHIPS.map(c => (
                    <button key={c} className="ais-chip" onClick={() => handleSearch(c)}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky bottom bar (shown only when messages exist) */}
          {hasMessages && (
            <div className="ais-bottom-bar">
              <div style={{ width: '100%', maxWidth: 640 }}>
                <SearchBox
                  query={query}
                  setQuery={setQuery}
                  isLoading={isLoading}
                  onSearch={() => handleSearch()}
                  inputRef={inputRef}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

/* ─── Search Box sub-component ───────────────────────────────────────────────── */
const SearchBox = ({ query, setQuery, isLoading, onSearch, inputRef }) => (
  <div className="ais-search-box">
    <input
      ref={inputRef}
      type="text"
      className="ais-search-input"
      value={query}
      onChange={e => setQuery(e.target.value)}
      onKeyDown={e => e.key === 'Enter' && onSearch()}
      placeholder="Ask about venues, photographers, florists…"
    />
    <button
      className="ais-send-btn"
      onClick={onSearch}
      disabled={isLoading || !query.trim()}
      aria-label="Send"
    >
      {isLoading ? <SpinnerIcon /> : <SendIcon />}
    </button>
  </div>
);

export default AISearch;