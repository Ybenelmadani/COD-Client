import { useState } from "react";
import { useI18n } from "../i18n/index.jsx";

const STATUSES = ["pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"];

const COLORS = {
  pending: "var(--gray-bg)",
  confirmed: "#dbeafe",
  delivered: "var(--green-bg)",
  refused: "var(--red-bg)",
  no_answer: "var(--orange-bg)",
  cancelled: "var(--gray-bg)",
};

export default function StatusSelect({ value, onChange, compact = false }) {
  const { t } = useI18n();
  const [confirming, setConfirming] = useState(null);

  function handleClick(s) {
    if (s === "refused" && confirming !== s) {
      setConfirming(s);
      return;
    }
    setConfirming(null);
    onChange(s);
  }

  return (
    <div className="status-select">
      {STATUSES.map((s) => (
        <button
          key={s}
          onClick={() => handleClick(s)}
          className={value === s ? "active" : ""}
          style={value === s ? { background: COLORS[s], borderColor: COLORS[s] } : {}}
        >
          {confirming === s ? "✓ " : ""}
          {t(`status.${s}`)}
        </button>
      ))}
    </div>
  );
}
