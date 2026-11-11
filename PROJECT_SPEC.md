# COD Shield — Spécification complète du projet

> Colle ce fichier dans ton workspace Claude (ou renomme-le `CLAUDE.md` à la racine du repo).
> Il décrit le produit, la structure, et le contexte de chaque page. Il ne contient pas de code.

---

## 1. Le produit en une phrase

**COD Shield** est un SaaS pour les vendeurs en ligne marocains (Instagram, TikTok, Facebook, boutiques en ligne) qui vendent en **paiement à la livraison (COD)**. Avant d'expédier, le vendeur vérifie un numéro de téléphone et voit si ce client a déjà refusé des colis chez d'autres vendeurs. Il enregistre ensuite le résultat de chaque commande (livré, refusé, injoignable), ce qui enrichit la base pour tous.

**Problème résolu :** les commandes refusées ou fantômes coûtent de l'argent réel (livraison aller, retour, colis bloqué). Un vendeur qui évite 3 retours par mois a déjà rentabilisé l'abonnement.

**Utilisateur cible :** un vendeur marocain, souvent seul, qui travaille depuis son téléphone, pressé, et qui n'est pas technique. L'interface doit être **ultra simple, mobile-first, en arabe (darija/arabe standard) et en français**.

**Modèle économique :** essai gratuit 30 jours, puis abonnement 99 à 199 MAD/mois, payé manuellement au début (virement, CashPlus), activé par l'admin.

---

## 2. Stack et contraintes techniques

- **Frontend :** React + Vite (dossier `client/`), React Router, CSS simple (Tailwind autorisé).
- **Backend :** Express exposé comme fonction serverless Vercel (`api/index.js`), Mongoose.
- **Base :** MongoDB Atlas.
- **Hébergement :** un seul projet Vercel. `vercel.json` réécrit `/api/*` vers l'API et tout le reste vers `index.html`.
- **Auth :** email + mot de passe, JWT envoyé dans l'en-tête `Authorization: Bearer`.
- **Langues :** arabe (RTL) et français, avec un sélecteur de langue. Arabe par défaut.
- **Mobile-first :** la majorité des vendeurs utilisent leur téléphone. Tester d'abord à 375 px.

### Règles de sécurité non négociables

1. **Jamais de numéro de téléphone en clair en base** dans la collection `customers`. Uniquement `phoneHash` (HMAC-SHA256 avec `PHONE_PEPPER`), calculé **côté serveur**.
2. Dans `orders`, on garde seulement `phoneHint` (3 derniers chiffres, ex. `*******123`).
3. **Chaque requête sur `orders` filtre par `sellerId = req.user._id`.** Aucun vendeur ne voit les données d'un autre.
4. Le résultat d'une vérification ne montre **que des chiffres agrégés**, jamais le nom d'un autre vendeur ni de détails sur ses commandes.
5. Rate limit : 200 vérifications par heure et par vendeur.
6. Le vendeur doit accepter les conditions de partage de données à l'inscription (`acceptedTermsAt`).
7. Aucun secret (`JWT_SECRET`, `PHONE_PEPPER`, `MONGODB_URI`) dans le code ou le client.

---

## 3. Structure complète du projet

