import { useEffect, useState } from "react";
import api from "../api/axiosClient";

export default function Donations() {
  const [tab, setTab] = useState("nearby"); // 'nearby' | 'my' | 'requests'
  const [nearby, setNearby] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchNearby = async () => {
    setLoading(true);
    try {
      const res = await api.get("/donations/nearby");
      setNearby(res.data || []);
    } catch (err) {
      console.error("Error fetching nearby donations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDonations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/donations/my");
      setMyDonations(res.data || []);
    } catch (err) {
      console.error("Error fetching my donations", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const [sentRes, receivedRes] = await Promise.all([
        api.get("/donations/requests/sent"),
        api.get("/donations/requests/received"),
      ]);
      setSentRequests(sentRes.data || []);
      setReceivedRequests(receivedRes.data || []);
    } catch (err) {
      console.error("Error fetching requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "nearby") fetchNearby();
    if (tab === "my") fetchMyDonations();
    if (tab === "requests") fetchRequests();
  }, [tab]);

  const handleRequestDonation = async (donationId) => {
    try {
      setActionLoadingId(donationId);
      await api.post(`/donations/${donationId}/requests`, { message: "" });
      alert("Request sent!");
      fetchNearby();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to request donation");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUpdateRequest = async (requestId, status) => {
    try {
      setActionLoadingId(requestId);
      await api.patch(`/donations/requests/${requestId}`, { status });
      alert(`Request ${status.toLowerCase()}`);
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update request");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">
          Donations
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("nearby")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tab === "nearby"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border"
            }`}
          >
            Nearby
          </button>
          <button
            onClick={() => setTab("my")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tab === "my"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border"
            }`}
          >
            My Donations
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-4 py-2 rounded-full text-sm font-semibold ${
              tab === "requests"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-700 border"
            }`}
          >
            Requests
          </button>
        </div>

        {loading && (
          <p className="text-slate-500 text-sm mb-3">Loading...</p>
        )}

        {/* Nearby tab */}
        {tab === "nearby" && !loading && (
          <div className="space-y-3">
            {nearby.length === 0 && (
              <p className="text-slate-500 text-sm">
                No nearby donations found. Try again later.
              </p>
            )}
            {nearby.map((d) => (
              <div
                key={d._id}
                className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-slate-100"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {d.medicine?.name}{" "}
                    {d.medicine?.brand && (
                      <span className="text-slate-500">
                        ({d.medicine.brand})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Qty: {d.medicine?.quantity} • Expires:{" "}
                    {d.medicine?.expiryDate?.split("T")[0] || "N/A"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Donor: {d.owner?.name} • {d.owner?.city}{" "}
                    {d.owner?.pincode && `- ${d.owner.pincode}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRequestDonation(d._id)}
                  disabled={actionLoadingId === d._id}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
                >
                  {actionLoadingId === d._id ? "Requesting..." : "Request"}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* My Donations tab */}
        {tab === "my" && !loading && (
          <div className="space-y-3">
            {myDonations.length === 0 && (
              <p className="text-slate-500 text-sm">
                You haven't marked any medicines as donatable yet.
              </p>
            )}
            {myDonations.map((d) => (
              <div
                key={d._id}
                className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-slate-100"
              >
                <div>
                  <p className="font-semibold text-slate-800">
                    {d.medicine?.name}{" "}
                    {d.medicine?.brand && (
                      <span className="text-slate-500">
                        ({d.medicine.brand})
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">
                    Status:{" "}
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        d.status === "AVAILABLE"
                          ? "bg-green-100 text-green-700"
                          : d.status === "ACCEPTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {d.status}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Requests tab */}
        {tab === "requests" && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sent */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                My Sent Requests
              </h3>
              <div className="space-y-3">
                {sentRequests.length === 0 && (
                  <p className="text-slate-500 text-xs">
                    You haven&apos;t requested any donations yet.
                  </p>
                )}
                {sentRequests.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white rounded-xl shadow-sm p-3 border border-slate-100 mb-3"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {r.donation?.medicine?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Status:{" "}
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.status === "ACCEPTED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </p>
                    
                    {/* show contact if accepted */}
    {r.status === "ACCEPTED" && r.donation?.owner && (
      <div className="mt-3 p-3 border rounded-lg bg-slate-50">
        <p className="text-sm font-medium text-slate-800">
          Donor Contact
        </p>
        <p className="text-xs text-slate-600">
          {r.donation.owner.name} • {r.donation.owner.city || ""}
          {r.donation.owner.pincode ? ` - ${r.donation.owner.pincode}` : ""}
        </p>
        <p className="text-xs text-slate-600">Phone: {r.donation.owner.phone || "N/A"}</p>
        <p className="text-xs text-slate-600">Email: {r.donation.owner.email || "N/A"}</p>
        <p className="text-xs text-slate-500 mt-2">
          Please contact the donor to arrange pickup.{" "}
        </p>
      </div>
    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Received */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">
                Requests On My Donations
              </h3>
              <div className="space-y-3">
                {receivedRequests.length === 0 && (
                  <p className="text-slate-500 text-xs">
                    No one has requested your donations yet.
                  </p>
                )}
                {receivedRequests.map((r) => (
                  <div
                    key={r._id}
                    className="bg-white rounded-xl shadow-sm p-3 border border-slate-100"
                  >
                    <p className="text-sm font-semibold text-slate-800">
                      {r.donation?.medicine?.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Requester: {r.requester?.name}
                    </p>
                    <p className="text-xs text-slate-500 mb-2">
                      Status:{" "}
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : r.status === "ACCEPTED"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </p>

                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleUpdateRequest(r._id, "ACCEPTED")
                          }
                          disabled={actionLoadingId === r._id}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60"
                        >
                          {actionLoadingId === r._id
                            ? "Updating..."
                            : "Accept"}
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateRequest(r._id, "REJECTED")
                          }
                          disabled={actionLoadingId === r._id}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60"
                        >
                          {actionLoadingId === r._id
                            ? "Updating..."
                            : "Reject"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
