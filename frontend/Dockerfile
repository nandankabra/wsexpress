FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV API_GATEWAY_URL=http://api-gateway:8000
ENV NGINX_ENVSUBST_FILTER=API_GATEWAY_URL
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template


# nginx's `listen 80;` is IPv4-only (unlike Node's dual-stack default bind used by every other
# service here), and this container's /etc/hosts resolves "localhost" to ::1 first - so
# wget-via-localhost hits connection-refused on IPv6 before ever trying IPv4. Target
# 127.0.0.1 explicitly to sidestep that.
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
