# 🚀 Guide de Déploiement Complet - Projet Ennazari

Ce guide vous explique étape par étape comment mettre en ligne votre application **Ennazari** gratuitement en utilisant **GitHub**, **Render** (pour le Backend) et **Vercel** (pour le Frontend).

---

## 📋 Prérequis

1.  Un compte [GitHub](https://github.com/).
2.  Un compte [Render](https://render.com/) (Connectez-vous avec GitHub).
3.  Un compte [Vercel](https://vercel.com/) (Connectez-vous avec GitHub).
4.  Votre base de données MongoDB Atlas prête (vous avez déjà l'URL de connexion).

---

## 📦 Étape 1 : Préparation du Code pour la Production

Avant de déployer, nous devons nous assurer que le Frontend peut se connecter au Backend une fois en ligne.

### 1.1 Modifier le fichier d'environnement Frontend
Dans le fichier `frontend/src/environments/environment.ts` (ou créez-le s'il n'existe pas), ajoutez :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://votre-backend-sur-render.onrender.com/api' // On mettra la vraie URL plus tard
};
```

### 1.2 Modifier `ApiConstants.ts`
Dans `frontend/src/app/core/constants/api.constants.ts`, modifiez la ligne `baseUrl` pour utiliser l'environnement :

```typescript
import { environment } from '../../../environments/environment';

export const ApiConstants = {
    baseUrl: environment.apiUrl, 
    // ... le reste ne change pas
};
```
*(Si vous ne voulez pas gérer les fichiers d'environnement maintenant, vous pourrez modifier ce fichier directement avec la nouvelle URL du backend une fois qu'il sera déployé).*

---

## 🐙 Étape 2 : Mettre le code sur GitHub

1.  Allez sur [GitHub](https://github.com/new) et créez un **nouveau repository** (nommez-le `ennazari-app` par exemple). Cochez "Public" ou "Private".
2.  Sur votre ordinateur, ouvrez le terminal dans le dossier racine du projet `nizari`.
3.  Exécutez ces commandes :

```bash
git init
git add .
git commit -m "Déploiement initial Ennazari"
git branch -M main
git remote add origin https://github.com/VOTRE_NOM_UTILISATEUR/ennazari-app.git
git push -u origin main
```
*Remplacez `VOTRE_NOM_UTILISATEUR` et le nom du repo par les vôtres.*

---

## 🛠️ Étape 3 : Déployer le Backend (sur Render)

Render va héberger votre serveur Node.js.

1.  Allez sur le [Dashboard Render](https://dashboard.render.com/).
2.  Cliquez sur **New +** et sélectionnez **Web Service**.
3.  Connectez votre repo GitHub `ennazari-app`.
4.  Configurez les paramètres suivants :
    *   **Name** : `ennazari-backend`
    *   **Root Directory** : `backend` (Très important, car votre backend est dans un sous-dossier).
    *   **Environment** : `Node`
    *   **Build Command** : `npm install`
    *   **Start Command** : `node server.js`
5.  Descendez vers la section **Environment Variables** et ajoutez :
    *   `MONGO_URI` : *(Copiez votre lien de connexion MongoDB Atlas complet)*
    *   `JWT_SECRET` : *(Inventez un mot de passe secret compliqué)*
    *   `PORT` : `5000` (Render l'utilisera en interne)
6.  Cliquez sur **Create Web Service**.

⏳ **Attendez** que le déploiement se termine. Une fois fini, Render vous donnera une URL du type `https://ennazari-backend.onrender.com`.

**⚠️ Important :** Copiez cette URL, vous en aurez besoin pour le Frontend !

---

## 🌐 Étape 4 : Déployer le Frontend (sur Vercel)

Vercel va héberger votre site Angular.

1.  **Mettez à jour le Backend URL** :
    *   Revenez sur votre code local.
    *   Modifiez `frontend/src/app/core/constants/api.constants.ts`.
    *   Remplacez `http://localhost:5000/api` par `https://votre-url-render.onrender.com/api`.
    *   Faites un nouveau commit et push sur GitHub :
        ```bash
        git add .
        git commit -m "Update API URL for production"
        git push
        ```

2.  Allez sur le [Dashboard Vercel](https://vercel.com/dashboard).
3.  Cliquez sur **Add New...** > **Project**.
4.  Importez votre repo `ennazari-app`.
5.  Configurez le projet :
    *   **Root Directory** : Cliquez sur `Edit` et sélectionnez le dossier `frontend`.
    *   **Framework Preset** : Vercel détectera normalement **Angular** automatiquement.
6.  Cliquez sur **Deploy**.

---

## 🎉 C'est fini !

Une fois Vercel a terminé :
1.  Il vous donnera un lien (domaine) pour votre site (ex: `ennazari-app.vercel.app`).
2.  Ouvrez ce lien : Votre application est maintenant accessible par tout le monde !

### Récapitulatif des URLs :
*   **Frontend (le site)** : Sur Vercel.
*   **Backend (l'API)** : Sur Render.
*   **Base de données** : Sur MongoDB Atlas.
