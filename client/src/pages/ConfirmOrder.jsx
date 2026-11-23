import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { api, ApiError, errKey } from "../lib/api.js";

export default function ConfirmOrder() {
  const { t } = useI18n();
  const { token } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.publicConfirmation(token).then(setOrder).catch((e) => {
      setError(e instanceof ApiError ? errKey(e.code) : "error.network");
    });
  }, [token]);

  async function respond(action) {
    setSending(true); setError(null);
    try { setOrder(await api.respondConfirmation(token, action)); }
    catch (e) { setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
    finally { setSending(false); }
  }

  if (error) return <div className="auth"><div className="banner error">{t(error)}</div></div>;
  if (!order) return <div className="auth"><div className="loading">{t("common.loading")}</div></div>;

  const waiting = order.status === "awaiting_confirmation";
  return (
    <div className="auth" style={{ paddingTop: 36 }}>
      <h1 className="center">{t("confirmation.title")}</h1>
      <p className="sub center">{t("confirmation.from", { shop: order.shopName })}</p>
      <div className="card" style={{ marginTop: 20 }}>
        {order.customerName && <div className="between mb"><span>{t("confirmation.customer")}</span><strong>{order.customerName}</strong></div>}
        {order.city && <div className="between mb"><span>{t("confirmation.city")}</span><strong>{order.city}</strong></div>}
        <div className="between"><span>{t("confirmation.amount")}</span><strong dir="ltr">{order.amount} MAD</strong></div>
      </div>
      {waiting ? <>
        <p className="center mt">{t("confirmation.question")}</p>
        <button className="btn btn-primary btn-block btn-lg" disabled={sending} onClick={() => respond("confirmed")}>{t("confirmation.confirm")}</button>
        <button className="btn btn-block mt" disabled={sending} onClick={() => respond("cancelled")} style={{ color: "var(--red)" }}>{t("confirmation.cancel")}</button>
      </> : <div className={`banner ${order.status === "confirmed" ? "success" : "trial"} mt`}>
        {t(order.status === "confirmed" ? "confirmation.confirmed" : "confirmation.cancelled")}
      </div>}
    </div>
  );
}
