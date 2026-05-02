import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/Authcontext";

const ROLES = [
  { id: "client", label: "Client", icon: "◇" },
  { id: "staff", label: "Vendor", icon: "◈" },
];

function LuxuryInput({ field, value, onChange }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = field.type === "password";

  return (
    <div className="relative mb-6">
      <label
        className="block text-[10px] tracking-[0.2em] uppercase mb-2 transition-colors duration-200"
        style={{ color: focused ? "#C9A96E" : "#6b6b6b", fontFamily: "'Jost', sans-serif" }}
      >
        {field.label}
      </label>
      <div className="relative">
        <input
          type={isPass && show ? "text" : field.type}
          placeholder={field.placeholder}
          value={value}
          onChange={e => onChange(field.name, e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent text-[14px] text-[#1a1a1a] placeholder-[#ccc] outline-none pb-3 pr-12 transition-all duration-300"
          style={{
            borderBottom: focused ? "1px solid #C9A96E" : "1px solid #d4cfc9",
            fontFamily: "'Cormorant Garamond', serif",
            letterSpacing: "0.03em",
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-0 bottom-3 text-[9px] tracking-[0.15em] uppercase text-[#bbb] hover:text-[#C9A96E] transition-colors"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {show ? "Hide" : "Show"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login: performLogin } = useAuth();
  
  const [role, setRole] = useState("client");
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { setForm({ email: "", password: "" }); setError(null); }, [role]);

  const activeRole = ROLES.find(r => r.id === role);
  const handleChange = (name, val) => setForm(f => ({ ...f, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    
    try {
      const user = await performLogin({
        email: form.email,
        password: form.password,
      });

      // 1️⃣ Vendor Safety Check
      if (user.wants_to_be_staff && user.status !== 'APPROVED') {
        alert("Your vendor request is being processed by admin.");
        setLoading(false);
        return;
      }

      console.log("Login success");

      // Role-based redirection
      const role = user.role?.toUpperCase();
      navigate({
        ADMIN: "/admin",
        STAFF: "/vendor",
        VENDOR: "/vendor",
        ARTISAN: "/vendor",
      }[role] || "/user");

    } catch (err) {
      console.error(err.message || "Login failed");
      setError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const FIELDS = [
    { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
    { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
  ];

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes errorShake {
          0%,100% { transform: translateX(0); }
          20%,60% { transform: translateX(-6px); }
          40%,80% { transform: translateX(6px); }
        }
        input::placeholder { color: #c8c2ba; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #FAF8F5 inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }
        .role-btn { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
        .role-btn:hover { background: rgba(201,169,110,0.05); }
        .submit-btn { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .submit-btn:hover:not(:disabled) { background: #b8924f; letter-spacing: 0.22em; }
        .error-box { animation: errorShake 0.4s ease; }
      `}</style>

      {/* RIGHT decorative panel (reversed layout from register) */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] min-h-screen p-16 relative overflow-hidden order-last"
        style={{ background: "#1C1917" }}
      >
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />
        <div className="absolute top-0 left-0 w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, #C9A96E33, transparent)" }} />

        {/* Top quote */}
        <div style={{ animation: mounted ? "fadeUp 0.8s ease both" : "none" }}>
          <div className="flex items-center gap-3 mb-20">
            <div className="w-px h-8" style={{ background: "#C9A96E" }} />
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#C9A96E]">Lovara</span>
          </div>

          <blockquote
            className="text-[42px] leading-[1.1] font-light text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            "Every great<br />
            event begins<br />
            with a <em style={{ color: "#C9A96E" }}>vision.</em>"
          </blockquote>

          <div className="mt-8 flex items-center gap-3">
            <div className="h-px w-10" style={{ background: "#C9A96E44" }} />
            <span className="text-[10px] tracking-[0.2em] text-[#5a5450] uppercase">Lovara Studios</span>
          </div>
        </div>

        {/* Decorative geometric */}
        <div style={{ animation: mounted ? "fadeUp 0.8s 0.3s ease both" : "none", opacity: 0, animationFillMode: "forwards" }}>
          <div className="flex gap-2 mb-3">
            {["◇", "◈"].map((icon, i) => (
              <div key={i}
                className="w-10 h-10 flex items-center justify-center text-sm"
                style={{
                  border: "1px solid #C9A96E22",
                  color: "#C9A96E44",
                  animation: `fadeIn ${0.5 + i * 0.15}s ease both`,
                }}
              >{icon}</div>
            ))}
          </div>
          <p className="text-[9px] tracking-[0.2em] uppercase text-[#3a3632]">Clients & Vendors</p>
        </div>

        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full" style={{ border: "1px solid #C9A96E10" }} />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 rounded-full" style={{ border: "1px solid #C9A96E14" }} />
      </div>

      {/* LEFT — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-16">
        <div
          className="w-full max-w-[380px]"
          style={{ animation: mounted ? "fadeUp 0.6s 0.1s ease both" : "none", opacity: 0, animationFillMode: "forwards" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-px h-6" style={{ background: "#C9A96E" }} />
            <span className="text-[10px] tracking-[0.35em] uppercase text-[#C9A96E]">Lovara</span>
          </div>

          <div className="mb-10">
            <h2
              className="text-[36px] font-light text-[#1a1a1a] mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
            >
              Welcome back.
            </h2>
            <p className="text-[11px] text-[#999] tracking-wide">
              New to Lovara?{" "}
              <a href="/register" className="text-[#C9A96E] hover:underline">Create an account</a>
            </p>
          </div>

          {/* Role selector */}
          <div className="mb-8">
            <p className="text-[9px] tracking-[0.2em] uppercase text-[#bbb] mb-3">Sign in as</p>
            <div className="flex gap-2">
              {ROLES.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className="role-btn flex-1 py-3 rounded-sm border text-center"
                  style={{
                    borderColor: role === r.id ? "#C9A96E" : "#e5e0d8",
                    background: role === r.id ? "rgba(201,169,110,0.06)" : "transparent",
                  }}
                >
                  <div className="text-base mb-1" style={{ color: role === r.id ? "#C9A96E" : "#ccc" }}>
                    {r.icon}
                  </div>
                  <div
                    className="text-[9px] tracking-[0.14em] uppercase"
                    style={{ color: role === r.id ? "#C9A96E" : "#aaa", fontWeight: role === r.id ? 500 : 400 }}
                  >
                    {r.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-8 h-px" style={{ background: "linear-gradient(to right, #C9A96E33, transparent)" }} />

          {/* Error */}
          {error && (
            <div
              className="error-box mb-6 py-3 px-4 text-[11px] tracking-wide"
              style={{
                border: "1px solid #c9a96e44",
                color: "#8a6a30",
                background: "rgba(201,169,110,0.06)",
                fontFamily: "'Jost', sans-serif",
              }}
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {FIELDS.map(f => (
              <LuxuryInput
                key={`${role}-${f.name}`}
                field={f}
                value={form[f.name] || ""}
                onChange={handleChange}
              />
            ))}

            <div className="flex justify-between items-center mt-2 mb-10">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div
                  className="w-3.5 h-3.5 border flex items-center justify-center"
                  style={{ borderColor: "#d4cfc9" }}
                >
                </div>
                <span className="text-[10px] tracking-wide text-[#999]">Remember me</span>
              </label>
              <button
                type="button"
                className="text-[10px] tracking-wide text-[#C9A96E] hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="submit-btn w-full py-4 text-[10px] tracking-[0.18em] uppercase text-white disabled:opacity-50 flex items-center justify-center gap-3"
              style={{ background: "#1C1917" }}
            >
              {loading ? (
                <>
                  <div
                    className="w-3 h-3 rounded-full border border-[#C9A96E] border-t-transparent"
                    style={{ animation: "spin 0.8s linear infinite" }}
                  />
                  <span>Signing in…</span>
                </>
              ) : (
                `Sign In as ${activeRole.label}`
              )}
            </button>
          </form>

          <p className="text-center text-[9px] tracking-[0.16em] uppercase text-[#ccc] mt-10">
            Lovara · Secure · Encrypted
          </p>
        </div>
      </div>
    </div>
  );
}