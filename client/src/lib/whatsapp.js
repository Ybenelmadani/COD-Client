// Construit un lien wa.me avec le message prérempli.
// Variables disponibles : {nom}, {montant}, {ville}, {boutique}
export function buildWhatsAppLink(phone, template, vars) {
  let text = template || "";
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v || ""));
    });
  }
  const clean = normalizePhone(phone);
  if (!clean) return null;
  // Convertir en format international 212XXXXXXXXX
  const intl = "212" + clean.slice(1);
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

// Normalise le numéro marocain : accepte 06..., +2126..., 6..., avec ou sans espaces
export function normalizePhone(raw) {
  let p = String(raw || "").replace(/\D/g, "");
  if (p.startsWith("212")) p = "0" + p.slice(3);
  if (p.length === 9) p = "0" + p;
  return /^0[5-7]\d{8}$/.test(p) ? p : null;
}

export function formatPhone(p) {
  const n = normalizePhone(p);
  if (!n) return p;
  return `${n.slice(0, 2)} ${n.slice(2, 4)} ${n.slice(4, 6)} ${n.slice(6, 8)} ${n.slice(8, 10)}`;
}
