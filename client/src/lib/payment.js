// Ces informations sont publiques côté client : ne jamais y placer de secret.
// Configurez-les dans Vercel avec les variables VITE_* correspondantes.
export const paymentDetails = {
  adminWhatsApp: (import.meta.env.VITE_ADMIN_WHATSAPP || "").trim(),
  rib: (import.meta.env.VITE_PAYMENT_RIB || "").trim(),
  cashPlus: (import.meta.env.VITE_CASHPLUS_NUMBER || "").trim(),
};
