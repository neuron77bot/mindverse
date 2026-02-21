FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-slim

WORKDIR /app

# Copiar dependencias de Node
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código compilado
COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
