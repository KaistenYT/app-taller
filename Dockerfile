FROM node:20-slim

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# Copiar el resto del código del backend y archivos de configuración
COPY backend ./backend
COPY knexfile.js ./
COPY .env* ./

# Puerto que expone el backend
EXPOSE 3001

# Comando para ejecutar migraciones y luego iniciar el servidor
CMD npx knex migrate:latest && npm run server
