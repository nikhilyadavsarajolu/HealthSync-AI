import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

export default function Medicines() {
  const navigate = useNavigate();

  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchMeds = async () => {
    try {
      setLoading(true);
      const res = await api.get("/medicines");
      setMeds(res.data);
    } catch (err) {
      console.error("Error fetching medicines", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeds();
  }, []);

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    try {
      const exp = new Date(expiryDate);
      const today = new Date();
      exp.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return exp < today;
    } catch {
      return false;
    }
  };

  // helper that calls backend and passes force flag when needed
  const callMarkDonatable = async (medicineId, force = false) => {
    // send force in body
    return api.post(`/donations/${medicineId}`, { force });
  };

  const handleMarkDonatable = async (medicineId) => {
    try {
      setActionLoadingId(medicineId);

      // 1) try normal flow
      const res = await callMarkDonatable(medicineId, false);
      alert(res.data?.message || "Marked as donatable");
      await fetchMeds();
    } catch (err) {
      // network error
      if (!err.response) {
        console.error(err);
        alert("Network error. Try again.");
        setActionLoadingId(null);
        return;
      }

      const { code, message } = err.response.data || {};
      console.warn("Mark donatable error code:", code, message);

      // PRESCRIPTION_REQUIRED -> ask to upload prescription
      if (code === "PRESCRIPTION_REQUIRED") {
        const doUpload = window.confirm(
          "This medicine requires a valid prescription to be donated. Upload prescription now?"
        );
        if (doUpload) {
          // navigate to medicine detail/edit page where user can upload prescription
          navigate(`/medicines/${medicineId}`);
        } else {
          alert("Upload a prescription later to enable donation.");
        }
        setActionLoadingId(null);
        return;
      }

      // UNSEALED_REQUIRE_FORCE -> confirm and retry with force=true
      if (code === "UNSEALED_REQUIRE_FORCE") {
        const ok = window.confirm(
          "This medicine is unsealed. Donating unsealed medicines can be unsafe. Are you sure you want to mark it as donatable anyway?"
        );
        if (!ok) {
          setActionLoadingId(null);
          return;
        }

        // retry with force=true
        try {
          const res2 = await callMarkDonatable(medicineId, true);
          alert(res2.data?.message || "Marked as donatable (forced)");
          await fetchMeds();
        } catch (err2) {
          console.error(err2);
          const msg2 = err2.response?.data?.message || "Failed to mark as donatable";
          alert(msg2);
        } finally {
          setActionLoadingId(null);
        }
        return;
      }

      // EXPIRED
      if (code === "EXPIRED") {
        alert("Cannot donate expired medicine.");
        setActionLoadingId(null);
        return;
      }

      // ALREADY_DONATABLE
      if (code === "ALREADY_DONATABLE") {
        alert("Already marked as donatable.");
        await fetchMeds();
        setActionLoadingId(null);
        return;
      }

      // fallback message
      alert(message || "Failed to mark as donatable");
      setActionLoadingId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <p className="text-slate-600">Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">My Medicines</h2>
          <Link
            to="/medicines/add"
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm"
          >
            + Add Medicine
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Brand</th>
                <th className="text-left px-4 py-2">Qty</th>
                <th className="text-left px-4 py-2">Expiry</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Donatable</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => {
                const expired = isExpired(m.expiryDate);
                return (
                  <tr key={m._id} className="border-t border-slate-100">
                    <td className="px-4 py-2">{m.name}</td>
                    <td className="px-4 py-2">{m.brand}</td>
                    <td className="px-4 py-2">{m.quantity}</td>
                    <td className="px-4 py-2">
                      {m.expiryDate ? m.expiryDate.split("T")[0] : "N/A"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          m.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>

                    {/* Donatable column with button + rules */}
                    <td className="px-4 py-2">
                      {m.isDonatable ? (
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">
                          Yes
                        </span>
                      ) : (
                        <>
                          {expired || m.status === "EXPIRED" ? (
                            <div>
                              <span className="text-xs text-red-500">
                                Not eligible (expired)
                              </span>
                            </div>
                          ) : m.requiresPrescription && !m.prescriptionVerified ? (
                            <div>
                              <span className="text-xs text-red-600">
                                Prescription required
                              </span>
                              <div className="mt-2">
                                <button
                                  onClick={() => navigate(`/medicines/${m._id}`)}
                                  className="px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                                >
                                  Upload Prescription
                                </button>
                              </div>
                            </div>
                          ) : !m.isSealed ? (
                            <div>
                              <button
                                onClick={() => handleMarkDonatable(m._id)}
                                disabled={actionLoadingId === m._id}
                                className="px-2 py-1 text-xs bg-gray-200 text-slate-700 rounded-lg"
                                title="Unsealed medicines are not allowed for donation by default — click to confirm and force donate"
                              >
                                Mark as Donatable
                              </button>
                              <p className="text-xs text-yellow-600 mt-1">
                                Unsealed — will require confirmation
                              </p>
                            </div>
                          ) : (
                            <div>
                              <button
                                onClick={() => handleMarkDonatable(m._id)}
                                disabled={actionLoadingId === m._id}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                              >
                                {actionLoadingId === m._id ? "Processing..." : "Mark as Donatable"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}

              {meds.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-slate-500">
                    No medicines added yet. Click &quot;Add Medicine&quot; to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
