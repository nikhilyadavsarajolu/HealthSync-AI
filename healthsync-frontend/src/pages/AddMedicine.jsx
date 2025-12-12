import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axiosClient";

export default function AddMedicine() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    brand: "",
    quantity: 1,
    expiryDate: "",
    isSealed: true,
  });
  const [imageFile, setImageFile] = useState(null); // fixed name
  const [scanLoading, setScanLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleScan = async () => {
    if (!imageFile) {
      alert("Choose an image first");
      return;
    }
    setScanLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("image", imageFile);

      const res = await api.post("/ai/scan-medicine", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { data, source } = res.data;
      console.log("AI response", res.data);

      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        brand: data.brand || prev.brand,
        expiryDate: data.expiry || prev.expiryDate,
      }));

      if (source === "fallback") {
        alert("Could not read details, please fill manually.");
      } else {
        alert("Scanned successfully!");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to scan image");
    } finally {
      setScanLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await api.post("/medicines", form);
      navigate("/medicines");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Error adding medicine");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-start justify-center py-10 px-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Add Medicine
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Upload a picture to auto-fill details, or fill the form manually.
        </p>

        {error && (
          <p className="text-sm text-red-500 border border-red-200 bg-red-50 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {/* AI Scan Section */}
        <div className="mb-6 border border-dashed border-slate-300 rounded-xl p-4 bg-slate-50">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Image for AI Scan (optional)
          </label>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0] || null)}
              className="w-full text-sm text-slate-700 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="button"
              onClick={handleScan}
              disabled={scanLoading}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {scanLoading ? "Scanning..." : "Scan with AI"}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tip: Upload a clear photo of the medicine strip or box.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-700">Name</label>
            <input
              name="name"
              placeholder="e.g. Paracetamol"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-700">Brand</label>
            <input
              name="brand"
              placeholder="e.g. Calpol"
              value={form.brand}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-slate-700">
                Quantity
              </label>
              <input
                name="quantity"
                type="number"
                min="1"
                placeholder="Quantity"
                value={form.quantity}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-slate-700">
                Expiry Date
              </label>
              <input
                name="expiryDate"
                type="date"
                value={form.expiryDate}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 mt-2">
            <input
              type="checkbox"
              name="isSealed"
              checked={form.isSealed}
              onChange={handleChange}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700">
              Sealed / Unopened package
            </span>
          </label>

          <button
            type="submit"
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Save Medicine
          </button>
        </form>
      </div>
    </div>
  );
}
