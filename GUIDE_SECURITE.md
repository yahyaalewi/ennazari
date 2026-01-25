# Guide de Sécurité pour Ennazari

Ce guide détaille les étapes pour sécuriser l'application Ennazari, en utilisant Cloudflare comme pare-feu applicatif web (WAF) et en appliquant des bonnes pratiques de sécurité.

## Partie 1 : Protection Globale avec Cloudflare (Recommandé)

Cloudflare agit comme un bouclier entre vos utilisateurs et votre serveur. Il protège contre les attaques DDoS, les bots malveillants, et certaines attaques web courantes.

### Étape 1 : Inscription et Configuration
1.  Allez sur [Cloudflare](https://www.cloudflare.com/) et créez un compte gratuit.
2.  Cliquez sur **"Add a Site"** et entrez votre nom de domaine (ex: `ennazari.com`).
3.  Sélectionnez le plan **Free** (Gratuit).
4.  Cloudflare va scanner vos enregistrements DNS existants. Vérifiez qu'ils sont corrects, puis continuez.

### Étape 2 : Changement des Serveurs DNS
1.  Cloudflare vous fournira deux "Nameservers" (ex: `bob.ns.cloudflare.com`, `alice.ns.cloudflare.com`).
2.  Connectez-vous à votre registraire de domaine (là où vous avez acheté le domaine, ex: GoDaddy, Namecheap, OVH).
3.  Trouvez la section de gestion des DNS ou Nameservers.
4.  Remplacez les Nameservers existants par ceux fournis par Cloudflare.
5.  Attendez la propagation (peut prendre de quelques minutes à 24h). Cloudflare vous enverra un email une fois actif.

### Étape 3 : Activation des Protections
Une fois votre site actif sur Cloudflare :
1.  Allez dans l'onglet **Security > WAF**.
2.  Activez les règles gérées (Managed Rules) si disponibles, ou créez des règles de pare-feu personnalisées pour bloquer les pays suspects si votre audience est locale.
3.  Allez dans **Security > Bots** et activez le **Bot Fight Mode**.
4.  Allez dans **Security > Settings** et réglez le "Security Level" sur **Medium** ou **High**.
5.  Allez dans **SSL/TLS** et assurez-vous que le mode est sur **Full (Strict)** si votre serveur a déjà un certificat SSL, ou **Flexible** sinon (déconseillé pour la prod pure, mieux vaut Full).

## Partie 2 : Sécurité Applicative (Backend Node.js)

Ces mesures sont à implémenter ou vérifier dans le code source de l'API.

### 1. Protection contre les attaques par force brute (Rate Limiting)
Nous utilisons `express-rate-limit` pour limiter le nombre de requêtes par IP.
*Vérifiez que ce code est présent dans `backend/src/app.js` ou `server.js` :*

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: 'Trop de requêtes, veuillez réessayer plus tard.'
});

app.use('/api/', limiter);
```

### 2. En-têtes de Sécurité HTTP (Helmet)
Utilisez `helmet` pour définir des en-têtes HTTP sécurisés.

```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 3. Assainissement des Données (NoSQL Injection & XSS)
*   Utilisez `express-mongo-sanitize` pour empêcher l'injection de commandes MongoDB (ex: envoyer `{"$gt": ""}` dans un champ password).
*   Utilisez `xss-clean` pour nettoyer les entrées utilisateur des scripts malveillants.

```javascript
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

app.use(mongoSanitize());
app.use(xss());
```

## Partie 3 : Maintenance et Production

1.  **Variables d'Environnement** : Ne jamais commiter le fichier `.env` sur Git. Assurez-vous que `JWT_SECRET` est une chaîne longue et aléatoire.
2.  **Mises à jour** : Lancez régulièrement `npm audit` pour vérifier les vulnérabilités des dépendances.
3.  **Logs** : En production, évitez les `console.log` qui pourraient exposer des données sensibles. Utilisez une librairie de log comme `winston` ou `morgan`.
4.  **Sauvegardes** : Mettez en place un script automatique pour dumper la base de données MongoDB (`mongodump`) quotidiennement.

## Résumé
En combinant Cloudflare (Front) et les sécurités Node.js (Back), vous obtenez une couverture robuste contre la majorité des attaques sans frais supplémentaires.
