import { useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { api } from "../lib/api.js";

export default function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      // On affiche toujours le même message (sécurité : ne pas révéler si l'email existe)
      setSent(true);
    } catch {
      setSent(true);
    } finally { setLoading(false); }
  }

  return (
    <div className="auth">
      <h1>{t("auth.forgotTitle")}</h1>
      <div className="sub">{t("auth.forgotDesc")}</div>

      {sent ? (
        <>
          <div className="banner success">{t("auth.forgotSent")}</div>
          <Link to="/login" className="btn btn-block">{t("auth.forgotBack")}</Link>
        </>
      ) : (
        <form onSubmit={submit}>
          <div className="field">
            <label>{t("auth.email")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <span className="spin">↻</span> : t("auth.forgotTitle")}
          </button>
        </form>
      )}

      <div className="switch">
        <Link to="/login" className="link">{t("auth.forgotBack")}</Link>
      </div>
    </div>
  );
}
