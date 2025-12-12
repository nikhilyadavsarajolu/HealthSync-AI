import { Link } from "react-router-dom";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="max-w-5xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Welcome, {user.name}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
          <Link
            to="/medicines"
            className="p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition border border-slate-200"
          >
            <h3 className="text-xl font-semibold text-slate-700">
              My Medicines
            </h3>
            <p className="text-slate-500 mt-1 text-sm">
              View and manage your medicine inventory.
            </p>
          </Link>

          <Link
            to="/donations"
            className="p-6 bg-white shadow-md rounded-xl hover:shadow-lg transition border border-slate-200"
          >
            <h3 className="text-xl font-semibold text-slate-700">
              Donations
            </h3>
            <p className="text-slate-500 mt-1 text-sm">
              See nearby donation requests and donate medicines.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
