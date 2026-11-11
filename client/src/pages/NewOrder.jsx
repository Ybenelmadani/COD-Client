import { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import PhoneInput from "../components/PhoneInput.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { normalizePhone, buildWhatsAppLink } from "../lib/whatsapp.js";

export default function NewOrder() {
  const { t } = useI18n();
  const { token, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState({
    phone: loc.state?.phone || "",
    name: "",
    city: "",
    amount: "",
  });
  const [risk, setRisk] = useState(loc.state?.risk || null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedId, setSavedId] = useState(null);
  const [error, setError] = useState(null);
  const [askW, setAskW] = useState(false);

  // Vérification auto du numéro si on n'a pas de risque prérempli
  useEffect(() => {
    if (risk) return; // déjà vérifié depuis Check
    const norm = normalizePhone(form.phone);
    if (!norm) { setRisk(null); return; }
    const id = setTimeout(async () => {
      try {
        const r = await api.check(norm, token);
        setRisk(r.risk);
      } catch {}
    }, 500);
    return () => clearTimeout(id);
  }, [form.phone, risk, token]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    const norm = normalizePhone(form.phone);
    if (!norm) { setError("error.invalid_phone"); return; }
    setLoading(true);
    setError(null);
    try {
      const o = await api.createOrder({
        phone: norm,
        name: form.name,
        city: form.city,
        amount: Number(form.amount) || 0,
        risk,
      }, token);
      setSaved(true);
      setSavedId(o._id);
      setAskW(true);
    } catch (e) {
      setError(e instanceof ApiError ? errKey(e.code) : "error.network");
    } finally { setLoading(false); }
  }

  function sendW() {
    const vars = {
      nom: form.name || "",
      montant: form.amount || 0,
      ville: form.city || "",
      boutique: user?.shopName || "",
    };
    const link = buildWhatsAppLink(form.phone, "Bonjour {nom}, votre commande de {montant} MAD chez {boutique} est prête. Confirmez-vous la livraison ?", vars);
    if (link) window.open(link, "_blank", "noopener");
    nav("/dashboard/orders");
  }

  if (saved) {
    return (
      <div className="center" style={{ paddingTop: 40 }}>
        <div style={{ fontSize: "3rem" }}>✓</div>
        <h1 style={{ margin: "10px 0" }}>{t("new.saved")}</h1>
        {risk && <RiskBadge risk={risk} big />}
        {askW && (
          <div className="mt-lg">
            <p className="mb">{t("new.confirmW")}</p>
            <div className="row">
              <button className="btn btn-primary" onClick={sendW}>💬 {t("new.yes")}</button>
              <button className="btn" onClick={() => nav("/dashboard/orders")}>{t("new.no")}</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="between mb">
        <h1 style={{ fontSize: "1.3rem" }}>{t("new.title")}</h1>
        <Link to="/dashboard/orders" className="btn-ghost">✕</Link>
      </div>

      {risk && (
        <div className="card center" style={{ padding: 12, marginBottom: 14 }}>
          <RiskBadge risk={risk} big />
        </div>
      )}
      {error && <div className="banner error">{t(error)}</div>}

      <form onSubmit={submit}>
        <PhoneInput value={form.phone} onChange={(v) => set("phone", v)} />
        <div className="field">
          <label>{t("new.name")}</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} />
        </div>
        <div className="field">
          <label>{t("new.city")}</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} />
        </div>
        <div className="field">
          <label>{t("new.amount")}</label>
          <input type="number" inputMode="numeric" min="0" value={form.amount} onChange={(e) => set("amount", e.target.value)} dir="ltr" />
        </div>
        <button className="btn btn-primary btn-block btn-lg" disabled={loading}>
          {loading ? <span className="spin">↻</span> : t("new.save")}
        </button>
      </form>
    </div>
  );
}