```
cod-shield/
├─ package.json                  # dépendances de l'API (express, mongoose, bcryptjs, jsonwebtoken)
├─ vercel.json                   # build du client + réécritures /api
├─ .env.example                  # MONGODB_URI, JWT_SECRET, PHONE_PEPPER, ADMIN_EMAIL
├─ PROJECT_SPEC.md               # ce fichier
│
├─ api/                          # BACKEND (Express serverless)
│  ├─ index.js                   # app Express + routes (exporte app)
│  ├─ models.js                  # User, Customer, Order, CheckLog (+ Template)
│  └─ (optionnel plus tard) lib/ # auth.js, phone.js, risk.js si le fichier grossit
│
└─ client/                       # FRONTEND (React + Vite)
   ├─ index.html
   ├─ vite.config.js             # proxy /api vers vercel dev en local
   └─ src/
      ├─ main.jsx
      ├─ App.jsx                 # routes
      ├─ i18n/
      │  ├─ ar.json
      │  ├─ fr.json
      │  └─ index.js             # langue courante + direction RTL/LTR
      ├─ lib/
      │  ├─ api.js               # fetch avec token + gestion des erreurs (401, 402, 429)
      │  ├─ auth.jsx             # AuthContext : user, token, login, logout
      │  └─ whatsapp.js          # construit le lien wa.me avec le message prérempli
      ├─ components/
      │  ├─ Layout.jsx           # barre de nav (mobile : barre du bas)
      │  ├─ ProtectedRoute.jsx   # redirige vers /login ou /paywall
      │  ├─ RiskBadge.jsx        # pastille verte/orange/rouge/grise
      │  ├─ StatusSelect.jsx     # changer le statut d'une commande en un clic
      │  ├─ PhoneInput.jsx       # champ téléphone marocain avec validation
      │  ├─ StatCard.jsx         # carte chiffre clé
      │  ├─ EmptyState.jsx
      │  └─ LanguageSwitch.jsx
      └─ pages/
         ├─ Landing.jsx          # /
         ├─ Signup.jsx           # /signup
         ├─ Login.jsx            # /login
         ├─ Dashboard.jsx        # /dashboard
         ├─ Check.jsx            # /dashboard/check
         ├─ Orders.jsx           # /dashboard/orders
         ├─ NewOrder.jsx         # /dashboard/orders/new
         ├─ Settings.jsx         # /dashboard/settings
         ├─ Paywall.jsx          # /paywall
         ├─ Terms.jsx            # /terms
         ├─ Privacy.jsx          # /privacy
         ├─ Admin.jsx            # /admin  (réservé à ADMIN_EMAIL)
         └─ NotFound.jsx         # *
```

---

## 4. Modèle de données (résumé)

| Collection | Champs principaux | Notes |
|---|---|---|
| **User** (vendeur) | email, passwordHash, shopName, whatsapp, city, plan (`trial`/`paid`/`expired`), trialEndsAt, acceptedTermsAt | un compte = une boutique |
| **Customer** | phoneHash (unique) | aucun autre champ personnel |
| **Order** | sellerId, customerId, phoneHint, customerName, city, amount, status, riskAtCreation | status : `pending`, `confirmed`, `delivered`, `refused`, `no_answer`, `cancelled` |
| **CheckLog** | sellerId, createdAt (TTL 1h) | sert au rate limit |
| **Template** | sellerId, name, body | modèles de messages WhatsApp |

**Ajouts à faire par rapport au code actuel :**
- Statut `cancelled` (le vendeur a annulé après un avertissement) dans `Order`.
- Champ `riskAtCreation` (`new`/`good`/`medium`/`high`) dans `Order`, rempli à la création si le vendeur a vérifié le numéro. Il sert à calculer l'argent économisé.
- Collection `Template`.

### Règle de calcul du risque

- `refused >= 3` : **high** (rouge)
- `refused >= 1` : **medium** (orange)
- `delivered >= 1` et aucun refus : **good** (vert)
- aucune donnée : **new** (gris, "client inconnu")

Seuls les statuts finaux comptent : `delivered`, `refused`, `no_answer`.

---

## 5. Routes API

**Déjà écrites dans `api/index.js` :**

| Méthode | Route | Rôle |
|---|---|---|
| POST | `/api/auth/signup` | création de compte (exige `acceptTerms`) |
| POST | `/api/auth/login` | connexion, renvoie token |
| POST | `/api/check` | vérifier un numéro (rate limité) |
| POST | `/api/orders` | créer une commande |
| GET | `/api/orders` | liste des commandes du vendeur |
| PATCH | `/api/orders/:id` | changer le statut |
| GET | `/api/stats` | compteurs par statut |

**À ajouter :**

| Méthode | Route | Rôle |
|---|---|---|
| GET | `/api/me` | profil + plan + jours restants d'essai |
| PATCH | `/api/me` | modifier boutique, WhatsApp, ville |
| GET/POST/PATCH/DELETE | `/api/templates` | gérer les modèles WhatsApp |
| GET | `/api/stats` (enrichir) | ajouter : taux de refus, commandes à risque évitées, économies estimées |
| GET | `/api/admin/users` | liste des vendeurs (admin uniquement) |
| PATCH | `/api/admin/users/:id/plan` | activer/prolonger un abonnement (admin uniquement) |

**Codes d'erreur que le client doit gérer :** `401` (déconnecter), `402` (rediriger vers `/paywall`), `429` (message "trop de vérifications, réessayez plus tard"), `400` (afficher le message du champ).

---

## 6. Contexte de chaque page

