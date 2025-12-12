import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Medicines from "./pages/Medicines";
import AddMedicine from "./pages/AddMedicine";
import Donations from "./pages/Donations"

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
      path="/"
      element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      }
      />
      <Route
      path="/medicines"
      element={
        <PrivateRoute>
          <Medicines />
        </PrivateRoute>
      }
      />
      <Route
      path="/medicines/add"
      element={
        <PrivateRoute>
          <AddMedicine />
        </PrivateRoute>
      }
      />
      <Route
      path="/donations"
      element={
        <PrivateRoute>
          <Donations />
        </PrivateRoute>
      }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
