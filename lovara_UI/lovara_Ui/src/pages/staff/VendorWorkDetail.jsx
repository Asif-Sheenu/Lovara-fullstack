import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { vendorService, generalService, BACKEND_URL } from "../../services/api";

const GF = "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap";

export default function VendorWorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    tags: "",
    latitude: "",
    longitude: "",
  });

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

  const fetchWorkData = async () => {
    try {
      setLoading(true);
      const res = await generalService.getWorkById(id);
      setWork(res.data);
      setEditForm({
        title: res.data.title || "",
        description: res.data.description || "",
        tags: res.data.tags || "",
        latitude: res.data.latitude || "",
        longitude: res.data.longitude || "",
      });
    } catch (err) {
      console.error("Failed to fetch work details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you certain you wish to remove this masterpiece from your portfolio? This action is permanent.")) return;
    try {
      setDeleting(true);
      await vendorService.deleteWork(id);
      navigate("/vendor");
    } catch (err) {
      alert(err.message || "Failed to delete work");
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const lat = parseFloat(editForm.latitude);
      const lng = parseFloat(editForm.longitude);
      
      if (isNaN(lat) || lat < -90 || lat > 90) throw new Error("Latitude must be between -90 and 90");
      if (isNaN(lng) || lng < -180 || lng > 180) throw new Error("Longitude must be between -180 and 180");

      await vendorService.updateWork(id, {
        ...editForm,
        latitude: lat,
        longitude: lng
      });
      setIsEditModalOpen(false);
      fetchWorkData();
    } catch (err) {
      alert(err.message || "Failed to update work");
    }
  };

  const getFullImageUrl = (imgObj) => {
    const url = imgObj?.image_url;
    if (!url) return "/placeholder.jpg";
    return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0E0C0A", fontFamily: "'Outfit', sans-serif" }}>
      <style>{`@import url('${GF}'); @keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{ position: "relative", width: 56, height: 56, margin: "0 auto 28px" }}>
          <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(201,169,110,0.15)", borderRadius: "50%" }} />
          <div style={{ position: "absolute", inset: 0, border: "1px solid transparent", borderTopColor: "#C9A96E", borderRadius: "50%", animation: "spin 1.2s linear infinite" }} />
        </div>
        <div style={{ fontSize: 10, letterSpacing: "0.35em", color: "#4a4540", textTransform: "uppercase" }}>Loading Masterpiece</div>
      </div>
    </div>
  );

  if (!work) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0E0C0A", fontFamily: "'Outfit', sans-serif" }}>
      <div style={{ fontFamily: "'Cormorant', serif", fontSize: 28, color: "#FAF8F5", marginBottom: 8 }}>Not Found</div>
      <button onClick={() => navigate("/vendor")} style={{ background: "transparent", color: "#C9A96E", border: "1px solid #C9A96E", padding: "12px 24px", cursor: "pointer" }}>Return to Dashboard</button>
    </div>
  );

  const allImages = work.images || [];
  const heroImage = allImages?.[activeImage]?.image_url || "/placeholder.jpg";

  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", background: "#F6F4F0", minHeight: "100vh" }}>
      <style>{`
        @import url('${GF}');
        .nav-glass {
          background: ${scrolled ? "rgba(14,12,10,0.95)" : "transparent"};
          border-bottom: 1px solid ${scrolled ? "rgba(201,169,110,0.2)" : "transparent"};
          transition: all 0.4s;
        }
        .btn-manage {
          padding: 12px 24px; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
          cursor: pointer; border-radius: 4px; font-weight: 600; transition: all 0.3s;
        }
        .btn-edit { background: #C9A96E; color: #1a1714; border: none; }
        .btn-edit:hover { background: #e8c888; transform: translateY(-2px); }
        .btn-delete { background: transparent; color: #c9705a; border: 1px solid #c9705a; }
        .btn-delete:hover { background: #c9705a; color: #fff; }
        
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.8);
          backdrop-filter: blur(8px); z-index: 1000;
          display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal-card {
          background: #fff; width: 100%; max-width: 500px; border-radius: 12px; padding: 40px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.4);
        }
        .input-group { margin-bottom: 20px; }
        .input-label { display: block; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .input-field {
          width: 100%; padding: 12px; border: 1px solid #eee; border-radius: 4px;
          font-family: 'Outfit', sans-serif; font-size: 14px; outline: none; transition: border-color 0.3s;
        }
        .input-field:focus { border-color: #C9A96E; }
      `}</style>

      {/* Navigation */}
      <nav className={`nav-glass`} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, padding: "20px 60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={() => navigate("/vendor")} style={{ background: "transparent", border: "none", color: scrolled ? "#fff" : "#fff", cursor: "pointer", fontSize: 18 }}>←</button>
          <span style={{ fontFamily: "'Cormorant', serif", fontSize: 24, fontWeight: 500, color: "#C9A96E", letterSpacing: "0.05em" }}>Lovara <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", fontWeight: 300, letterSpacing: "0.2em", textTransform: "uppercase", marginLeft: 8 }}>Management</span></span>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn-manage btn-edit" onClick={() => setIsEditModalOpen(true)}>Edit Details</button>
          <button className="btn-manage btn-delete" onClick={handleDelete} disabled={deleting}>{deleting ? "Deleting..." : "Delete Work"}</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ position: "relative", height: "85vh", background: "#0E0C0A", overflow: "hidden" }}>
        <div ref={parallaxRef} style={{ position: "absolute", inset: 0, transition: "transform 0.1s ease-out" }}>
          <img src={heroImage} style={{ width: "100%", height: "125%", objectFit: "cover", opacity: 0.7 }} alt="hero" />
        </div>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(14,12,10,0.4), #0E0C0A)" }} />
        
        <div style={{ position: "absolute", bottom: 80, left: 60, right: 60, maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.4em", textTransform: "uppercase", marginBottom: 16 }}>Collection Piece</div>
          <h1 style={{ fontFamily: "'Cormorant', serif", fontSize: "clamp(3rem, 8vw, 6rem)", color: "#FAF8F5", fontWeight: 300, lineHeight: 1.1, marginBottom: 24 }}>{work.title}</h1>
          <div style={{ display: "flex", gap: 40 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 4 }}>Specialty</div>
              <div style={{ color: "#fff", fontSize: 13, fontWeight: 500 }}>{work.tags || "Luxury Event"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */} 
      <section style={{ padding: "80px 60px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 80 }}>
          <div>
            <div style={{ marginBottom: 60 }}>
              <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>The Narrative</div>
              <p style={{ fontFamily: "'Cormorant', serif", fontSize: 22, color: "#1a1714", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{work.description || "No description provided."}</p>
            </div>

            {/* Gallery */}
            <div>
              <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 30 }}>Visual Journal</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
                {allImages.map((img, idx) => (
                  <div key={idx} style={{ height: 350, overflow: "hidden", borderRadius: 4, cursor: "pointer", border: activeImage === idx ? "2px solid #C9A96E" : "none" }} onClick={() => setActiveImage(idx)}>
                    <img src={img?.image_url || "/placeholder.jpg"} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={`gallery-${idx}`} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div style={{ background: "#fff", padding: "40px", borderRadius: 8, border: "1px solid #eee", position: "sticky", top: 120 }}>
              <div style={{ fontSize: 10, color: "#C9A96E", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 24 }}>System Details</div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>Created On</div>
                <div style={{ fontSize: 14, color: "#1a1714" }}>{new Date(work.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: "#aaa", marginBottom: 4 }}>ID</div>
                <div style={{ fontSize: 14, color: "#1a1714", fontFamily: "'DM Mono', monospace" }}>#LV-W{work.id}</div>
              </div>
              <div style={{ height: 1, background: "#f0ece6", margin: "32px 0" }} />
              <button className="btn-manage btn-edit" style={{ width: "100%", marginBottom: 12 }} onClick={() => setIsEditModalOpen(true)}>Edit Collection</button>
              <button className="btn-manage btn-delete" style={{ width: "100%" }} onClick={handleDelete}>Remove Piece</button>
            </div>
          </aside>
        </div>
      </section>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 style={{ fontFamily: "'Cormorant', serif", fontSize: 28, marginBottom: 32 }}>Edit Collection</h2>
            <form onSubmit={handleUpdate}>
              <div className="input-group">
                <label className="input-label">Title</label>
                <input className="input-field" value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Category / Tags</label>
                <input className="input-field" value={editForm.tags} onChange={e => setEditForm({ ...editForm, tags: e.target.value })} placeholder="e.g. Wedding, Photography" />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div className="input-group">
                  <label className="input-label">Latitude</label>
                  <input className="input-field" type="number" step="any" value={editForm.latitude} onChange={e => setEditForm({ ...editForm, latitude: e.target.value })} required />
                </div>
                <div className="input-group">
                  <label className="input-label">Longitude</label>
                  <input className="input-field" type="number" step="any" value={editForm.longitude} onChange={e => setEditForm({ ...editForm, longitude: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                <button type="submit" className="btn-manage btn-edit" style={{ flex: 1 }}>Save Changes</button>
                <button type="button" className="btn-manage btn-delete" style={{ flex: 1 }} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
