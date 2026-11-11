import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import PhoneInput from "../components/PhoneInput.jsx";
import { normalizePhone, buildWhatsAppLink } from "../lib/whatsapp.js";

export default function Check() {
  const { t } = useI18n();
  const { token } = useAuth();
  const nav = useNavigate();

  const [phone, setPhone] = useState("");
  const [result, setResult] = useState(null);   // { risk, delivered, refused, no_answer, known }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [recent, setRecent] = useState([]); // { hint, risk } — jamais le numéro en clair
  const lastPhone = useRef("");

  async function submit(e) {
    e?.preventDefault();
    const norm = normalizePhone(phone);
    if (!norm) { setError("error.invalid_phone"); return; }
    setLoading(true);
    setError(null);
    setResult(null);
    lastPhone.current = norm;
    try {
      const r = await api.check(norm, token);
      setResult(r);
      // Historique session : on ne stocke que l'indice + le risque
      setRecent((prev) => [{ hint: "*".repeat(norm.length - 3) + norm.slice(-3), risk: r.risk }, ...prev].slice(0, 5));
    } catch (e) {
      if (e instanceof ApiError) {
        setError(errKey(e.code));
        if (e.status === 402) { setTimeout(() => nav("/paywall"), 800); }
      } else setError("error.network");
    } finally { setLoading(false); }
  }

  function addOrder() {
    nav("/dashboard/orders/new", { state: { phone: lastPhone.current, risk: result?.risk } });
  }

  function contactW() {
    // On n'a pas le nom/ville ici : message générique
    const link = buildWhatsAppLink(lastPhone.current, t("check.contactW") + " ?", {});
    if (link) window.open(link, "_blank", "noopener");
  }

  async function cancelOrder() {
    try {
      await api.createOrder({ phone: lastPhone.current, status: "cancelled", risk: result?.risk }, token);
      nav("/dashboard/orders");
    } catch (e) {
      setError(e instanceof ApiError ? errKey(e.code) : "error.network");
    }
  }

  return (
    <div>
      <h1 className="mb" style={{ fontSize: "1.3rem" }}>{t("check.title")}</h1>

      <form onSubmit={submit}>
        <PhoneInput value={phone} onChange={setPhone} big placeholder="06XXXXXXXX" />
        <button className="btn btn-primary btn-block btn-lg" disabled={loading || !normalizePhone(phone)}>
          {loading ? <span className="spin">↻</span> : t("check.button")}
        </button>
      </form>

      {error && <div className="banner error mt">{t(error)}</div>}

      {result && (
        <>
          <div className={`risk-result ${result.risk}`}>
            <div className="label">
              {result.risk === "good" && "✓ "}
              {result.risk === "new" && "? "}
              {result.risk === "medium" && "! "}
              {result.risk === "high" && "✕ "}
              {t(`risk.${result.risk}`)}
            </div>
            <div className="detail">
              {result.risk === "good" && t("risk.good.detail", { n: result.delivered })}
              {result.risk === "new" && t("risk.new.detail")}
              {result.risk === "medium" && t("risk.medium.detail", { n: result.refused })}
              {result.risk === "high" && t("risk.high.detail", { n: result.refused })}
            </div>
          </div>

          <div className="stat-grid mt">
            <Stat label={t("check.delivered")} value={result.delivered} color="green" />
            <Stat label={t("check.refused")} value={result.refused} color="red" />
            <Stat label={t("check.noanswer")} value={result.no_answer} color="orange" />
            <Stat label={t("app.name")} value={result.total} color="gray" />
          </div>

          <div className="row mt">
            <button className="btn btn-primary" onClick={addOrder}>＋ {t("check.addOrder")}</button>
            <button className="btn" onClick={contactW}>💬 {t("check.contactW")}</button>
          </div>
          {(result.risk === "high" || result.risk === "medium") && (
            <button className="btn btn-block mt" onClick={cancelOrder} style={{ color: "var(--red)" }}>
              ✕ {t("check.cancelOrder")}
            </button>
          )}
        </>
      )}

      <div className="reassure">🔒 {t("check.reassure")}</div>

      {recent.length > 0 && (
        <div className="recent">
          <div className="section-title" style={{ marginTop: 0 }}>{t("check.recent")}</div>
          {recent.map((r, i) => (
            <div className="recent-item" key={i}>
              <span dir="ltr">{r.hint}</span>
              <span className={`risk ${r.risk}`} style={{ fontSize: ".75rem", padding: "2px 8px" }}>
                {t(`risk.${r.risk}`)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="stat" style={{ textAlign: "center" }}>
      <div className="num" style={{
        color: color === "green" ? "var(--green)" : color === "red" ? "var(--red)" : color === "orange" ? "var(--orange)" : "var(--gray)",
        fontSize: "1.4rem",
      }}>{value}</div>
      <div className="lbl">{label}</div>
    </div>
  );
}
