import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import EmptyState from "../components/EmptyState.jsx";
import StatusSelect from "../components/StatusSelect.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

const FILTERS = ["all", "pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"];

export default function Orders() {
  const { t } = useI18n();
  const { token } = useAuth();
  const [orders, setOrders] = useState(null);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  const params = { status: filter, q, city, from, to };

  useEffect(() => {
    setOrders(null);
    api.getOrders(params, token)
      .then(setOrders)
      .catch((e) => setError(e instanceof ApiError ? errKey(e.code) : "error.network"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filter, q, city, from, to]);

  async function exportCsv() {
    setExporting(true);
    try {
      // On passe par fetch directement pour récupérer le CSV en texte
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "" && v !== "all") sp.set(k, v);
      });
      const res = await fetch("/api/orders/export?" + sp.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commandes-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("error.unknown");
    } finally { setExporting(false); }
  }

  function clearFilters() {
    setCity(""); setFrom(""); setTo(""); setQ(""); setFilter("all");
  }

  if (error) return (
    <div>
      <div className="banner error">{t(error)}</div>
      <button className="btn btn-block" onClick={() => window.location.reload()}>{t("common.retry")}</button>
    </div>
  );
  if (!orders) return <div className="loading">{t("common.loading")}</div>;

  const hasFilters = city || from || to;

  return (
    <div>
      <div className="between mb">
        <h1 style={{ fontSize: "1.3rem" }}>{t("orders.title")}</h1>
        <div className="row" style={{ flex: "none" }}>
          <button className="btn" style={{ padding: "8px 12px" }} onClick={exportCsv} disabled={exporting || !orders.length}>
            {exporting ? <span className="spin">↻</span> : "📊 " + t("orders.export")}
          </button>
          <Link to="/dashboard/orders/new" className="btn btn-primary" style={{ padding: "8px 14px" }}>＋</Link>
        </div>
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

          <button className="btn btn-block mb" style={{ fontSize: ".85rem", padding: "8px 12px" }} onClick={() => setShowFilters((s) => !s)}>
            {t("orders.filterDate")} {hasFilters && `· ${t("orders.clearFilters")}`}
          </button>

          {showFilters && (
            <div className="card mb" style={{ padding: 12 }}>
              <div className="field" style={{ marginBottom: 10 }}>
                <label>{t("orders.filterCity")}</label>
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Casablanca" style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 8 }} />
              </div>
              <div className="row">
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>{t("orders.from")}</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8 }} />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label>{t("orders.to")}</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8 }} />
                </div>
              </div>
              {hasFilters && (
                <button className="btn btn-block mt" style={{ fontSize: ".85rem" }} onClick={clearFilters}>{t("orders.clearFilters")}</button>
              )}
            </div>
          )}

          <div className="tabs">
            {FILTERS.map((f) => (
              <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>
                {f === "all" ? t("status.all") : t(`status.${f}`)}
              </button>
            ))}
          </div>

          <div className="muted mb" style={{ fontSize: ".8rem" }}>{t("orders.results", { n: orders.length })}</div>

          {orders.length === 0 ? (
            <div className="card center muted">—</div>
          ) : (
            orders.map((o) => <OrderCard key={o._id} order={o} token={token} t={t} />)
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
