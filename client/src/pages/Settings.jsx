import { useEffect, useState } from "react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import { buildWhatsAppLink } from "../lib/whatsapp.js";

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const { user, token, refresh } = useAuth();

  const [profile, setProfile] = useState({ shopName: "", whatsapp: "", city: "", returnCost: 40, language: "ar" });
  const [templates, setTemplates] = useState([]);
  const [stats, setStats] = useState(null);
  const [savedMsg, setSavedMsg] = useState(null);
  const [error, setError] = useState(null);

  // Modèle en cours d'édition / création
  const [editing, setEditing] = useState(null); // { _id?, name, body, isDefault }

  useEffect(() => {
    Promise.all([api.getTemplates(token), api.stats(token)])
      .then(([tpls, s]) => { setTemplates(tpls); setStats(s); })
      .catch(() => {});
  }, [token]);

  useEffect(() => {
    if (user) {
      setProfile({
        shopName: user.shopName || "",
        whatsapp: user.whatsapp || "",
        city: user.city || "",
        returnCost: user.returnCost ?? 40,
        language: user.language || "ar",
      });
    }
  }, [user]);

  function setP(k, v) { setProfile((p) => ({ ...p, [k]: v })); }

  async function saveProfile(e) {
    e.preventDefault();
    setError(null); setSavedMsg(null);
    try {
      await api.updateMe(profile, token);
      if (profile.language !== lang) setLang(profile.language);
      refresh();
      setSavedMsg("settings.savedOk");
    } catch (e) { setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
  }

  function preview(body) {
    return (body || "")
      .replace(/\{nom\}/g, "أحمد / Ahmed")
      .replace(/\{montant\}/g, "250")
      .replace(/\{ville\}/g, "Casablanca")
      .replace(/\{boutique\}/g, profile.shopName || "MyShop");
  }

  async function saveTemplate() {
    if (!editing.name || !editing.body) return;
    try {
      if (editing._id) {
        await api.updateTemplate(editing._id, editing, token);
      } else {
        const created = await api.createTemplate(editing, token);
        setTemplates((p) => [...p, created]);
        setEditing(null);
        return;
      }
      const tpls = await api.getTemplates(token);
      setTemplates(tpls);
      setEditing(null);
    } catch (e) { setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
  }

  async function delTemplate(id) {
    if (!confirm(t("common.delete") + " ?")) return;
    try {
      await api.deleteTemplate(id, token);
      setTemplates((p) => p.filter((x) => x._id !== id));
    } catch {}
  }

  async function setDefault(id) {
    try {
      await api.updateTemplate(id, { isDefault: true }, token);
      const tpls = await api.getTemplates(token);
      setTemplates(tpls);
    } catch {}
  }

  const paidLink = buildWhatsAppLink("0600000000", t("settings.paidMsg", { email: user?.email || "" }), {});

  return (
    <div>
      <h1 className="mb" style={{ fontSize: "1.3rem" }}>{t("nav.settings")}</h1>

      {error && <div className="banner error">{t(error)}</div>}
      {savedMsg && <div className="banner success">{t(savedMsg)}</div>}

      {/* Ma boutique */}
      <div className="settings-section">
        <h2>{t("settings.shop")}</h2>
        <form onSubmit={saveProfile} className="card">
          <div className="field">
            <label>{t("settings.shopName")}</label>
            <input value={profile.shopName} onChange={(e) => setP("shopName", e.target.value)} />
          </div>
          <div className="field">
            <label>{t("settings.whatsapp")}</label>
            <input type="tel" dir="ltr" value={profile.whatsapp} onChange={(e) => setP("whatsapp", e.target.value)} placeholder="06XXXXXXXX" />
          </div>
          <div className="field">
            <label>{t("settings.city")}</label>
            <input value={profile.city} onChange={(e) => setP("city", e.target.value)} />
          </div>
          <div className="field">
            <label>{t("settings.returnCost")}</label>
            <input type="number" inputMode="numeric" min="0" dir="ltr" value={profile.returnCost} onChange={(e) => setP("returnCost", Number(e.target.value))} />
            <div className="hint">🛈 {t("dash.savedSub")}</div>
          </div>
          <div className="field">
            <label>{t("settings.language")}</label>
            <select value={profile.language} onChange={(e) => setP("language", e.target.value)}>
              <option value="ar">العربية</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <button className="btn btn-primary btn-block">{t("common.save")}</button>
        </form>
      </div>

      {/* Modèles WhatsApp */}
      <div className="settings-section">
        <h2>{t("settings.templates")}</h2>
        <div className="muted" style={{ fontSize: ".85rem", marginBottom: 10 }}>{t("settings.templatesHelp")}</div>

        {templates.map((tpl) => (
          <div className="template-item" key={tpl._id}>
            <div className="row">
              <div>
                <div className="name">{tpl.name} {tpl.isDefault && <span className="chip" style={{ background: "var(--green-bg)", color: "var(--green)" }}>{t("settings.templateDefault")}</span>}</div>
                <div className="body">{tpl.body}</div>
              </div>
            </div>
            <div className="actions mt">
              <button className="btn" style={{ fontSize: ".82rem", padding: "6px 10px" }} onClick={() => setEditing({ ...tpl })}>{t("common.edit")}</button>
              {!tpl.isDefault && <button className="btn" style={{ fontSize: ".82rem", padding: "6px 10px" }} onClick={() => setDefault(tpl._id)}>{t("settings.templateDefault")}</button>}
              <button className="btn" style={{ fontSize: ".82rem", padding: "6px 10px", color: "var(--red)" }} onClick={() => delTemplate(tpl._id)}>{t("common.delete")}</button>
            </div>
          </div>
        ))}

        <button className="btn btn-block mt" onClick={() => setEditing({ name: "", body: "", isDefault: false })}>＋ {t("settings.newTemplate")}</button>

        {editing && (
          <div className="card mt">
            <div className="field">
              <label>{t("settings.templateName")}</label>
              <input value={editing.name} onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>{t("settings.templateBody")}</label>
              <textarea rows={3} value={editing.body} onChange={(e) => setEditing((p) => ({ ...p, body: e.target.value }))} />
            </div>
            <label className="checkbox mb">
              <input type="checkbox" checked={editing.isDefault} onChange={(e) => setEditing((p) => ({ ...p, isDefault: e.target.checked }))} />
              <span>{t("settings.templateDefault")}</span>
            </label>
            <div className="section-title" style={{ marginTop: 8 }}>{t("settings.preview")}</div>
            <div className="preview-box mb">{preview(editing.body)}</div>
            <div className="row">
              <button className="btn btn-primary" onClick={saveTemplate}>{t("common.save")}</button>
              <button className="btn" onClick={() => setEditing(null)}>{t("common.cancel")}</button>
            </div>
          </div>
        )}
      </div>

      {/* Abonnement */}
      <div className="settings-section">
        <h2>{t("settings.subscription")}</h2>
        <div className="card">
          <div className="between mb">
            <span>{t("settings.plan")}</span>
            <span className={`chip ${user?.plan}`} style={{
              background: user?.plan === "paid" ? "var(--green-bg)" : user?.plan === "trial" ? "var(--orange-bg)" : "var(--red-bg)",
              color: user?.plan === "paid" ? "var(--green)" : user?.plan === "trial" ? "var(--orange)" : "var(--red)",
            }}>{t(`settings.plan.${user?.plan}`)}</span>
          </div>
          {user?.plan === "trial" && (
            <div className="meta muted" style={{ fontSize: ".85rem", marginBottom: 8 }}>
              {t("settings.trialEnds")}: {new Date(user.trialEndsAt).toLocaleDateString()}
            </div>
          )}
          {user?.paidUntil && (
            <div className="meta muted" style={{ fontSize: ".85rem", marginBottom: 8 }}>
              {t("settings.paidUntil")}: {new Date(user.paidUntil).toLocaleDateString()}
            </div>
          )}
          <div className="muted" style={{ fontSize: ".9rem", marginBottom: 10 }}>{t("settings.price")}</div>
          <div className="banner trial" style={{ marginBottom: 10 }}>{t("settings.payInstructions")}</div>
          <div className="card" style={{ background: "var(--gray-bg)", padding: 10, marginBottom: 10, fontSize: ".9rem" }}>
            RIB: <strong dir="ltr">000 000 0000000000000000 00</strong><br />
            CashPlus: <strong dir="ltr">06XXXXXXXX</strong>
          </div>
          {paidLink && (
            <a href={paidLink} target="_blank" rel="noopener" className="btn btn-primary btn-block">💬 {t("settings.paid")}</a>
          )}
        </div>
      </div>
    </div>
  );
}
