import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, errKey, ApiError } from "../lib/api.js";

export default function Signup() {
  const { t } = useI18n();
  const { login } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ shopName: "", email: "", password: "", whatsapp: "", acceptTerms: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const emailRef = useRef(null);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await api.signup(form);
      login(r.token, r.user);
      nav("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.code === "email_taken") setError("error.email_taken");
        else if (e.code === "terms_required") setError("error.terms_required");
        else setError("error.invalid_input");
      } else setError("error.network");
    } finally { setLoading(false); }
  }

  return (
    <div className="auth">
      <h1>{t("auth.signup")}</h1>
      <div className="sub">{t("auth.signupSub")}</div>

      {error && <div className="banner error">{t(error)}</div>}

      <form onSubmit={submit}>
        <div className="field">
          <label>{t("auth.shopName")}</label>
          <input value={form.shopName} onChange={(e) => set("shopName", e.target.value)} required />
        </div>
        <div className="field">
          <label>{t("auth.email")}</label>
          <input type="email" ref={emailRef} value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </div>
        <div className="field">
          <label>{t("auth.password")}</label>
          <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} required minLength={8} />
        </div>
        <div className="field">
          <label>{t("auth.whatsapp")} <span className="muted">({t("common.optional")})</span></label>
          <input type="tel" inputMode="numeric" value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} dir="ltr" placeholder="06XXXXXXXX" />
        </div>
        <label className="checkbox mb">
          <input type="checkbox" checked={form.acceptTerms} onChange={(e) => set("acceptTerms", e.target.checked)} required />
          <span>
            {t("auth.acceptTerms")} <Link to="/terms" className="link">{t("terms.title")}</Link>
          </span>
        </label>

        <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? <span className="spin">↻</span> : t("auth.signup")}
        </button>
      </form>

      <div className="badge-trial">🎁 {t("auth.signupSub")}</div>
      <div className="switch">
        {t("auth.haveAccount")} <Link to="/login" className="link">{t("auth.loginLink")}</Link>
      </div>
    </div>
  );
}
