import { useI18n } from "../i18n/index.jsx";

const VARIANTS = {
  good: { icon: "✓", cls: "good" },
  new: { icon: "?", cls: "new" },
  medium: { icon: "!", cls: "medium" },
  high: { icon: "✕", cls: "high" },
};

export default function RiskBadge({ risk, big = false }) {
  const { t } = useI18n();
  const v = VARIANTS[risk] || VARIANTS.new;
  return (
    <span className={`risk ${v.cls}${big ? " big" : ""}`}>
      <span aria-hidden="true">{v.icon}</span>
      {t(`risk.${v.cls}`)}
    </span>
  );
}
