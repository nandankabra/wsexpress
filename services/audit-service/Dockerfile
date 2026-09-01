# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/audit-service ./services/audit-service

RUN npm install --workspace=@shiptrack/common --workspace=audit-service --omit=dev

WORKDIR /app/services/audit-service

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://localhost:8009/health || exit 1

EXPOSE 8009
CMD ["node", "src/server.js"]
