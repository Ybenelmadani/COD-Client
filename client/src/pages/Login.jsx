import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError } from "../lib/api.js";

export default function Login() {
  const { t } = useI18n();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const r = await api.login(form);
      login(r.token, r.user);
      nav(loc.state?.from || "/dashboard", { replace: true });
    } catch (e) {
      if (e instanceof ApiError) setError("error.bad_credentials");
      else setError("error.network");
    } finally { setLoading(false); }
  }

  return (
    <div className="auth">
      <h1>{t("auth.login")}</h1>
      <div className="sub">{t("app.name")}</div>

      {error && <div className="banner error">{t(error)}</div>}

      <form onSubmit={submit}>
        <div className="field">
          <label>{t("auth.email")}</label>
          <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
        </div>
        <div className="field">
          <label>{t("auth.password")}</label>
          <input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? <span className="spin">↻</span> : t("auth.login")}
        </button>
      </form>

      <div className="switch">
        {t("auth.noAccount")} <Link to="/signup" className="link">{t("auth.signupLink")}</Link>
      </div>
      <div className="switch muted" style={{ marginTop: 10, fontSize: ".82rem" }}>
        <Link to="/forgot-password" className="link">{t("auth.forgotLink")}</Link>
      </div>
    </div>
  );
}

