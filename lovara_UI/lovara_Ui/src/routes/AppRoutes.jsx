import { Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import Home from "../pages/public/home";
import VendorDashboard from "../pages/staff/staffDashboard";
import VendorWorkDetail from "../pages/staff/VendorWorkDetail";
import UserDashboard from "../pages/user/UserDashboard";
import WorkDetail from "../pages/user/WorkDetail";
import AISearch from "../pages/user/AISearch";
import AdminDashboard from "../pages/admin/adminDashboard";
import ProtectedRoute from "../components/ProtectedRoute";

export default function AppRoutes({ notifHistory, clearHistory }) {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* User / Client Routes */}
      <Route element={<ProtectedRoute allowedRoles={["CLIENT", "USER"]} />}>
        <Route path="/user" element={<UserDashboard notifHistory={notifHistory} clearHistory={clearHistory} />} />
        <Route path="/work/:id" element={<WorkDetail />} />
        <Route path="/user/ai-search" element={<AISearch />} />
      </Route>

      {/* Vendor / Staff Routes */}
      <Route element={<ProtectedRoute allowedRoles={["STAFF", "VENDOR", "ARTISAN"]} />}>
        <Route path="/vendor" element={<VendorDashboard notifHistory={notifHistory} clearHistory={clearHistory} />} />
        <Route path="/vendor/work/:id" element={<VendorWorkDetail />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminDashboard notifHistory={notifHistory} clearHistory={clearHistory} />} />
      </Route>

      {/* Catch All - Redirect to login or home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
