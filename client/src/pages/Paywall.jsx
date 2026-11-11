import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError } from "../lib/api.js";
import { buildWhatsAppLink } from "../lib/whatsapp.js";

export default function Paywall() {
  const { t } = useI18n();
  const { user, token, logout } = useAuth();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.stats(token).then(setStats).catch(() => {});
  }, [token]);

  // Si l'utilisateur est admin ou a un plan actif, rediriger
  useEffect(() => {
    if (user && user.isAdmin) nav("/dashboard", { replace: true });
  }, [user, nav]);

  if (!user) return null;

  const avoided = stats?.avoided || 0;
  const saved = stats?.savings || 0;
  const checks = user.checksCount || 0;

  const payLink = buildWhatsAppLink("0600000000", t("settings.paidMsg", { email: user.email || "" }), {});

  return (
    <div className="auth" style={{ paddingTop: 40 }}>
      <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: 10 }}>🔒</div>
      <h1 className="center">{t("paywall.title")}</h1>
      <p className="sub center">{t("paywall.sub")}</p>

      <div className="card center" style={{ marginTop: 20 }}>
        <div className="muted" style={{ marginBottom: 14 }}>{t("paywall.recap")}</div>
        <div className="stat-grid">
          <div className="stat">
            <div className="num" style={{ color: "var(--blue)" }}>{checks}</div>
            <div className="lbl">{t("paywall.checks")}</div>
          </div>
          <div className="stat">
            <div className="num" style={{ color: "var(--orange)" }}>{avoided}</div>
            <div className="lbl">{t("paywall.avoided")}</div>
          </div>
          <div className="stat featured">
            <div className="num">{saved} MAD</div>
            <div className="lbl">{t("paywall.saved")}</div>
          </div>
        </div>
      </div>

      <div className="card mt">
        <div className="banner trial">{t("settings.payInstructions")}</div>
        <div className="card" style={{ background: "var(--gray-bg)", padding: 10, marginBottom: 10, fontSize: ".9rem" }}>
          RIB: <strong dir="ltr">000 000 0000000000000000 00</strong><br />
          CashPlus: <strong dir="ltr">06XXXXXXXX</strong>
        </div>
        {payLink && (
          <a href={payLink} target="_blank" rel="noopener" className="btn btn-primary btn-block btn-lg">💬 {t("paywall.cta")}</a>
        )}
      </div>

      <button className="btn btn-block mt" onClick={() => { logout(); nav("/"); }}>
        {t("paywall.logout")}
      </button>
    </div>
  );
}