Pour chaque page : **objectif**, **qui y accède**, **ce qu'elle affiche**, **les actions**, **les appels API**, **les états à gérer**, **notes UX**.

---

### 6.1 Landing — `/`

**Objectif :** convaincre un vendeur COD de créer un compte en moins de 30 secondes. C'est aussi la page que tu montres dans tes messages de prospection.

**Accès :** public.

**Contenu (dans l'ordre) :**
1. **Titre-choc** orienté douleur, pas technologie. Exemple : "Arrêtez de perdre de l'argent sur les commandes refusées."
2. **Sous-titre :** "Vérifiez le client avant d'expédier. Gratuit pendant 30 jours."
3. **Bouton principal** "Commencer gratuitement" vers `/signup`.
4. **Section problème :** un chiffre parlant (ex. "Chaque colis refusé vous coûte environ 40 à 60 MAD").
5. **Section comment ça marche en 3 étapes :** 1) Entrez le numéro, 2) Voyez le niveau de risque, 3) Confirmez par WhatsApp en un clic.
6. **Aperçu visuel** du résultat de vérification (capture ou maquette avec les 3 couleurs).
7. **Tarif simple :** 30 jours gratuits, puis 99 MAD/mois. Aucun engagement.
8. **FAQ courte :** "Les numéros sont-ils visibles par d'autres vendeurs ?" (non, jamais, seulement un score) / "Comment je paie ?" / "Mes données sont-elles protégées ?"
9. **Pied de page :** liens vers `/terms`, `/privacy`, contact WhatsApp.

**Actions :** clic vers inscription ou connexion, changer de langue.

**Appels API :** aucun.

**Notes UX :** une seule action principale répétée 2 ou 3 fois. Pas de menu complexe. Très léger (les vendeurs ont souvent une connexion moyenne). Prévoir des balises SEO et Open Graph (pour les partages WhatsApp).

---

### 6.2 Inscription — `/signup`

**Objectif :** créer le compte avec le minimum de friction.

**Accès :** public (redirige vers `/dashboard` si déjà connecté).

**Champs :** nom de la boutique, email, mot de passe (8 caractères minimum), numéro WhatsApp (optionnel), case à cocher **obligatoire** "J'accepte les conditions d'utilisation et le partage de statistiques anonymisées sur les commandes" avec lien vers `/terms`.

**Actions :** s'inscrire, aller vers `/login`.

**Appels API :** `POST /api/auth/signup`. En cas de succès : stocker le token, rediriger vers `/dashboard`.

**États :** chargement du bouton, erreurs par champ (`email_taken`, `invalid_input`, `terms_required`).

**Notes UX :** un seul écran, pas d'étapes. Afficher en petit "30 jours gratuits, sans carte bancaire".

---

### 6.3 Connexion — `/login`

**Objectif :** reconnecter un vendeur existant.

**Accès :** public.

**Champs :** email, mot de passe.

**Actions :** se connecter, lien vers `/signup`. (Mot de passe oublié : hors MVP, remplacer par "contactez-nous sur WhatsApp".)

**Appels API :** `POST /api/auth/login`.

**États :** `bad_credentials` affiché en un message général (ne pas dire si c'est l'email ou le mot de passe).

---

### 6.4 Tableau de bord — `/dashboard`

