# 🚀 COMMENT AJOUTER VOS CLÉS SUR VERCEL

L'application ne peut pas fonctionner sans les clés API (Stripe et Gemini). Voici comment les ajouter à votre projet `check-aura-six.vercel.app`.

### 1️⃣ Ouvrez votre tableau de bord Vercel
1. Allez sur [vercel.com](https://vercel.com/dashboard)
2. Cliquez sur votre projet **check-aura-six**
3. Cliquez sur l'onglet **Settings** (Paramètres) en haut
4. Dans le menu de gauche, choisissez **Environment Variables**

### 2️⃣ Ajoutez les 3 clés suivantes

Pour chaque ligne ci-dessous, copiez le **NOM** (Key) et la **VALEUR** (Value), puis cliquez sur **Save**.

---

**🔸 CLÉ STRIPE PUBLIQUE**
- **Key (Nom) :** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Value (Valeur) :** *(Votre clé Stripe publique commençant par pk_test_...)*

---

**🔸 CLÉ STRIPE SECRÈTE**
- **Key (Nom) :** `STRIPE_SECRET_KEY`
- **Value (Valeur) :** *(Votre clé Stripe secrète commençant par sk_test_...)*

---

**🔸 CLÉ GEMINI (INTELLIGENCE ARTIFICIELLE)**
- **Key (Nom) :** `GEMINI_API_KEY`
- **Value (Valeur) :** *(Votre clé Google AI Studio commençant par AIza...)*

### 3️⃣ Redéployez votre application
Une fois les clés ajoutées, vous devez redéployer pour qu'elles soient prises en compte :
1. Allez dans l'onglet **Deployments**
2. Cliquez sur les 3 points (⋮) à droite de votre dernier déploiement
3. Choisissez **Redeploy**

✅ **C'est tout ! L'erreur "Configuration Stripe incomplète" disparaîtra.**
