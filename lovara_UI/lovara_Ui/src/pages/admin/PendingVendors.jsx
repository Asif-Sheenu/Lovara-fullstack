import { useEffect, useState } from "react";
import { authService, BACKEND_URL } from "../../services/api";

export default function PendingVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    fetchVendors();
  }, []);

 const fetchVendors = async () => {
  try {
    setLoading(true);

    const res = await authService.getPendingVendors();

    console.log("FULL RESPONSE:", res);
    console.log("DATA ONLY:", res.data);

    setVendors(res.data || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  const handleUpdateStatus = async (vendorId, status) => {
    try {
      if (status === 'APPROVED') {
        await authService.approveVendor(vendorId);
      } else {
        await authService.rejectVendor(vendorId);
      }
      fetchVendors();
      alert(`Vendor ${status === 'APPROVED' ? 'Approved' : 'Rejected'} successfully.`);
    } catch (err) {
      console.error(`Failed to ${status} vendor:`, err);
      alert(`Failed to ${status} vendor. Please try again.`);
    }
  };

  return (
    <div style={{ 
      padding: "30px", 
      background: "#0d1117", 
      minHeight: "100vh", 
      color: "#eef1f6",
      fontFamily: "'Jost', sans-serif" 
    }}>
      <h2 style={{ 
        fontFamily: "'Cormorant Garamond', serif", 
        fontSize: "32px", 
        fontWeight: "300", 
        marginBottom: "20px",
        color: "#C9A96E"
      }}>Pending Vendor Requests</h2>
      
      {loading && <p style={{ color: "#4a5568", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>Loading requests...</p>}
      
      {!loading && vendors.length === 0 && (
        <p style={{ color: "#4a5568", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>No pending requests found.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
  {vendors.map(v => {
    console.log("CERT RAW:", v.certificate);
    console.log("TYPE:", typeof v.certificate);

    return (
      <li key={v.id} style={{ 
        background: "#161c27", 
        border: "1px solid #253045", 
        padding: "20px", 
        marginBottom: "10px", 
        borderRadius: "8px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
      }}>
        <div>
          <div style={{ fontSize: "16px", fontWeight: "500", marginBottom: "4px" }}>
            {v.full_name}
          </div>
          <div style={{ fontSize: "12px", color: "#8b96a8", fontFamily: "'DM Mono', monospace" }}>
            {v.email} — {v.business_name}
          </div>

          {v.certificate ? (
            <div style={{ marginTop: "10px" }}>
              <button 
                onClick={() => setSelectedCert(v.certificate.replace(/^\/+/, ''))}
                style={{ 
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#C9A96E", 
                  fontSize: "11px", 
                  textDecoration: "underline",
                  fontFamily: "'DM Mono', monospace",
                  cursor: "pointer"
                }}
              >
                View Certificate ↗
              </button>
            </div>
          ) : (
            <div style={{ marginTop: "10px", fontSize: "11px", color: "#4a5568", fontFamily: "'DM Mono', monospace" }}>
              No certificate provided
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button 
            onClick={() => handleUpdateStatus(v.id, 'APPROVED')}
            style={{
              background: "rgba(52,211,153,.1)", 
              color: "#34d399",
              border: "1px solid rgba(52,211,153,.2)", 
              padding: "6px 16px",
              borderRadius: 4, 
              cursor: "pointer", 
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace", 
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(52,211,153,.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(52,211,153,.1)"}
          >
            Approve
          </button>

          <button 
            onClick={() => handleUpdateStatus(v.id, 'REJECTED')}
            style={{
              background: "rgba(248,113,113,.1)", 
              color: "#f87171",
              border: "1px solid rgba(248,113,113,.2)", 
              padding: "6px 16px",
              borderRadius: 4, 
              cursor: "pointer", 
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace", 
              transition: "all 0.2s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(248,113,113,.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(248,113,113,.1)"}
          >
            Reject
          </button>
        </div>
      </li>
    );
  })}
</ul>

      {/* ── Certificate Modal ────────────────────────── */}
      {selectedCert && (
        <div 
          onClick={() => setSelectedCert(null)}
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            background: "rgba(0,0,0,0.85)", zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            backdropFilter: "blur(5px)", padding: "40px"
          }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            style={{
              background: "#161c27", border: "1px solid #253045",
              borderRadius: 12, width: "100%", maxWidth: "900px", maxHeight: "90vh",
              display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{ 
              padding: "16px 24px", borderBottom: "1px solid #1e2a3d",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
               <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: "#8b96a8", letterSpacing: ".12em" }}>LICENSE / CERTIFICATE</span>
               <button 
                 onClick={() => setSelectedCert(null)}
                 style={{ background: "none", border: "none", color: "#4a5568", fontSize: 24, cursor: "pointer", display: "flex", alignItems: "center" }}
               >×</button>
            </div>
            <div style={{ flex: 1, padding: "2px", background: "#0d1117", minHeight: "600px" }}>
               {selectedCert.toLowerCase().endsWith('.pdf') ? (
                 <iframe src={selectedCert} width="100%" height="600px" style={{ border: "none" }} />
               ) : (
                 <div style={{ height: "600px", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                   <img src={selectedCert} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} alt="Certificate" />
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
