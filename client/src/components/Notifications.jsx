import { useState, useEffect, useRef } from "react";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import { api } from "../lib/api.js";

export default function Notifications() {
  const { t } = useI18n();
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  async function load() {
    try {
      const d = await api.notifications(null, token);
      setItems(d.items || []);
      setUnread(d.unread || 0);
    } catch {}
  }

  // Polling léger : vérifie les nouvelles notifs toutes les 30s
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [token]);

  // Fermer au clic extérieur
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function toggle() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) load();
  }

  async function markRead() {
    setUnread(0);
    setOpen(false);
    try { await api.readNotifications(token); } catch {}
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={toggle} aria-label={t("notif.newOrder")}>
        <span className="icon">🔔</span>
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-head">
            <span>{t("notif.newOrder")}</span>
            {unread > 0 && <button className="notif-mark" onClick={markRead}>{t("notif.markRead")}</button>}
          </div>
          <div className="notif-list">
            {items.length === 0 ? (
              <div className="notif-empty muted">{t("notif.empty")}</div>
            ) : (
              items.map((n) => (
                <div key={n._id} className={`notif-item ${n.read ? "" : "unread"}`}>
                  <div className="notif-title">{n.title || t("notif.newOrder")}</div>
                  <div className="notif-body muted">{n.body}</div>
                  <div className="notif-time">{timeAgo(n.createdAt)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return m + " min";
  const h = Math.floor(m / 60);
  if (h < 24) return h + " h";
  const d = Math.floor(h / 24);
  return d + " j";
}
