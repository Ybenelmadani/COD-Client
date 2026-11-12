import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { api, ApiError, errKey } from "../lib/api.js";

export default function ResetPassword() {
  const { t } = useI18n();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    if (password.length < 8) { setError("error.invalid_input"); return; }
    setLoading(true);
    setError(null);
    try {
      await api.resetPassword({ token, password });
      setDone(true);
      setTimeout(() => nav("/login", { replace: true }), 1500);
    } catch (e) {
      setError(e instanceof ApiError ? errKey(e.code) : "error.network");
    } finally { setLoading(false); }
  }

  return (
    <div className="auth">
      <h1>{t("auth.resetTitle")}</h1>
      <div className="sub">{t("auth.resetDesc")}</div>

      {done ? (
        <div className="banner success">{t("auth.resetOk")}</div>
      ) : (
        <>
          {error && <div className="banner error">{t(error)}</div>}
          <form onSubmit={submit}>
            <div className="field">
              <label>{t("auth.password")}</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            <button className="btn btn-primary btn-block btn-lg" disabled={loading || !token}>
              {loading ? <span className="spin">↻</span> : t("auth.resetSubmit")}
            </button>
          </form>
        </>
      )}

      <div className="switch">
        <Link to="/login" className="link">{t("auth.forgotBack")}</Link>
      </div>
    </div>
  );
}
