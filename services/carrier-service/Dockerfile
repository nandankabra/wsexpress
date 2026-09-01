# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/carrier-service ./services/carrier-service

RUN npm install --workspace=@shiptrack/common --workspace=carrier-service --omit=dev

WORKDIR /app/services/carrier-service

EXPOSE 8003
CMD ["node", "src/server.js"]
