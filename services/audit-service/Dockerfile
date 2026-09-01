# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/audit-service ./services/audit-service

RUN npm install --workspace=@shiptrack/common --workspace=audit-service --omit=dev

WORKDIR /app/services/audit-service

EXPOSE 8009
CMD ["node", "src/server.js"]
