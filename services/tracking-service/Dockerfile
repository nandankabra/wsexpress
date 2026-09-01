# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/tracking-service ./services/tracking-service

RUN npm install --workspace=@shiptrack/common --workspace=tracking-service --omit=dev

WORKDIR /app/services/tracking-service

EXPOSE 8005
CMD ["node", "src/server.js"]
