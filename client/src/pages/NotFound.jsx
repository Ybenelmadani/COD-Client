import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import { useAuth } from "../lib/auth.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

export default function NotFound() {
  const { t } = useI18n();
  const { token } = useAuth();
  const dest = token ? "/dashboard" : "/";

  return (
    <div className="auth center" style={{ paddingTop: 60 }}>
      <div style={{ fontSize: "3rem", marginBottom: 10 }}>🧭</div>
      <h1>{t("notfound.title")}</h1>
      <div className="mt-lg">
        <Link to={dest} className="btn btn-primary">
          {token ? t("notfound.dash") : t("notfound.home")}
        </Link>
      </div>
      <div className="mt">
        <LanguageSwitch />
      </div>
    </div>
  );
}
