import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusSelect from "../components/StatusSelect.jsx";
import RiskBadge from "../components/RiskBadge.jsx";
import { buildWhatsAppLink } from "../lib/whatsapp.js";

const FILTERS = ["all", "pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"];

export default function Orders() {
  const { t } = useI18n();
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getOrders(token)
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? errKey(e.code) : "error.network"));
  }, [token]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders.filter((o) => {
      if (filter !== "all" && o.status !== filter) return false;
      if (q) {
        const s = q.toLowerCase();
        return (o.customerName || "").toLowerCase().includes(s)
          || (o.city || "").toLowerCase().includes(s)
          || (o.phoneHint || "").includes(q.replace(/\D/g, ""));
      }
      return true;
    });
  }, [orders, filter, q]);

  if (error) return (
    <div>
      <div className="banner error">{t(error)}</div>
      <button className="btn btn-block" onClick={() => window.location.reload()}>{t("common.retry")}</button>
    </div>
  );
  if (!orders) return <div className="loading">{t("common.loading")}</div>;

  return (
    <div>
      <div className="between mb">
        <h1 style={{ fontSize: "1.3rem" }}>{t("orders.title")}</h1>
        <Link to="/dashboard/orders/new" className="btn btn-primary" style={{ padding: "8px 14px" }}>＋</Link>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="📦" title={t("orders.empty.title")} desc={t("orders.empty.desc")}>
          <Link to="/dashboard/orders/new" className="btn btn-primary">{t("dash.addOrder")}</Link>
        </EmptyState>
      ) : (
        <>
          <input
            className="mb"
            placeholder={t("orders.search")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10 }}
          />

          <div className="tabs">
            {FILTERS.map((f) => (
              <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                {f === "all" ? t("status.all") : t(`status.${f}`)}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="card center muted">—</div>
          ) : (
            filtered.map((o) => <OrderCard key={o._id} order={o} token={token} t={t} />)
          )}

          <div className="reassure" style={{ marginTop: 16 }}>🤝 {t("orders.help")}</div>
        </>
      )}
    </div>
  );
}

function OrderCard({ order, token, t }) {
  const [status, setStatus] = useState(order.status);
  const [err, setErr] = useState(null);

  async function change(s) {
    setErr(null);
    try {
      const updated = await api.updateOrder(order._id, s, token);
      setStatus(updated.status);
    } catch (e) {
      setErr("orders.updateErr");
    }
  }

  function whatsapp() {
    const vars = { nom: order.customerName || "", montant: order.amount || 0, ville: order.city || "", boutique: "" };
    // On n'a pas le nom de boutique ici ; on prend la template par défaut générique
    const link = buildWhatsAppLink(order.phoneHint?.replace(/\*/g, "") || "", "Bonjour {nom}", vars);
    // phoneHint est masqué : on ne peut pas reconstruire le lien sans le numéro complet.
    // → On ouvre wa.me sans numéro si non disponible (rare ici car on n'a que l'hint).
    if (link) window.open(link, "_blank", "noopener");
  }

  return (
    <div className="order-card">
      <div className="top">
        <div>
          <div className="name">{order.customerName || "—"}</div>
          <div className="meta">
            <span dir="ltr">{order.phoneHint}</span> · {order.city || "—"} · {order.amount || 0} MAD
          </div>
          <div className="meta">{new Date(order.createdAt).toLocaleDateString()}</div>
        </div>
        <div style={{ textAlign: "end" }}>
          {order.riskAtCreation && <RiskBadge risk={order.riskAtCreation} />}
          <div className="mt">
            <span className={`chip`} style={{
              background: status === "delivered" ? "var(--green-bg)" : status === "refused" ? "var(--red-bg)"
                : status === "cancelled" ? "var(--gray-bg)" : "var(--orange-bg)",
            }}>{t(`status.${status}`)}</span>
          </div>
        </div>
      </div>
      {err && <div className="err" style={{ marginTop: 8 }}>{t(err)}</div>}
      <div className="actions">
        <StatusSelect value={status} onChange={change} compact />
      </div>
    </div>
  );
}
