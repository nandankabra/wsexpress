# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/api-gateway ./services/api-gateway

RUN npm install --workspace=@shiptrack/common --workspace=api-gateway --omit=dev

WORKDIR /app/services/api-gateway

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:8000/health || exit 1

EXPOSE 8000
CMD ["node", "src/server.js"]
