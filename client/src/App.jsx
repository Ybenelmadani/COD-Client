import { Routes, Route } from "react-router-dom";
import { useAuth } from "./lib/auth.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Layout from "./components/Layout.jsx";

import Landing from "./pages/Landing.jsx";
import Signup from "./pages/Signup.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import VerifyEmail from "./pages/VerifyEmail.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Check from "./pages/Check.jsx";
import Orders from "./pages/Orders.jsx";
import NewOrder from "./pages/NewOrder.jsx";
import Settings from "./pages/Settings.jsx";
import Paywall from "./pages/Paywall.jsx";
import Terms from "./pages/Terms.jsx";
import Privacy from "./pages/Privacy.jsx";
import Admin from "./pages/Admin.jsx";
import NotFound from "./pages/NotFound.jsx";

function Shell({ children }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/paywall" element={<Paywall />} />

      <Route path="/dashboard" element={<Shell><Dashboard /></Shell>} />
      <Route path="/dashboard/check" element={<Shell><Check /></Shell>} />
      <Route path="/dashboard/orders" element={<Shell><Orders /></Shell>} />
      <Route path="/dashboard/orders/new" element={<Shell><NewOrder /></Shell>} />
      <Route path="/dashboard/settings" element={<Shell allowExpired><Settings /></Shell>} />

      <Route path="/admin" element={<Shell><Admin /></Shell>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
