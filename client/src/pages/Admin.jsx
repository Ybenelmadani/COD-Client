import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api, ApiError, errKey } from "../lib/api.js";
import StatCard from "../components/StatCard.jsx";

export default function Admin() {
  const { t } = useI18n();
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  // Seul l'admin côté interface ; la route API vérifie aussi côté serveur.
  if (user && !user.isAdmin) return <Navigate to="/dashboard" replace />;

  async function load() {
    setError(null);
    try {
      const [d, a] = await Promise.all([api.adminUsers(token), api.adminAnalytics(token)]);
      setData(d); setAnalytics(a);
    } catch (e) { setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
  }

  useEffect(() => { if (user?.isAdmin) load(); }, [token, user]);

  async function act(id, body, label) {
    setActing(id + label);
    try {
      await api.adminUpdatePlan(id, body, token);
      await load();
    } catch (e) { setError(e instanceof ApiError ? errKey(e.code) : "error.network"); }
    finally { setActing(null); }
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = q.toLowerCase();
    return data.users.filter((u) => (u.email || "").toLowerCase().includes(s) || (u.shopName || "").toLowerCase().includes(s));
  }, [data, q]);

  if (error) return (
    <div>
      <div className="banner error">{t(error)}</div>
      <button className="btn btn-block" onClick={load}>{t("common.retry")}</button>
    </div>
  );
  if (!data) return <div className="loading">{t("common.loading")}</div>;

  return (
    <div>
      <h1 className="mb" style={{ fontSize: "1.3rem" }}>⚙️ {t("admin.title")}</h1>

      <div className="stat-grid mb">
        <StatCard num={data.meta.totalUsers} lbl={t("admin.totalsellers")} />
        <StatCard num={data.meta.totalChecks} lbl={t("admin.weekchecks")} />
        <StatCard num={data.meta.totalOrders} lbl={t("admin.totalorders")} />
      </div>

      {analytics && <AnalyticsCharts analytics={analytics} t={t} />}

      <input
        className="mb"
        placeholder={t("admin.search")}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ padding: "10px 14px", border: "1px solid var(--border)", borderRadius: 10 }}
      />

      {filtered.map((u) => (
        <div className="admin-user" key={u._id}>
          <div className="row">
            <div>
              <div className="name">{u.shopName}</div>
              <div className="meta">
                {u.email} · {u.city || "—"} · {new Date(u.createdAt).toLocaleDateString()}
              </div>
              <div className="meta">
                {t("admin.weekchecks").split(" ")[0]}: {u.checksCount} · {t("admin.totalorders").split(" ")[0]}: {u.ordersCount}
              </div>
            </div>
            <span className="chip" style={{
              background: u.plan === "paid" ? "var(--green-bg)" : u.plan === "trial" ? "var(--orange-bg)" : "var(--red-bg)",
              color: u.plan === "paid" ? "var(--green)" : u.plan === "trial" ? "var(--orange)" : "var(--red)",
              height: "fit-content",
            }}>{t(`admin.${u.plan}`)}</span>
          </div>
          <div className="admin-actions">
            <button className="act" disabled={acting === u._id + "1"} onClick={() => act(u._id, { plan: "paid", months: 1 }, "1")}>{t("admin.activate")}</button>
            <button disabled={acting === u._id + "3"} onClick={() => act(u._id, { plan: "paid", months: 3 }, "3")}>{t("admin.activate3")}</button>
            <button disabled={acting === u._id + "12"} onClick={() => act(u._id, { plan: "paid", months: 12 }, "12")}>{t("admin.activate12")}</button>
            <button disabled={acting === u._id + "e"} onClick={() => act(u._id, { plan: "trial", extendDays: 7 }, "e")}>{t("admin.extend")}</button>
            <button disabled={acting === u._id + "s"} onClick={() => act(u._id, { plan: "expired" }, "s")} style={{ color: "var(--red)" }}>{t("admin.suspend")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Graphiques légers en SVG (pas de bibliothèque) ---------- */
function AnalyticsCharts({ analytics, t }) {
  // On remplit les jours manquants pour avoir une série continue
  const days = fillDays(analytics.usersByDay, analytics.days);
  const orderDays = fillDays(analytics.ordersByDay, analytics.days);
  const maxUsers = Math.max(1, ...days.map((d) => d.n));
  const maxOrders = Math.max(1, ...orderDays.map((d) => d.n));
  const statusColors = {
    delivered: "var(--green)", confirmed: "#3b82f6", pending: "var(--gray)",
    refused: "var(--red)", no_answer: "var(--orange)", cancelled: "#94a3b8",
  };
  const statusTotal = analytics.statusSplit.reduce((a, s) => a + s.n, 0) || 1;
  const planColors = { trial: "var(--orange)", paid: "var(--green)", expired: "var(--red)" };
  const planTotal = analytics.planSplit.reduce((a, p) => a + p.n, 0) || 1;

  return (
    <div className="analytics mb">
      <div className="section-title">{t("admin.analytics")}</div>

      <div className="chart-card">
        <div className="chart-label">{t("admin.newSellers")}</div>
        <BarChart data={days} max={maxUsers} color="var(--blue)" />
      </div>

      <div className="chart-card">
        <div className="chart-label">{t("admin.ordersTrend")}</div>
        <BarChart data={orderDays} max={maxOrders} color="#3b82f6" />
      </div>

      <div className="chart-card">
        <div className="chart-label">{t("admin.statusDist")}</div>
        <DistBars
          items={analytics.statusSplit.map((s) => ({ label: t(`status.${s.status}`) || s.status, n: s.n, color: statusColors[s.status] || "var(--gray)" }))}
          total={statusTotal}
        />
      </div>

      <div className="chart-card">
        <div className="chart-label">{t("admin.planDist")}</div>
        <DistBars
          items={analytics.planSplit.map((p) => ({ label: t(`admin.${p.plan}`) || p.plan, n: p.n, color: planColors[p.plan] || "var(--gray)" }))}
          total={planTotal}
        />
      </div>
    </div>
  );
}

// Série continue de jours à partir des données agrégées (remplit les trous avec 0)
function fillDays(rows, count) {
  const map = {}; rows.forEach((r) => (map[r.date] = r.n));
  const out = [];
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - (count - 1));
  for (let i = 0; i < count; i++) {
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, n: map[key] || 0 });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

function BarChart({ data, max, color }) {
  const W = 300, H = 90, gap = 2;
  const bw = (W - gap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="bar-svg" preserveAspectRatio="none" role="img">
      {data.map((d, i) => {
        const h = (d.n / max) * (H - 4);
        return (
          <rect
            key={i} x={i * (bw + gap)} y={H - h} width={bw} height={Math.max(d.n ? 2 : 0, h)}
            rx={Math.min(2, bw / 2)} fill={d.n ? color : "var(--border)"}
          >
            <title>{d.date}: {d.n}</title>
          </rect>
        );
      })}
      <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="var(--border)" strokeWidth="1" />
    </svg>
  );
}

// Barres horizontales proportionnelles avec étiquettes (identité = couleur + label, jamais couleur seule)
function DistBars({ items, total }) {
  const sorted = [...items].sort((a, b) => b.n - a.n);
  return (
    <div className="dist-list">
      {sorted.map((it) => (
        <div className="dist-row" key={it.label}>
          <div className="dist-top">
            <span className="dist-label">
              <span className="dist-dot" style={{ background: it.color }} />
              {it.label}
            </span>
            <span className="dist-val">{it.n} · {Math.round((it.n / total) * 100)}%</span>
          </div>
          <div className="dist-track">
            <div className="dist-fill" style={{ width: `${(it.n / total) * 100}%`, background: it.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

