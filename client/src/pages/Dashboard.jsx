import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import StatCard from "../components/StatCard.jsx";
import EmptyState from "../components/EmptyState.jsx";
import StatusSelect from "../components/StatusSelect.jsx";
import RiskBadge from "../components/RiskBadge.jsx";

export default function Dashboard() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.stats(token), api.getOrders(token)])
      .then(([s, o]) => { setStats(s); setOrders(o.slice(0, 8)); })
      .catch((e) => setError(e instanceof ApiError ? errKey(e.code) : "error.network"))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading">{t("common.loading")}</div>;
  if (error) return (
    <div>
      <div className="banner error">{t(error)}</div>
      <button className="btn btn-block" onClick={() => window.location.reload()}>{t("common.retry")}</button>
    </div>
  );

  const toTreat = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const finalTotal = (stats.counts.delivered || 0) + (stats.counts.refused || 0) + (stats.counts.no_answer || 0);
  const deliveryRate = finalTotal ? Math.round(((stats.counts.delivered || 0) / finalTotal) * 100) : 0;
  const refusalRate = finalTotal ? Math.round(((stats.counts.refused || 0) / finalTotal) * 100) : 0;
  const hasNoData = !orders.length;

  return (
    <div>
      {user.plan === "trial" && user.daysLeft <= 7 && (
        <Link to="/dashboard/settings" className="banner trial" style={{ display: "block" }}>
          {t("dash.trialLeft", { n: user.daysLeft })}
        </Link>
      )}

      <Link to="/dashboard/check" className="btn btn-primary btn-block btn-lg" style={{ marginTop: 0, marginBottom: 16 }}>
        ✅ {t("dash.checkCta")}
      </Link>

      <StatCard featured num={`${stats.month.savings} MAD`} lbl={t("dash.saved")} />

      <div className="stat-grid mt">
        <StatCard num={stats.month.orders} lbl={t("dash.monthOrders")} />
        <StatCard num={`${deliveryRate}%`} lbl={t("dash.deliveryRate")} />
        <StatCard num={`${refusalRate}%`} lbl={t("dash.refusalRate")} />
        <StatCard num={stats.counts.pending || 0} lbl={t("dash.pending")} />
      </div>

      <div className="section-title">{t("dash.totreat")}</div>
      {hasNoData ? (
        <EmptyState icon="🎯" title={t("dash.empty.title")} desc={t("dash.empty.desc")}>
          <Link to="/dashboard/check" className="btn btn-primary">{t("dash.empty.cta")}</Link>
        </EmptyState>
      ) : toTreat.length === 0 ? (
        <div className="card center muted">{t("dash.pending")}: 0</div>
      ) : (
        toTreat.map((o) => <OrderMini key={o._id} order={o} token={token} /> )
      )}

      <Link to="/dashboard/orders/new" className="btn btn-block mt">{t("dash.addOrder")}</Link>
    </div>
  );
}

function OrderMini({ order, token }) {
  const { t } = useI18n();
  const [status, setStatus] = useState(order.status);

  async function change(s) {
    try {
      const updated = await api.updateOrder(order._id, s, token);
      setStatus(updated.status);
    } catch {}
  }

  return (
    <div className="order-card">
      <div className="top">
        <div>
          <div className="name">{order.customerName || order.phoneHint}</div>
          <div className="meta">{order.city} · {order.phoneHint} · {order.amount} MAD</div>
        </div>
        {order.riskAtCreation && <RiskBadge risk={order.riskAtCreation} />}
      </div>
      <div className="actions">
        <StatusSelect value={status} onChange={change} compact />
      </div>
    </div>
  );
}
