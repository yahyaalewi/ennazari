FROM node:20-alpine

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le reste du code source
COPY . .

# Exposer le port défini dans le .env (par défaut 5000)
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]
