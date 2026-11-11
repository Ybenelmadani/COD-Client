try { require("dotenv").config(); } catch {} // local seulement ; no-op sur Vercel
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Customer, Order, CheckLog, Template } = require("./models");

const app = express();
app.use(express.json({ limit: "50kb" }));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

/* ---------- Connexion MongoDB (mise en cache pour le serverless) ---------- */
let cached = global._mongo || (global._mongo = { conn: null, promise: null });
async function connect() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
app.use(async (_req, res, next) => {
  try { await connect(); next(); }
  catch (e) { console.error(e); res.status(500).json({ error: "db_error" }); }
});

/* ---------- Utilitaires téléphone (rien n'est stocké/loggé en clair) ---------- */
function normalizePhone(raw) {
  let p = String(raw || "").replace(/\D/g, "");
  if (p.startsWith("212")) p = "0" + p.slice(3);
  if (p.length === 9) p = "0" + p;
  return /^0[5-7]\d{8}$/.test(p) ? p : null; // numéro marocain valide
}
function hashPhone(phone) {
  return crypto.createHmac("sha256", process.env.PHONE_PEPPER).update(phone).digest("hex");
}
const hint = (p) => "*".repeat(p.length - 3) + p.slice(-3);

/* ---------- Auth ---------- */
const sign = (u) => jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// softAuth : authentifie mais laisse passer même si l'abonnement est expiré (/api/me, /api/stats)
async function softAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: "unauthorized" });
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "unauthorized" }); }
}

// auth : authentifie + exige un abonnement actif (sauf admin)
async function auth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    const { id } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(id);
    if (!user) return res.status(401).json({ error: "unauthorized" });
    const isAdmin = user.email === ADMIN_EMAIL;
    if (!isAdmin) {
      if (user.plan === "trial" && user.trialEndsAt < new Date())
        return res.status(402).json({ error: "trial_ended" });
      if (user.plan === "expired") return res.status(402).json({ error: "subscription_required" });
    }
    req.user = user;
    next();
  } catch { res.status(401).json({ error: "unauthorized" }); }
}

function requireAdmin(req, res, next) {
  if (req.user.email !== ADMIN_EMAIL) return res.status(403).json({ error: "forbidden" });
  next();
}

function profileOf(u) {
  const daysLeft = u.plan === "trial"
    ? Math.max(0, Math.ceil((new Date(u.trialEndsAt) - Date.now()) / 864e5))
    : 0;
  return {
    _id: u._id,
    email: u.email,
    shopName: u.shopName,
    whatsapp: u.whatsapp,
    city: u.city,
    plan: u.plan,
    trialEndsAt: u.trialEndsAt,
    paidUntil: u.paidUntil,
    daysLeft,
    returnCost: u.returnCost,
    language: u.language,
    isAdmin: u.email === ADMIN_EMAIL,
  };
}

const DEFAULT_TEMPLATE = "Bonjour {nom}, votre commande de {montant} MAD chez {boutique} est prête. Confirmez-vous la livraison ?";

/* ---------- Santé ---------- */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

/* ---------- Inscription / Connexion ---------- */
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, shopName, whatsapp, acceptTerms } = req.body;
  if (!email || !password || password.length < 8 || !shopName)
    return res.status(400).json({ error: "invalid_input" });
  if (!acceptTerms) return res.status(400).json({ error: "terms_required" });
  if (await User.findOne({ email: String(email).toLowerCase() }))
    return res.status(409).json({ error: "email_taken" });
  const user = await User.create({
    email, shopName, whatsapp,
    passwordHash: await bcrypt.hash(password, 10),
    acceptedTermsAt: new Date(),
  });
  await Template.create({ sellerId: user._id, name: "Confirmation", body: DEFAULT_TEMPLATE, isDefault: true });
  res.json({ token: sign(user), user: profileOf(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const user = await User.findOne({ email: String(req.body.email || "").toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password || "", user.passwordHash)))
    return res.status(401).json({ error: "bad_credentials" });
  res.json({ token: sign(user), user: profileOf(user) });
});

/* ---------- Profil ---------- */
app.get("/api/me", softAuth, (req, res) => res.json(profileOf(req.user)));

