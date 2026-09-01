# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/location-service ./services/location-service

RUN npm install --workspace=@shiptrack/common --workspace=location-service --omit=dev

WORKDIR /app/services/location-service

EXPOSE 8007
CMD ["node", "src/server.js"]
