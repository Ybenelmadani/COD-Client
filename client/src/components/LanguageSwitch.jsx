import { useI18n } from "../i18n/index.jsx";

export default function LanguageSwitch() {
  const { lang, toggle } = useI18n();
  return (
    <button className="btn-ghost" onClick={toggle} aria-label="Switch language">
      🌐 {lang === "ar" ? "FR" : "AR"}
    </button>
  );
}
