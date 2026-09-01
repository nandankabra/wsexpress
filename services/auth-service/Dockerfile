# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/auth-service ./services/auth-service

RUN npm install --workspace=@shiptrack/common --workspace=auth-service --omit=dev

WORKDIR /app/services/auth-service

EXPOSE 8001
CMD ["node", "src/server.js"]
