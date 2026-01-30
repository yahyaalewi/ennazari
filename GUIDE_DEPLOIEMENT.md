# 🚀 Guide de Déploiement sur Railway

Railway est une excellente alternative à Render, offrant souvent de meilleures performances et une configuration plus simple pour les projets Docker.

## 📋 Prérequis

1.  Un compte GitHub avec votre code poussé (`git push`).
2.  Un compte sur [Railway.app](https://railway.app/).

---

## 🏗️ Étape 1 : Créer le Projet et la Base de Données

1.  Allez sur votre tableau de bord Railway.
2.  Cliquez sur **"New Project"**.
3.  Choisissez **"Provision MongoDB"**.
    *   Cela va créer une base de données MongoDB prête à l'emploi.
4.  Une fois la base créée, cliquez dessus, allez dans l'onglet **Connect**, et copiez l'URL de connexion (**Mongo Connection URL**).
    *   *Note : Vous n'avez pas besoin de copier le mot de passe séparément, l'URL complète suffit.*

---

## 🔙 Étape 2 : Déployer le Backend

1.  Dans le même projet Railway, cliquez sur le bouton **"New"** (ou clic droit sur le fond vide) -> **"GitHub Repo"**.
2.  Sélectionnez votre dépôt `nizari`.
3.  **IMPORTANT** : Ne laissez pas Railway déployer tout de suite, ou s'il le fait, ce n'est pas grave, nous devons le configurer.
4.  Cliquez sur la nouvelle "brique" qui représente votre dépôt.
5.  Allez dans **Settings** :
    *   Faites défiler jusqu'à **Root Directory** et écrivez : `/backend`
    *   Cela indique à Railway que le code (et le Dockerfile) se trouve dans ce dossier.
6.  Allez dans **Variables** :
    *   Ajoutez `MONGO_URI` : Collez l'URL de connexion MongoDB copiée à l'étape 1.
    *   Ajoutez `JWT_SECRET` : Une chaîne de caractères secrète (ex: `votre_secret_tres_long_et_complexe`).
    *   Ajoutez `PORT` : `5000` (Optionnel, mais recommandé).
7.  Allez dans **Networking** (ou l'onglet Settings -> Networking) :
    *   Cliquez sur **Generate Domain**.
    *   Copiez ce domaine (ex: `nizari-backend-production.up.railway.app`). C'est l'adresse de votre API.

*Le Backend va se redéployer. Attendez que le statut soit "Active".*

---

## 🎨 Étape 3 : Configurer et Déployer le Frontend

C'est l'étape cruciale. Le Frontend doit connaître l'adresse du Backend **AVANT** d'être construit.

### 1. Mettre à jour le code Angular
1.  Ouvrez votre projet localement.
2.  Allez dans le fichier `frontend/src/environments/environment.prod.ts`.
3.  Remplacez l'ancienne URL Render par votre nouvelle URL Backend Railway :
    ```typescript
    export const environment = {
      production: true,
      apiUrl: 'https://votre-nouveau-domaine-backend.up.railway.app/api' // <-- Attention au /api à la fin !
    };
    ```
4.  Sauvegardez, commitez et pushez sur GitHub :
    ```bash
    git add .
    git commit -m "Update API URL for Railway"
    git push origin main
    ```

### 2. Créer le service Frontend sur Railway
1.  Retournez sur votre projet Railway.
2.  Cliquez sur **"New"** -> **"GitHub Repo"**.
3.  Sélectionnez **LE MÊME** dépôt `nizari`. (Vous aurez maintenant deux services liés au même dépôt).
4.  Cliquez sur cette nouvelle brique (qui sera le Frontend).
5.  Allez dans **Settings** :
    *   **Root Directory** : Écrivez `/frontend`
    *   (Railway détectera automatiquement le `Dockerfile` dans le dossier frontend).
6.  Allez dans **Networking** :
    *   Cliquez sur **Generate Domain**.
    *   C'est l'adresse de votre site web !

---

## ✅ Vérification

1.  Ouvrez l'URL de votre Frontend.
2.  Essayez de vous connecter.
3.  Si tout fonctionne, bravo ! Votre application est entièrement hébergée sur Railway.

## 💡 Astuce
Si vous faites des modifications sur le Backend plus tard, Railway le redéploiera automatiquement. Idem pour le Frontend.
