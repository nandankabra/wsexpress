# Build context: repository root (needs access to common/ and package.json for the workspace)
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
COPY common ./common
COPY services/graphql-service ./services/graphql-service

RUN npm install --workspace=@shiptrack/common --workspace=graphql-service --omit=dev

WORKDIR /app/services/graphql-service

EXPOSE 8011
CMD ["node", "src/server.js"]
