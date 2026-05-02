import { useState, useEffect } from "react";
import { authService } from "../../services/api";
import { useAuth } from "../../context/Authcontext";

const ROLES = [
  { id: "USER", label: "Client", icon: "◇", desc: "Discover & book world-class event professionals" },
  { id: "VENDOR", label: "Vendor", icon: "◈", desc: "Showcase your craft to discerning clients" },
];

const FIELDS = {
  USER: [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "Your name" },
    { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
    { name: "otp", label: "Verification Code", type: "text", placeholder: "Enter 6-digit OTP" },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 00000 00000" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
    { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "Re-enter password" },
  ],
  VENDOR: [
    { name: "full_name", label: "Full Name", type: "text", placeholder: "Your name" },
    { name: "business_name", label: "Studio / Brand Name", type: "text", placeholder: "e.g. Atelier Blanc" },
    { name: "email", label: "Email Address", type: "email", placeholder: "you@example.com" },
    { name: "otp", label: "Verification Code", type: "text", placeholder: "Enter 6-digit OTP" },
    { name: "phone", label: "Phone Number", type: "tel", placeholder: "+91 00000 00000" },
    { name: "specialty", label: "Specialty", type: "text", placeholder: "e.g. Destination Weddings, Goa" },
    { name: "certificate", label: "Professional Certificate", type: "file", placeholder: "Upload Certificate", accept: ".pdf,image/*" },
    { name: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
    { name: "confirm_password", label: "Confirm Password", type: "password", placeholder: "Re-enter password" },
  ],
};

function LuxuryInput({ field, value, onChange, secondaryAction }) {
  const [focused, setFocused] = useState(false);
  const [show, setShow] = useState(false);
  const isPass = field.type === "password";
  const isFile = field.type === "file";

  return (
    <div className="relative mb-5">
      <label
        className="block text-[10px] tracking-[0.2em] uppercase mb-2 transition-colors duration-200"
        style={{ color: focused ? "#C9A96E" : "#6b6b6b" }}
      >
        {field.label}
      </label>
      <div className="relative">
        {isFile ? (
          <input
            type="file"
            accept={field.accept}
            onChange={e => {
              if (e.target.files && e.target.files.length > 0) {
                onChange(field.name, e.target.files[0]);
              }
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-[13px] text-[#1a1a1a] outline-none pb-3 pr-16 transition-all duration-300 file:mr-4 file:py-1 file:px-3 file:rounded-sm file:border-0 file:text-[10px] file:uppercase file:tracking-[0.1em] file:bg-[rgba(201,169,110,0.1)] file:text-[#C9A96E] hover:file:bg-[rgba(201,169,110,0.2)] cursor-pointer"
            style={{
              borderBottom: focused ? "1px solid #C9A96E" : "1px solid #d4cfc9",
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.03em",
            }}
          />
        ) : (
          <input
            type={isPass && show ? "text" : field.type}
            placeholder={field.placeholder}
            value={typeof value === 'object' ? '' : (value || "")}
            onChange={e => onChange(field.name, e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-[13px] text-[#1a1a1a] placeholder-[#c8c2ba] outline-none pb-3 pr-16 transition-all duration-300"
            style={{
              borderBottom: focused ? "1px solid #C9A96E" : "1px solid #d4cfc9",
              fontFamily: "'Cormorant Garamond', serif",
              letterSpacing: "0.03em",
            }}
          />
        )}
        {isPass ? (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-0 bottom-3 text-[9px] tracking-[0.15em] uppercase text-[#999] hover:text-[#C9A96E] transition-colors"
            style={{ fontFamily: "'Jost', sans-serif" }}
          >
            {show ? "Hide" : "Show"}
          </button>
        ) : secondaryAction ? (
          <div className="absolute right-0 bottom-3">
            {secondaryAction}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Register() {
  const [role, setRole] = useState("USER");
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { register: performRegister } = useAuth();

  useEffect(() => {
    setMounted(true);
    // Inject Google Fonts
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  useEffect(() => { setForm({}); setOtpSent(false); setError(null); }, [role]);

  useEffect(() => {
    if (otpSent) setOtpSent(false);
  }, [form.email]);

  const activeRole = ROLES.find(r => r.id === role);
  const fields = FIELDS[role];
  const handleChange = (name, val) => setForm(f => ({ ...f, [name]: val }));



  const handleSendOtp = async () => {
    if (!form.email) {
      setError("Please enter your email address first");
      return;
    }
    
    setOtpLoading(true);
    setError(null);
    try {
      await authService.sendOtp(form.email);
      setOtpSent(true);
      // Success feedback is handled by button text and state
    } catch (err) {
      console.error("OTP send failed:", err);
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payloadData = new FormData();
    Object.keys(form).forEach(key => {
      if (form[key]) {
        payloadData.append(key, form[key]);
      }
    });

    payloadData.append("role", role === "VENDOR" ? "USER" : role);
    if (role === "VENDOR") {
      payloadData.append("wants_to_be_staff", "true");
    }

    try {
      await performRegister(payloadData);
      setDone(true);
    } catch (err) {
      console.log("Register error:", err.message);
      setError(err.message || "An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex"
      style={{ fontFamily: "'Jost', sans-serif", background: "#FAF8F5" }}
    >
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes shimmer {
          0%,100% { opacity: 0.4; } 50% { opacity: 1; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideFields {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #c8c2ba; }
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 30px #FAF8F5 inset !important;
          -webkit-text-fill-color: #1a1a1a !important;
        }
        .role-btn { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .role-btn:hover { background: rgba(201,169,110,0.06); }
        .submit-btn { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); }
        .submit-btn:hover:not(:disabled) { background: #b8924f; letter-spacing: 0.22em; }
      `}</style>

      {/* LEFT — decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[42%] min-h-screen p-16 relative overflow-hidden"
        style={{ background: "#1C1917" }}
      >
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "200px",
          }}
        />

        {/* Gold accent line */}
        <div className="absolute top-0 right-0 w-px h-full" style={{ background: "linear-gradient(to bottom, transparent, #C9A96E44, transparent)" }} />

        {/* Top */}
        <div style={{ animation: mounted ? "fadeUp 0.8s ease both" : "none" }}>
          <div className="flex items-center gap-3 mb-20">
            <div className="w-px h-8" style={{ background: "#C9A96E" }} />
            <span className="text-[11px] tracking-[0.35em] uppercase text-[#C9A96E]">Lovara</span>
          </div>

          <h1
            className="text-[52px] leading-[1.08] font-light text-white mb-8"
            style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
          >
            Where every<br />
            <em className="italic" style={{ color: "#C9A96E" }}>moment</em><br />
            becomes art.
          </h1>

          <p className="text-[12px] text-[#7a7470] leading-relaxed tracking-wide max-w-[260px]">
            India's most curated platform for destination weddings and luxury events.
          </p>
        </div>

        {/* Bottom stats */}
        <div
          className="flex gap-10"
          style={{ animation: mounted ? "fadeUp 0.8s 0.3s ease both" : "none", opacity: 0, animationFillMode: "forwards" }}
        >
          {[["3,200+", "Vendors"], ["12K+", "Events"], ["98%", "Satisfaction"]].map(([n, l]) => (
            <div key={l}>
              <div
                className="text-[28px] font-light text-white mb-1"
                style={{ fontFamily: "'Cormorant Garamond', serif", color: "#C9A96E" }}
              >{n}</div>
              <div className="text-[9px] tracking-[0.2em] uppercase text-[#5a5450]">{l}</div>
            </div>
          ))}
        </div>

        {/* Decorative circle */}
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full"
          style={{ border: "1px solid #C9A96E18" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full"
          style={{ border: "1px solid #C9A96E12" }}
        />
      </div>

      {/* RIGHT — form panel */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 overflow-y-auto">
        <div
          className="w-full max-w-[400px]"
          style={{ animation: mounted ? "fadeUp 0.6s 0.1s ease both" : "none", opacity: 0, animationFillMode: "forwards" }}
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-12">
            <div className="w-px h-6" style={{ background: "#C9A96E" }} />
            <span className="text-[10px] tracking-[0.35em] uppercase text-[#C9A96E]">Lovara</span>
          </div>

          {!done ? (
            <>
              <div className="mb-10">
                <h2
                  className="text-[32px] font-light text-[#1a1a1a] mb-2"
                  style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.01em" }}
                >
                  Create your account
                </h2>
                <p className="text-[11px] text-[#999] tracking-wide">
                  Already a member?{" "}
                  <a href="/login" className="text-[#C9A96E] hover:underline">Sign in</a>
                </p>
              </div>

              {/* Role selector */}
              <div className="mb-8">
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#bbb] mb-3">I am joining as</p>
                <div className="flex gap-2">
                  {ROLES.map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className="role-btn flex-1 py-3 px-2 text-center rounded-sm border"
                      style={{
                        borderColor: role === r.id ? "#C9A96E" : "#e5e0d8",
                        background: role === r.id ? "rgba(201,169,110,0.06)" : "transparent",
                      }}
                    >
                      <div
                        className="text-base mb-1"
                        style={{ color: role === r.id ? "#C9A96E" : "#ccc" }}
                      >{r.icon}</div>
                      <div
                        className="text-[9px] tracking-[0.14em] uppercase"
                        style={{ color: role === r.id ? "#C9A96E" : "#aaa", fontWeight: role === r.id ? 500 : 400 }}
                      >{r.label}</div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#bbb] mt-2 leading-relaxed">{activeRole.desc}</p>
              </div>

              {/* Thin gold divider */}
              <div className="mb-8 h-px" style={{ background: "linear-gradient(to right, #C9A96E33, transparent)" }} />

              {/* Error Message */}
              {error && (
                <div 
                  className="mb-6 p-4 text-[11px] tracking-wide"
                  style={{ 
                    background: "rgba(220, 38, 38, 0.05)", 
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#dc2626",
                    fontFamily: "'Jost', sans-serif"
                  }}
                >
                  {error}
                </div>
              )}

              {/* OTP Success Message */}
              {otpSent && !error && (
                <div 
                  className="mb-6 p-4 text-[11px] tracking-wide"
                  style={{ 
                    background: "rgba(201, 169, 110, 0.05)", 
                    border: "1px solid rgba(201, 169, 110, 0.2)",
                    color: "#C9A96E",
                    fontFamily: "'Jost', sans-serif"
                  }}
                >
                  Verification code has been sent to {form.email}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} key={role} style={{ animation: "slideFields 0.3s ease both" }}>
                {fields.map(f => (
                  <LuxuryInput
                    key={`${role}-${f.name}`}
                    field={f}
                    value={form[f.name] || ""}
                    onChange={handleChange}
                    secondaryAction={
                      f.name === "email" ? (
                        <button
                          type="button"
                          disabled={otpLoading}
                          onClick={handleSendOtp}
                          className="text-[9px] tracking-[0.15em] uppercase text-[#C9A96E] hover:text-[#b8924f] transition-colors disabled:opacity-50"
                          style={{ fontFamily: "'Jost', sans-serif" }}
                        >
                          {otpLoading ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                        </button>
                      ) : null
                    }
                  />
                ))}

                <p className="text-[10px] text-[#bbb] leading-relaxed mt-6 mb-8">
                  By continuing you agree to Lovara's{" "}
                  <span className="text-[#C9A96E] cursor-pointer">Terms</span> and{" "}
                  <span className="text-[#C9A96E] cursor-pointer">Privacy Policy</span>.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="submit-btn w-full py-4 text-[10px] tracking-[0.18em] uppercase text-white disabled:opacity-50 flex items-center justify-center gap-3"
                  style={{ background: "#1C1917", letterSpacing: "0.18em" }}
                >
                  {loading ? (
                    <>
                      <div
                        className="w-3 h-3 rounded-full border border-[#C9A96E] border-t-transparent"
                        style={{ animation: "spin 0.8s linear infinite" }}
                      />
                      <span>Creating account…</span>
                    </>
                  ) : (
                    `Create ${activeRole.label} Account`
                  )}
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <div className="text-center" style={{ animation: "fadeIn 0.6s ease both" }}>
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-8"
                style={{ border: "1px solid #C9A96E", color: "#C9A96E", fontSize: 24 }}
              >
                ◇
              </div>
              <h2
                className="text-[32px] font-light text-[#1a1a1a] mb-3"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Welcome to Lovara
              </h2>
              <p className="text-[11px] text-[#999] tracking-wide mb-8">
                Your {activeRole.label.toLowerCase()} account has been created.
              </p>
              <a
                href="/login"
                className="text-[10px] tracking-[0.2em] uppercase text-[#C9A96E] hover:underline"
              >
                Proceed to Sign In →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}