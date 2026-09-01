# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/user-service ./services/user-service

RUN npm install --workspace=@shiptrack/common --workspace=user-service --omit=dev

WORKDIR /app/services/user-service

EXPOSE 8002
CMD ["node", "src/server.js"]
