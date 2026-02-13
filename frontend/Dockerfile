# Frontend Dockerfile - Raspberry Pi (ARM64) kompatibel
# Multi-stage build für optimale Image-Größe

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Setze Backend-URL für den Build (API calls gehen über Nginx Proxy)
ENV REACT_APP_BACKEND_URL=

# Yarn aktivieren (Corepack ist in Node 20 integriert)
RUN corepack enable

# Install dependencies (yarn.lock optional)
COPY package.json ./
RUN yarn install

# Copy source and build
COPY . .
RUN yarn build

# Stage 2: Production mit Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config für SPA routing und API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
