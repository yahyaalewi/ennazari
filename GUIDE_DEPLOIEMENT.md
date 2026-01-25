# 🚀 Guide de Déploiement Simplifié (Docker)

Grâce à Docker, le déploiement est maintenant automatique pour le Frontend et le Backend.

## 📋 Étape 1 : Mettre le code sur GitHub

1.  Assurez-vous que tout est validé :
    ```bash
    git add .
    git commit -m "Configuration Docker pour déploiement"
    git push origin main
    ```

## ☁️ Étape 2 : Déployer sur Render (Backend + Frontend)

1.  Allez sur votre tableau de bord [Render](https://dashboard.render.com/).
2.  Cliquez sur **Blueprints** (en haut).
3.  Cliquez sur **New Blueprint Instance**.
4.  Connectez votre dépôt GitHub `nizari` (ou le nom que vous lui avez donné).
5.  Render va détecter automatiquement le fichier `render.yaml`.
6.  Cliquez sur **Apply**.

### ⚠️ Configuration des Variables (Important)
Render va vous demander de remplir les variables manquantes (`sync: false`) :

*   **MONGO_URI** : Collez votre lien de connexion MongoDB Atlas (le même que dans votre ancien `.env`).
*   **JWT_SECRET** : Mettez un mot de passe compliqué (ex: `super_secret_key_prod_123`).

7.  Validez le déploiement.

## 🌍 C'est TOUT !

Render va maintenant :
1.  Construire le conteneur Backend.
2.  Construire le conteneur Frontend.
3.  Les mettre en ligne automatiquement.

Vous aurez deux liens :
*   `https://nizari-backend.onrender.com` (API)
*   `https://nizari-frontend.onrender.com` (Site Web)

---

## 💡 Note sur le Frontend

Si votre Frontend sur Render est trop lent (car l'offre gratuite "s'endort" après 15min d'inactivité), vous pouvez toujours déployer le dossier `frontend` sur **Vercel** comme avant. Mais la méthode Docker sur Render est la plus simple car tout est configuré !
