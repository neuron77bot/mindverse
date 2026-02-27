FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Podar devDependencies en el mismo stage
RUN npm prune --omit=dev

FROM node:20-slim

WORKDIR /app

# Copiar node_modules ya podados (sin devDeps) desde el build stage
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

# Copiar código compilado
COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
