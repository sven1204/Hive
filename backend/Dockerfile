FROM node:20-alpine
 
# Créer un user non-root (sécurité)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
 
WORKDIR /app
 
COPY package*.json ./
RUN npm ci --omit=dev
 
COPY . .
 
# Passer sur l'user non-root
USER appuser
 
EXPOSE 5050
CMD ["node", "server.js"]