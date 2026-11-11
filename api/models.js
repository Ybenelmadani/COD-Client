const mongoose = require("mongoose");
const { Schema, model, models } = mongoose;

/* ---------- User (vendeur) : un compte = une boutique ---------- */
const User = models.User || model("User", new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  shopName: { type: String, required: true, trim: true },
  whatsapp: String,
  city: String,
  plan: { type: String, enum: ["trial", "paid", "expired"], default: "trial" },
  trialEndsAt: { type: Date, default: () => new Date(Date.now() + 30 * 864e5) },
  paidUntil: Date,
  acceptedTermsAt: Date,
  returnCost: { type: Number, default: 40 }, // coût moyen d'un retour en MAD (calcul des économies)
  language: { type: String, enum: ["ar", "fr"], default: "ar" },
  checksCount: { type: Number, default: 0 }, // total des vérifications (bilan d'essai)
}, { timestamps: true }));

/* ---------- Customer : JAMAIS de numéro en clair, seulement l'empreinte HMAC ---------- */
const Customer = models.Customer || model("Customer", new Schema({
  phoneHash: { type: String, required: true, unique: true },
}, { timestamps: true }));

/* ---------- Order : on ne garde que phoneHint côté affichage ---------- */
const orderSchema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
  phoneHint: String,            // ex: "*******123" (affichage uniquement)
  customerName: String,
  city: String,
  amount: Number,
  status: {
    type: String,
    enum: ["pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"],
    default: "pending",
  },
  riskAtCreation: { type: String, enum: ["new", "good", "medium", "high"] },
}, { timestamps: true });
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
const Order = models.Order || model("Order", orderSchema);

/* ---------- CheckLog : journal des vérifications, supprimé après 1h (TTL) = rate limit ---------- */
const logSchema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 },
});
const CheckLog = models.CheckLog || model("CheckLog", logSchema);

/* ---------- Template : modèles de messages WhatsApp ---------- */
const templateSchema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true },
  body: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });
const Template = models.Template || model("Template", templateSchema);

module.exports = { User, Customer, Order, CheckLog, Template };