app.patch("/api/me", softAuth, async (req, res) => {
  const allowed = ["shopName", "whatsapp", "city", "returnCost", "language"];
  const upd = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
  if (upd.language && !["ar", "fr"].includes(upd.language))
    return res.status(400).json({ error: "invalid_input" });
  if (upd.returnCost !== undefined && (isNaN(Number(upd.returnCost)) || Number(upd.returnCost) < 0))
    return res.status(400).json({ error: "invalid_input" });
  const u = await User.findByIdAndUpdate(req.user._id, upd, { new: true });
  res.json(profileOf(u));
});

/* ---------- Vérifier un client (cœur du produit) ---------- */
app.post("/api/check", auth, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: "invalid_phone" });

  const recent = await CheckLog.countDocuments({ sellerId: req.user._id });
  if (recent >= 200) return res.status(429).json({ error: "rate_limited" });
  await CheckLog.create({ sellerId: req.user._id });
  await User.updateOne({ _id: req.user._id }, { $inc: { checksCount: 1 } });

  const customer = await Customer.findOne({ phoneHash: hashPhone(phone) });
  const counts = { delivered: 0, refused: 0, no_answer: 0 };
  if (customer) {
    const rows = await Order.aggregate([
      { $match: { customerId: customer._id, status: { $in: Object.keys(counts) } } },
      { $group: { _id: "$status", n: { $sum: 1 } } },
    ]);
    rows.forEach((r) => (counts[r._id] = r.n));
  }
  const total = counts.delivered + counts.refused + counts.no_answer;
  const risk =
    counts.refused >= 3 ? "high" :
    counts.refused >= 1 ? "medium" :
    counts.delivered >= 1 ? "good" : "new";

  // Aucune info sur les autres vendeurs : uniquement des chiffres agrégés.
  res.json({ known: total > 0, total, ...counts, risk });
});

/* ---------- Commandes (toujours filtrées par sellerId) ---------- */
app.post("/api/orders", auth, async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: "invalid_phone" });
  const risk = ["new", "good", "medium", "high"].includes(req.body.risk) ? req.body.risk : undefined;
  const customer = await Customer.findOneAndUpdate(
    { phoneHash: hashPhone(phone) },
    { $setOnInsert: { phoneHash: hashPhone(phone) } },
    { upsert: true, new: true }
  );
  const order = await Order.create({
    sellerId: req.user._id,
    customerId: customer._id,
    phoneHint: hint(phone),
    customerName: req.body.name,
    city: req.body.city,
    amount: Number(req.body.amount) || 0,
    riskAtCreation: risk,
    status: req.body.status === "cancelled" ? "cancelled" : "pending",
  });
  res.json(order);
});

app.get("/api/orders", auth, async (req, res) => {
  const orders = await Order.find({ sellerId: req.user._id })
    .sort({ createdAt: -1 }).limit(200).select("-customerId");
  res.json(orders);
});

app.patch("/api/orders/:id", auth, async (req, res) => {
  const allowed = ["pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "invalid_status" });
  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, sellerId: req.user._id }, // un vendeur ne modifie que ses commandes
    { status: req.body.status },
    { new: true }
  ).select("-customerId");
  if (!order) return res.status(404).json({ error: "not_found" });
  res.json(order);
});

/* ---------- Modèles WhatsApp ---------- */
app.get("/api/templates", auth, async (req, res) => {
  const t = await Template.find({ sellerId: req.user._id }).sort({ isDefault: -1, createdAt: 1 });
  res.json(t);
});

app.post("/api/templates", auth, async (req, res) => {
  const { name, body, isDefault } = req.body;
  if (!name || !body) return res.status(400).json({ error: "invalid_input" });
  if (isDefault) await Template.updateMany({ sellerId: req.user._id }, { $set: { isDefault: false } });
  const t = await Template.create({ sellerId: req.user._id, name, body, isDefault: !!isDefault });
  res.json(t);
});

app.patch("/api/templates/:id", auth, async (req, res) => {
  const upd = {};
  if (req.body.name !== undefined) upd.name = req.body.name;
  if (req.body.body !== undefined) upd.body = req.body.body;
  if (req.body.isDefault !== undefined) {
    if (req.body.isDefault) await Template.updateMany({ sellerId: req.user._id }, { $set: { isDefault: false } });
    upd.isDefault = !!req.body.isDefault;
  }
  const t = await Template.findOneAndUpdate({ _id: req.params.id, sellerId: req.user._id }, upd, { new: true });
  if (!t) return res.status(404).json({ error: "not_found" });
  res.json(t);
});

