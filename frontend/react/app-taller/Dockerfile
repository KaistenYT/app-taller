# Etapa de construcción (Build)
FROM node:20-slim AS build

WORKDIR /app

# Copiar archivos de dependencias del frontend
COPY frontend/react/app-taller/package*.json ./
RUN npm install

# Copiar el resto del código del frontend
COPY frontend/react/app-taller/ ./

# Argumentos de entorno (para que Vite los use al construir)
ARG VITE_API_URL=http://localhost:3001
ENV VITE_API_URL=$VITE_API_URL

# Construir para producción
RUN npm run build

# Etapa de ejecución (Nginx)
FROM nginx:alpine

# Copiar los archivos construidos desde la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Configuración personalizada de Nginx (opcional, para manejar rutas de React)
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
