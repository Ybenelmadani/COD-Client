import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";

export default function VerifyEmail() {
  const { t } = useI18n();
  const { token, user, refresh } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const tokenParam = params.get("token") || "";

  const [status, setStatus] = useState(tokenParam ? "verifying" : "idle"); // verifying | ok | error | idle
  const [error, setError] = useState(null);

  // Vérification automatique si on arrive avec ?token=...
  useEffect(() => {
    if (!tokenParam) return;
    let done = false;
    (async () => {
      try {
        await api.verifyEmail(tokenParam);
        if (!done) { setStatus("ok"); refresh(); setTimeout(() => nav("/dashboard", { replace: true }), 1200); }
      } catch (e) {
        if (!done) { setStatus("error"); setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
      }
    })();
    return () => { done = true; };
  }, [tokenParam]);

  async function resend() {
    setError(null);
    try {
      await api.resendVerification(token);
      setStatus("idle");
    } catch (e) {
      setError(e instanceof ApiError ? errKey(e.code) : "error.network");
    }
  }

  if (status === "ok") {
    return (
      <div className="auth">
        <div style={{ textAlign: "center", fontSize: "3rem", marginBottom: 10 }}>✓</div>
        <h1 className="center">{t("auth.verifyTitle")}</h1>
        <div className="banner success mt">{t("auth.verifyOk")}</div>
      </div>
    );
  }

  if (status === "verifying") {
    return <div className="auth"><h1 className="center">{t("auth.verifyPending")}</h1></div>;
  }

  return (
    <div className="auth">
      <h1>{t("auth.verifyTitle")}</h1>
      <div className="banner trial">{t("auth.verifyBanner")}</div>

      {status === "error" && error && <div className="banner error">{t(error)}</div>}
      {error && !tokenParam && <div className="banner error">{t(error)}</div>}

      <div className="row mt-lg">
        <button className="btn btn-primary" onClick={() => nav("/dashboard")} disabled={!token}>
          {t("notfound.dash")}
        </button>
        <button className="btn" onClick={resend} disabled={!token}>
          {t("auth.verifyResend")}
        </button>
      </div>
    </div>
  );
}
