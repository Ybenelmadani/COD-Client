import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function ProtectedRoute({ children, allowExpired = false }) {
  const { user, token, loading } = useAuth();
  const loc = useLocation();

  if (loading) return <div className="loading">…</div>;
  if (!token || !user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;

  // Plan expiré : rediriger vers le paywall sauf si la page l'accepte (paywall, settings)
  const expired =
    user.plan === "expired" ||
    (user.plan === "trial" && user.daysLeft <= 0);

  if (expired && !allowExpired && !user.isAdmin) {
    return <Navigate to="/paywall" replace />;
  }

  return children;
}
