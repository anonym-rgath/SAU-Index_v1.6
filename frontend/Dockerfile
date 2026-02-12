# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine AS builder

WORKDIR /app

# Build argument for backend URL
ARG REACT_APP_BACKEND_URL=/api
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build application
COPY . .
RUN yarn build

# Production image with nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Custom nginx config for SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
