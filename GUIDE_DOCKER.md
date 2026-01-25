# 🐳 Guide Docker - Ennazari

Ce guide vous explique comment utiliser Docker pour exécuter l'application **Ennazari** (Frontend + Backend + Base de données) en local avec une seule commande.

## 📋 Prérequis

1.  Avoir [Docker Desktop](https://www.docker.com/products/docker-desktop) installé et paramétré pour utiliser les conteneurs Linux.

## 🚀 Lancement Rapide

1.  Ouvrez votre terminal à la racine du projet `nizari`.
2.  Lancez le script magique (Windows) simple :

```powershell
docker-compose up --build
```

**Note :** Le premier lancement peut prendre quelques minutes pour télécharger les images et construire l'application.

## 🌍 Accéder à l'application

Une fois que vous voyez `Listening on port 80` (frontend) et `Server running on port 5000` (backend) :

*   **Application Web** : [http://localhost:8080](http://localhost:8080)
*   **API Backend** : [http://localhost:5000](http://localhost:5000)

## 🌱 Initialiser les données (Seed)

Au premier lancement, la base de données est vide (pas d'utilisateurs, pour se connecter). Pour ajouter des données de test :

1.  Ouvrez un **nouveau** terminal (laissez l'autre tourner).
2.  Exécutez la commande suivante pour lancer le script `seed.js` à l'intérieur du conteneur `backend` :

```powershell
docker-compose exec backend node seed.js
```

Cela va créer :
*   Direteur: `ennazariDirecteur@ennazari.com` / `R27076535R`
*   Profs et élèves de test.

## 🛑 Arrêter l'application

Pour arrêter, faites `CTRL + C` dans le terminal où ça tourne, ou :

```powershell
docker-compose down
```

## ⚙️ Détails Techniques

*   **Persistance** :
    *   Les **données** (MongoDB) sont stockées dans le volume `mongo-data`.
    *   Les **uploads** (docs, photos) sont stockés dans le volume `backend-uploads`.
    *   Même si vous supprimez les conteneurs, les données restent.
*   **Réseau** :
    *   Frontend -> Backend : via Nginx proxy `/api` -> `http://backend:5000`
    *   Backend -> MongoDB : via réseau interne `mongodb://mongo:27017`

### Commandes Utiles

*   **Voir les logs** : `docker-compose logs -f`
*   **Supprimer tout (même les données)** : `docker-compose down -v`
