import { Link } from "react-router-dom";
import { useI18n } from "../i18n/index.jsx";
import LanguageSwitch from "../components/LanguageSwitch.jsx";

export default function Landing() {
  const { t } = useI18n();

  return (
    <div className="landing">
      <div className="between" style={{ padding: "10px 0" }}>
        <strong>{t("app.name")}</strong>
        <LanguageSwitch />
      </div>

      <section className="hero">
        <h1>{t("landing.pain")}</h1>
        <p>{t("landing.sub")}</p>
        <Link to="/signup" className="btn btn-primary btn-lg">{t("landing.cta")}</Link>
      </section>

      <section>
        <h2>💰</h2>
        <p style={{ fontSize: "1.1rem" }}>{t("landing.cost")}</p>
      </section>

      <section>
        <h2>{t("landing.how")}</h2>
        <div className="steps">
          <div className="step">
            <div className="n">1</div>
            <div>
              <div className="t">{t("landing.step1")}</div>
              <div className="d">{t("landing.step1d")}</div>
            </div>
          </div>
          <div className="step">
            <div className="n">2</div>
            <div>
              <div className="t">{t("landing.step2")}</div>
              <div className="d">{t("landing.step2d")}</div>
            </div>
          </div>
          <div className="step">
            <div className="n">3</div>
            <div>
              <div className="t">{t("landing.step3")}</div>
              <div className="d">{t("landing.step3d")}</div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>{t("landing.preview")}</h2>
        <div className="mock">
          <div className="m" style={{ background: "var(--green-bg)", color: "var(--green)" }}>
            ✓ {t("risk.good")}
          </div>
          <div className="m" style={{ background: "var(--gray-bg)", color: "var(--gray)" }}>
            ? {t("risk.new")}
          </div>
          <div className="m" style={{ background: "var(--orange-bg)", color: "var(--orange)" }}>
            ! {t("risk.medium")}
          </div>
          <div className="m" style={{ background: "var(--red-bg)", color: "var(--red)" }}>
            ✕ {t("risk.high")}
          </div>
        </div>
      </section>

      <section style={{ textAlign: "center" }}>
        <h2>{t("landing.priceTitle")}</h2>
        <div className="price">99 MAD<span style={{ fontSize: "1rem", color: "var(--text-muted)" }}>/ {t("settings.plan.paid").toLowerCase()}</span></div>
        <p className="muted mt">{t("landing.priceDesc")}</p>
        <Link to="/signup" className="btn btn-primary btn-lg mt">{t("landing.cta")}</Link>
      </section>

      <section className="faq">
        <h2>{t("landing.faq")}</h2>
        <dl>
          <dt>{t("landing.faq1q")}</dt>
          <dd>{t("landing.faq1a")}</dd>
          <dt>{t("landing.faq2q")}</dt>
          <dd>{t("landing.faq2a")}</dd>
          <dt>{t("landing.faq3q")}</dt>
          <dd>{t("landing.faq3a")}</dd>
        </dl>
      </section>

      <div className="footer">
        <Link to="/terms">{t("terms.title")}</Link>
        <Link to="/privacy">{t("privacy.title")}</Link>
        <Link to="/login">{t("auth.loginLink")}</Link>
      </div>
    </div>
  );
}
