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
  const [q, setQ] = useState("");
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  // Seul l'admin côté interface ; la route API vérifie aussi côté serveur.
  if (user && !user.isAdmin) return <Navigate to="/dashboard" replace />;

  async function load() {
    setError(null);
    try {
      const d = await api.adminUsers(token);
      setData(d);
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
