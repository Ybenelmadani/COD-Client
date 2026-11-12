import { NavLink, Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import LanguageSwitch from "./LanguageSwitch.jsx";
import Notifications from "./Notifications.jsx";

export default function Layout({ children }) {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/dashboard" className="shop">
          {user?.shopName || t("app.name")}
          {user?.plan === "trial" && (
            <small>{t("dash.trialLeft", { n: user.daysLeft })}</small>
          )}
        </Link>
        <div className="topbar-right">
          <Notifications />
          <LanguageSwitch />
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottomnav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">🏠</span>
          <span>{t("nav.home")}</span>
        </NavLink>
        <NavLink to="/dashboard/check" className={({ isActive }) => (isActive ? "active check-btn" : "check-btn")}>
          <span className="icon">✅</span>
          <span>{t("nav.check")}</span>
        </NavLink>
        <NavLink to="/dashboard/orders" className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">📦</span>
          <span>{t("nav.orders")}</span>
        </NavLink>
        <NavLink to="/dashboard/settings" className={({ isActive }) => (isActive ? "active" : "")}>
          <span className="icon">⚙️</span>
          <span>{t("nav.settings")}</span>
        </NavLink>
      </nav>
    </div>
  );
}