**Objectif :** donner au vendeur une vue immédiate de sa situation et lui faire sentir la valeur du produit (l'argent économisé), ce qui justifie le renouvellement.

**Accès :** vendeur connecté.

**Contenu :**
1. **Bandeau d'essai** si `plan = trial` : "Il vous reste X jours d'essai" avec bouton vers `/dashboard/settings` (abonnement).
2. **Bouton géant "Vérifier un client"** vers `/dashboard/check` (c'est l'action la plus fréquente, elle doit être accessible à un pouce).
3. **Carte vedette : "Vous avez économisé X MAD ce mois-ci"**. Calcul : nombre de commandes avec `riskAtCreation` high ou medium qui ont été annulées (`cancelled`) multiplié par un coût moyen de retour (40 MAD par défaut, modifiable).
4. **Cartes de chiffres :** commandes du mois, taux de livraison, taux de refus, commandes en attente.
5. **Liste "À traiter maintenant" :** les commandes `pending` ou `confirmed` les plus anciennes, avec changement de statut rapide.
6. **Bouton "Ajouter une commande".**

**Appels API :** `GET /api/me`, `GET /api/stats`, `GET /api/orders` (limité aux dernières).

**États :** vide (nouveau vendeur : afficher un guide "Étape 1 : vérifiez votre premier client"), chargement, erreur.

**Notes UX :** c'est la page de rétention. Le chiffre des économies doit être gros et visible. Sur mobile, les cartes s'empilent verticalement.

---

### 6.5 Vérifier un client — `/dashboard/check`

**Objectif :** **la page la plus importante du produit.** Le vendeur reçoit une commande, colle ou tape le numéro, et sait en 2 secondes s'il doit expédier.

**Accès :** vendeur connecté.

**Contenu :**
1. **Un seul champ** : numéro de téléphone, très grand, avec clavier numérique, auto-focus. Accepte `06...`, `+2126...`, `6...` avec ou sans espaces.
2. **Bouton "Vérifier"** (ou vérification auto quand le numéro est complet).
3. **Résultat en grand**, couleur dominante :
   - **Vert "Client fiable"** : "X commandes livrées, 0 refus".
   - **Gris "Nouveau client"** : "Aucun historique. Procédez avec prudence normale."
   - **Orange "Attention"** : "X refus enregistrés".
   - **Rouge "Risque élevé"** : "X refus enregistrés. Nous conseillons un acompte ou d'annuler."
4. **Détail chiffré :** livrées, refusées, injoignables (jamais de noms de vendeurs).
5. **Actions après résultat :**
   - **"Ajouter cette commande"** vers `/dashboard/orders/new` avec le numéro et le niveau de risque préremplis.
   - **"Contacter sur WhatsApp"** : ouvre `wa.me/212XXXXXXXXX?text=...` avec le modèle de confirmation par défaut.
   - **"Annuler / ne pas expédier"** (si risque élevé) : enregistre une commande `cancelled` avec `riskAtCreation` pour alimenter le calcul des économies.
6. **Texte de réassurance discret :** "Les numéros sont chiffrés. Vous voyez uniquement un score."

**Appels API :** `POST /api/check`.

**États :** numéro invalide (message clair), rate limit atteint (`429`), essai terminé (`402` vers `/paywall`), chargement très court, hors-ligne.

**Notes UX :** vitesse avant tout. Le résultat doit s'afficher sans changement de page. Le niveau de risque doit être compréhensible même sans lire (couleur + icône + mot). Garder l'historique des 5 dernières vérifications de la session peut être utile, mais sans stocker les numéros en clair dans le navigateur.

---

### 6.6 Liste des commandes — `/dashboard/orders`

**Objectif :** suivre toutes les commandes et enregistrer leur résultat final. **C'est ce qui alimente la base de données collective**, donc il faut rendre la mise à jour du statut la plus simple possible.

**Accès :** vendeur connecté.

**Contenu :**
1. **Filtres par statut** (onglets en haut) : Toutes, En attente, Confirmées, Livrées, Refusées, Injoignables, Annulées.
2. **Recherche** par nom, ville ou fin de numéro.
3. **Liste de cartes** (pas un tableau sur mobile) : nom, ville, montant, numéro masqué (`*******123`), pastille de risque à la création, date, statut actuel.
4. **Changement de statut en un clic** (menu avec 5 choix), avec confirmation légère pour "Refusée".
5. **Bouton WhatsApp** sur chaque commande (relance ou confirmation).
6. **Bouton "Ajouter une commande".**

**Appels API :** `GET /api/orders`, `PATCH /api/orders/:id`.

**États :** liste vide avec message d'aide, chargement progressif, erreur de mise à jour avec possibilité de réessayer.

**Notes UX :** rappeler discrètement "Mettre à jour le statut aide tous les vendeurs à éviter les mauvais clients." pour encourager le geste. Pagination ou chargement de 50 en 50.

---

### 6.7 Nouvelle commande — `/dashboard/orders/new`

**Objectif :** enregistrer une commande en moins de 15 secondes.

**Accès :** vendeur connecté.

**Champs :** numéro de téléphone (préservé si on vient de la page de vérification), nom du client, ville, montant en MAD.

**Comportement :**
- Si on arrive depuis la vérification, afficher le badge de risque en haut du formulaire.
- Sinon, **vérifier automatiquement le numéro** à la saisie et afficher le badge avant l'enregistrement (c'est l'occasion de montrer la valeur du produit).
- Bouton "Enregistrer" puis proposition "Envoyer la confirmation WhatsApp".

**Appels API :** `POST /api/check` (si pas déjà fait), `POST /api/orders`.

**Notes UX :** formulaire court sur un seul écran, clavier numérique pour téléphone et montant, bouton fixe en bas sur mobile.

---

### 6.8 Paramètres — `/dashboard/settings`

**Objectif :** gérer le profil, les messages WhatsApp et l'abonnement.

**Accès :** vendeur connecté.

**Trois sections :**
1. **Ma boutique :** nom, numéro WhatsApp, ville, **coût moyen d'un retour en MAD** (sert au calcul des économies), langue.
2. **Modèles de messages WhatsApp :** liste, création, modification, suppression. Variables disponibles : `{nom}`, `{montant}`, `{ville}`, `{boutique}`. Un modèle marqué "par défaut" est utilisé pour les boutons WhatsApp. Exemple fourni à la création du compte : "Bonjour {nom}, votre commande de {montant} MAD chez {boutique} est prête. Confirmez-vous la livraison ?"
3. **Abonnement :** plan actuel, date de fin d'essai ou d'abonnement, tarif, et **instructions de paiement manuel** (virement ou CashPlus avec RIB/numéro), bouton "J'ai payé" qui ouvre WhatsApp vers toi avec un message prérempli contenant l'email du compte.

**Appels API :** `GET/PATCH /api/me`, `GET/POST/PATCH/DELETE /api/templates`.

**Notes UX :** aperçu en direct du message WhatsApp avec les variables remplacées.

---

### 6.9 Paywall — `/paywall`

**Objectif :** quand l'essai est terminé (réponse `402`), ne pas perdre le vendeur mais le convertir.

**Accès :** vendeur connecté dont le plan est `expired` ou l'essai terminé.

**Contenu :** message amical "Votre essai est terminé", **récapitulatif de la valeur reçue** ("En 30 jours : X vérifications, Y refus évités, Z MAD économisés"), tarif, instructions de paiement, bouton WhatsApp vers toi, bouton de déconnexion.

**Appels API :** `GET /api/me`, `GET /api/stats` (doivent rester accessibles même si le plan est expiré, donc prévoir une exception dans le middleware).

**Notes UX :** c'est la page qui transforme l'essai en paiement, donc le récapitulatif chiffré est l'élément clé. Les données du vendeur ne sont jamais supprimées.

---

### 6.10 Conditions d'utilisation — `/terms`

**Objectif :** cadre légal clair. **À faire relire par un juriste marocain avant le lancement public.**

**Accès :** public.

**Contenu à couvrir :**
- Ce que fait le service (aide à la décision, pas une "liste noire").
- Les données collectées : seulement l'empreinte chiffrée du numéro et le résultat de la commande.
- Aucune donnée personnelle de client n'est visible par les autres vendeurs.
- Obligation du vendeur de renseigner des statuts honnêtes.
- Interdiction d'utiliser le service pour harceler ou diffamer.
- Le score est indicatif et ne remplace pas le jugement du vendeur.
- Mention du cadre de la loi 09-08 et de la CNDP.
- Droit de suppression et contact.
- Conditions de paiement et de résiliation.

---

### 6.11 Confidentialité — `/privacy`

**Objectif :** expliquer simplement comment les données sont protégées (c'est aussi un argument commercial).

**Contenu :** quelles données sont stockées, pourquoi le numéro est transformé en empreinte irréversible, qui peut voir quoi, durée de conservation, comment demander la suppression, contact.

---

### 6.12 Admin — `/admin`

**Objectif :** toi seul peux gérer les abonnements manuellement au début (avant d'intégrer une passerelle de paiement).

**Accès :** uniquement l'email défini dans `ADMIN_EMAIL`. Vérification **côté serveur** sur chaque route admin, pas seulement côté interface.

**Contenu :** liste des vendeurs (boutique, email, ville, date d'inscription, plan, fin d'essai, nombre de vérifications et de commandes), recherche, boutons "Activer 1 mois / 3 mois / 12 mois", "Prolonger l'essai de 7 jours", "Suspendre".

**Appels API :** `GET /api/admin/users`, `PATCH /api/admin/users/:id/plan`.

**Notes UX :** page simple, utilisée par une seule personne. Ajouter un compteur global : nombre de vendeurs, vérifications cette semaine, commandes enregistrées (indicateur de la valeur de la base).

---

### 6.13 Page introuvable — `*`

Message court, bouton de retour vers `/` ou `/dashboard` selon que l'utilisateur est connecté.

---

## 7. Composants partagés (rôle de chacun)

- **Layout :** en-tête avec nom de la boutique et langue ; sur mobile, **barre de navigation en bas** (Accueil, Vérifier, Commandes, Paramètres) ; le bouton Vérifier est central et mis en avant.
- **ProtectedRoute :** si pas de token, redirige vers `/login` ; si l'API répond `402`, redirige vers `/paywall` ; si `401`, déconnecte.
- **RiskBadge :** 4 variantes (fiable, nouveau, attention, élevé) avec couleur **et** icône **et** texte (accessibilité, pas seulement la couleur).
- **StatusSelect :** menu des statuts avec couleurs cohérentes dans toute l'application.
- **PhoneInput :** normalise à l'écran, valide le format marocain, clavier numérique.
- **StatCard :** chiffre, libellé, variation optionnelle.
- **api.js :** ajoute le token, traduit les erreurs en messages dans la langue courante, intercepte `401/402/429`.
- **whatsapp.js :** reçoit un numéro et un modèle, remplace les variables, renvoie `https://wa.me/212XXXXXXXXX?text=...` correctement encodé.

---

## 8. Principes de design et d'expérience

1. **Mobile d'abord**, grands boutons, une action principale par écran.
2. **Arabe et RTL natifs** : tester chaque page dans les deux directions.
3. **Couleurs sémantiques constantes** : vert = fiable/livré, gris = nouveau/en attente, orange = attention, rouge = risque/refusé.
4. **Vitesse perçue** : le résultat de vérification doit apparaître sans rechargement ni écran intermédiaire.
5. **Ton simple et direct**, comme on parle à un commerçant, sans jargon.
6. **Légèreté** : pas de grosses images ni bibliothèques inutiles.
7. **Toujours un état vide utile** qui explique quoi faire ensuite.

---

## 9. Ordre de construction conseillé

1. **Socle :** projet Vite, routes, `api.js`, `AuthContext`, `Layout`, i18n (arabe + français).
2. **Auth :** Signup, Login, ProtectedRoute, `/api/me`.
3. **Cœur du produit :** Check (avec `RiskBadge`), puis NewOrder, puis Orders avec changement de statut.
4. **WhatsApp :** `whatsapp.js` + modèles dans Settings.
5. **Valeur perçue :** Dashboard avec statistiques et économies (ajouter `cancelled` et `riskAtCreation`).
6. **Monétisation :** Paywall + Admin + instructions de paiement.
7. **Confiance :** Landing, Terms, Privacy.
8. **Finitions :** états vides, erreurs, tests mobile, performances.

### Définition de "MVP terminé"

Un vendeur peut s'inscrire, vérifier un numéro, enregistrer une commande, mettre à jour son statut, voir ses économies, et toi tu peux activer son abonnement depuis `/admin`. Tout fonctionne sur téléphone en arabe.

---

## 10. Consignes pour Claude (à respecter à chaque modification)

- Ne jamais stocker ni logger un numéro de téléphone en clair côté serveur (hors traitement en mémoire pour le hash).
- Toute route qui lit ou modifie des commandes doit filtrer par `sellerId` de l'utilisateur connecté.
- Ne jamais renvoyer au client une information qui permettrait d'identifier un autre vendeur.
- Ne jamais mettre de secret dans `client/`.
- Garder `connect()` avec cache de connexion dans l'API (obligatoire en serverless).
- Chaque nouvelle page doit gérer : chargement, vide, erreur, et fonctionner en RTL.
- Écrire les textes visibles dans les fichiers `i18n`, jamais en dur dans les composants.
- Avant d'ajouter une fonctionnalité hors de cette spécification, demander confirmation.

---

## 11. Prompt de démarrage à coller dans Claude

> Lis `PROJECT_SPEC.md`. Le backend de base existe déjà dans `api/`. Commence par l'étape 1 de la section 9 : crée le projet React/Vite dans `client/`, configure React Router avec toutes les routes de la section 3 (pages vides pour l'instant), le fichier `api.js`, l'`AuthContext`, le `Layout` mobile-first avec barre de navigation en bas, et l'i18n arabe/français avec support RTL. N'écris pas encore le contenu des pages. Explique-moi ce que tu as créé et comment le lancer avec `vercel dev`.
