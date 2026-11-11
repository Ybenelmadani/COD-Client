import { useState } from "react";
import { normalizePhone, formatPhone } from "../lib/whatsapp.js";
import { useI18n } from "../i18n/index.jsx";

export default function PhoneInput({ value, onChange, name = "phone", placeholder, big = false }) {
  const { t } = useI18n();
  const [touched, setTouched] = useState(false);
  const valid = normalizePhone(value);

  return (
    <div className="field">
      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        name={name}
        className={big ? "check-phone" : ""}
        value={value}
        placeholder={placeholder || t("check.placeholder")}
        autoFocus={big}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        dir="ltr"
      />
      {touched && value && !valid && (
        <div className="err">{t("error.invalid_phone")}</div>
      )}
    </div>
  );
}
