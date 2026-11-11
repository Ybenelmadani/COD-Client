import { createContext, useContext, useEffect, useState, useCallback } from "react";
import ar from "./ar.json";
import fr from "./fr.json";

const dicts = { ar, fr };
const STORAGE_KEY = "codsh.lang";

const I18nContext = createContext(null);

function detect() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ar" || saved === "fr") return saved;
  // Arabe par défaut selon la spec
  return "ar";
}

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(detect);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const t = useCallback(
    (key, vars) => {
      let s = dicts[lang][key] ?? dicts.ar[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          s = s.replace(new RegExp(`\\{${k}\\}`, "g"), v);
        });
      }
      return s;
    },
    [lang]
  );

  const toggle = useCallback(() => setLang((l) => (l === "ar" ? "fr" : "ar")), []);

  return (
    <I18nContext.Provider value={{ lang, setLang, toggle, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
