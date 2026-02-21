FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-slim

WORKDIR /app

# Instalar dependencias para transcripción
RUN apt-get update && apt-get install -y \
    ffmpeg \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Instalar whisper-cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git /tmp/whisper \
    && cd /tmp/whisper \
    && make -j \
    && cp main /usr/local/bin/whisper-cli \
    && rm -rf /tmp/whisper

# Crear directorio para modelos
RUN mkdir -p /app/whisper-models

# Copiar dependencias de Node
COPY package*.json ./
RUN npm install --omit=dev

# Copiar código compilado
COPY --from=build /app/dist ./dist

# Copiar script de transcripción
COPY transcribe-audio.sh /usr/local/bin/transcribe-audio.sh
RUN chmod +x /usr/local/bin/transcribe-audio.sh

EXPOSE 3001

CMD ["node", "dist/index.js"]
