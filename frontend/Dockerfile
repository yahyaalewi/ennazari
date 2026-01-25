# Étape 1 : Construction de l'application Angular
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Construire l'application en mode production (par défaut, utilise environment.prod.ts)
RUN npx ng build --configuration production

# Étape 2 : Serveur Nginx pour servir les fichiers statiques
FROM nginx:alpine

# Copier la configuration Nginx de production
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers construits depuis l'étape précédente
COPY --from=build /app/dist/frontend /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