app.delete("/api/templates/:id", auth, async (req, res) => {
  const r = await Template.deleteOne({ _id: req.params.id, sellerId: req.user._id });
  if (!r.deletedCount) return res.status(404).json({ error: "not_found" });
  res.json({ ok: true });
});

/* ---------- Statistiques (accessibles même si expiré, pour le paywall) ---------- */
app.get("/api/stats", softAuth, async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { sellerId: req.user._id } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const counts = {};
  ["pending", "confirmed", "delivered", "refused", "no_answer", "cancelled"].forEach((k) => (counts[k] = 0));
  rows.forEach((r) => (counts[r._id] = r.n));

  const finalTotal = counts.delivered + counts.refused + counts.no_answer;
  const refusalRate = finalTotal ? counts.refused / finalTotal : 0;
  const returnCost = req.user.returnCost || 40;
  const avoided = await Order.countDocuments({
    sellerId: req.user._id, status: "cancelled", riskAtCreation: { $in: ["high", "medium"] },
  });
  const savings = avoided * returnCost;

  const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
  const monthRows = await Order.aggregate([
    { $match: { sellerId: req.user._id, createdAt: { $gte: startOfMonth } } },
    { $group: { _id: "$status", n: { $sum: 1 } } },
  ]);
  const month = { pending: 0, confirmed: 0, delivered: 0, refused: 0, no_answer: 0, cancelled: 0 };
  monthRows.forEach((r) => (month[r._id] = r.n));
  const monthOrders = monthRows.reduce((a, r) => a + r.n, 0);
  const monthAvoided = await Order.countDocuments({
    sellerId: req.user._id, status: "cancelled",
    riskAtCreation: { $in: ["high", "medium"] }, createdAt: { $gte: startOfMonth },
  });

  res.json({
    counts, refusalRate, avoided, savings,
    month: { orders: monthOrders, delivered: month.delivered, refused: month.refused, savings: monthAvoided * returnCost },
  });
});

/* ---------- Admin (réservé à ADMIN_EMAIL) ---------- */
app.get("/api/admin/users", auth, requireAdmin, async (_req, res) => {
  const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 }).limit(500).lean();
  const agg = await Order.aggregate([{ $group: { _id: "$sellerId", n: { $sum: 1 } } }]);
  const map = {}; agg.forEach((a) => (map[a._id.toString()] = a.n));
  const totalChecks = await User.aggregate([{ $group: { _id: null, sum: { $sum: "$checksCount" } } }]);
  const totalOrders = await Order.countDocuments();
  res.json({
    meta: {
      totalUsers: users.length,
      totalChecks: totalChecks[0]?.sum || 0,
      totalOrders,
    },
    users: users.map((u) => ({
      _id: u._id, shopName: u.shopName, email: u.email, city: u.city,
      plan: u.plan, trialEndsAt: u.trialEndsAt, paidUntil: u.paidUntil,
      createdAt: u.createdAt, checksCount: u.checksCount || 0, ordersCount: map[u._id.toString()] || 0,
    })),
  });
});

app.patch("/api/admin/users/:id/plan", auth, requireAdmin, async (req, res) => {
  const { plan, months, extendDays } = req.body;
  const u = await User.findById(req.params.id);
  if (!u) return res.status(404).json({ error: "not_found" });
  if (plan === "paid" && months) {
    u.plan = "paid";
    const base = u.paidUntil && u.paidUntil > new Date() ? u.paidUntil : new Date();
    u.paidUntil = new Date(base.getTime() + months * 30 * 864e5);
  } else if (plan === "trial" && extendDays) {
    u.plan = "trial";
    const base = u.trialEndsAt && u.trialEndsAt > new Date() ? u.trialEndsAt : new Date();
    u.trialEndsAt = new Date(base.getTime() + extendDays * 864e5);
  } else if (["paid", "trial", "expired"].includes(plan)) {
    u.plan = plan;
  } else {
    return res.status(400).json({ error: "invalid_input" });
  }
  await u.save();
  res.json({ ok: true, user: profileOf(u) });
});

/* ---------- 404 API ---------- */
app.use((req, res) => res.status(404).json({ error: "not_found" }));

// Permet de lancer l'API en local avec `node api/index.js` (hors Vercel)
if (process.env.NODE_ENV !== "production" && require.main === module) {
  const port = process.env.PORT || 3001;
  app.listen(port, () => console.log("COD Shield API sur http://localhost:" + port));
}

module.exports = app;
