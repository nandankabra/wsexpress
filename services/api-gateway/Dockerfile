# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/api-gateway ./services/api-gateway

RUN npm install --workspace=@shiptrack/common --workspace=api-gateway --omit=dev

WORKDIR /app/services/api-gateway

EXPOSE 8000
CMD ["node", "src/server.js"]
