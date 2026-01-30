# Utilisation de l'image officielle OWASP ModSecurity CRS + Nginx (Version Alpine pour la légèreté)
FROM owasp/modsecurity-crs:nginx-alpine

# Passer en root pour installer Node.js
USER root

# Installation de Node.js, NPM et Netcat (pour le healthcheck du port)
RUN apk add --no-cache nodejs npm netcat-openbsd

# Création du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances de production uniquement (plus rapide et sécurisé)
RUN npm ci --omit=dev

# Copie du code source du backend
COPY . .

# Copie de la configuration Nginx personnalisée qui inclut ModSecurity et fait le proxy vers Node
COPY nginx-waf.conf /etc/nginx/conf.d/default.conf

# Copie du script de démarrage
COPY waf-entrypoint.sh /app/waf-entrypoint.sh
# Conversion des fin de lignes (CRLF -> LF) pour éviter les erreurs si le fichier vient de Windows
RUN apk add --no-cache dos2unix && dos2unix /app/waf-entrypoint.sh && chmod +x /app/waf-entrypoint.sh

# Configuration de ModSecurity via variables d'environnement (Réglable sur Render)
# PARANOIA: 1 (Défaut) à 4 (Maximum). 1 est sûr pour commencer.
ENV PARANOIA=1
# BLOCKING_PARANOIA: Niveau à partir duquel on bloque.
ENV BLOCKING_PARANOIA=1

# Script de démarrage qui lance Node.js et Nginx en parallèle
CMD ["/app/waf-entrypoint.sh"]
