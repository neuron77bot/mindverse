# Mindverse

Mind mapping tool con análisis de pensamientos mediante IA, generación de imágenes, autenticación Google OAuth, y persistencia MongoDB.

## Stack Técnico

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: Fastify
- **Base de datos**: MongoDB 7 (Mongoose)
- **Auth**: Google OAuth + JWT
- **IA**: Gemini 2.5 Flash (análisis), fal.ai (imágenes, transcripción)
- **Deployment**: Docker Compose

### Frontend
- **Framework**: React 18 + TypeScript
- **Build tool**: Vite 7
- **Router**: React Router DOM
- **Estado**: Zustand (con persist)
- **UI**: Tailwind CSS
- **Visualización**: React Flow, Mermaid

## Arquitectura

### Modelo de Datos

**Thought** (Pensamiento):
- `userId`: Google ID del propietario
- `content`: Contenido principal
- `description`: Descripción opcional
- `category`: Categoría del pensamiento
- `temporalState`: Estado temporal (pasado/presente/futuro)
- `emotionalLevel`: Nivel emocional (0-1000, escala Hawkins)
- `positionX`, `positionY`: Coordenadas en el canvas
- `color`: Color del nodo
- `isRoot`: Indica si es pensamiento raíz (visible en HomeView)
- `imageUrl`: URL de imagen generada (opcional)
- `tags[]`: Etiquetas personalizadas
- `isFavorite`: Marcador de favorito
- `connections[]`: Conexiones con otros nodos
- `inNodeIds[]`: IDs de nodos entrantes
- `outNodeIds[]`: IDs de nodos salientes

**User**:
- `googleId`: ID único de Google
- `name`, `email`, `picture`: Datos de perfil
- `bio`, `location`: Información adicional
- `lastLogin`: Última sesión

### Funcionalidades Principales

#### 1. Análisis de Pensamientos con IA

**Provider configurables** (via `LLM_PROVIDER` en `.env`):
- **Gemini 2.5 Flash** (default) - Google AI
- **Claude** (Anthropic SDK) - Alternativa premium
- **fal.ai Llama 3.3 70B** - Alternativa open source

**Endpoint**: `POST /transcription/analyze`

**Input**: 
```json
{
  "text": "Pensamiento o idea a analizar"
}
```

**Output**:
```json
{
  "success": true,
  "steps": [
    {
      "step": "Descripción del paso",
      "actions": ["Acción 1", "Acción 2"]
    }
  ],
  "mermaid": "flowchart TD\n  Start([Inicio])\n  ...",
  "duration": 1234
}
```

**Visualización**:
- Lista de pasos con acciones (badges numerados + flechas)
- Diagrama Mermaid flowchart automático
- Colores alto contraste: texto negro sobre fondos brillantes (azul, verde, amarillo)

#### 2. Transcripción de Audio

**Provider**: fal.ai Whisper

**Endpoint**: `POST /transcription`

**Input**: Archivo de audio (multipart/form-data)

**Output**:
```json
{
  "success": true,
  "text": "Transcripción del audio",
  "duration": 987
}
```

#### 3. Generación de Imágenes

**Provider**: fal.ai

**Endpoints**:
- `POST /images/text-to-image` - Genera imagen desde texto
- `POST /images/image-to-image` - Genera imagen desde imagen de referencia
- `POST /images/upload` - Sube imagen directa

**Parámetros**:
- `prompt`: Descripción de la imagen
- `image_url`: URL de referencia (image-to-image)
- `strength`: Intensidad de transformación (0-1)
- `num_inference_steps`: Pasos de inferencia
- `guidance_scale`: Escala de guía

#### 4. Sistema de Jerarquías (isRoot)

**Reglas**:
- **Crear desde Home**: `isRoot=true`, IN/OUT ocultos
- **Crear desde Detail** (agregar paso): `isRoot=false`, IN preseleccionado con nodo padre
- **HomeView**: Solo muestra pensamientos con `isRoot=true`
- **isRoot es inmutable**: Se define en creación, no se puede cambiar después

**Conexiones**:
- `inNodeIds[]`: Nodos que apuntan a este (padres)
- `outNodeIds[]`: Nodos a los que apunta este (hijos)
- BFS traversal para calcular pasos descendientes

#### 5. Autenticación Multi-tenancy

**Flujo**:
1. Frontend obtiene Google credential (OAuth)
2. `POST /auth/google` verifica token y genera JWT
3. JWT se almacena en `localStorage.mv_token`
4. Todas las requests incluyen `Authorization: Bearer <token>`
5. Middleware verifica JWT y extrae `userId` (googleId)
6. Todas las queries filtran por `userId` automáticamente

## Configuración

### Variables de Entorno

**Backend** (`.env`):
```bash
# fal.ai
FAL_KEY=your_fal_ai_key

# Server
PORT=3001

# MongoDB
MONGO_URI=mongodb://mindverse:mindverse@mongo:27017/mindverse?authSource=admin

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# JWT
JWT_SECRET=your_32_byte_hex_secret

# LLM Provider (gemini | claude | fal)
LLM_PROVIDER=gemini

# API Keys
GEMINI_API_KEY=your_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key  # Solo si usas Claude
```

**Frontend** (`.env`):
```bash
VITE_API_BASE_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

## Desarrollo

### Backend

```bash
cd backend
npm install
npm run dev  # ts-node-dev con hot reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev  # Vite dev server
```

### Producción (Docker)

```bash
# Build y levantar servicios
docker compose up -d --build

# Ver logs
docker compose logs backend --tail=50

# Restart
docker compose restart backend

# Status
docker compose ps
```

**Servicios**:
- `backend`: Node.js + Fastify (puerto 3001)
- `mongo`: MongoDB 7 (puerto 27017)

**Volúmenes**:
- `mindverse_mongo_data`: Persistencia de MongoDB

### Deploy Frontend

Después de cambios en frontend, **siempre rebuild**:

```bash
cd frontend
npm run build
```

El build genera `dist/` que Nginx sirve en `/mindverse/`

## API Documentation

Swagger UI disponible en: `http://localhost:3001/docs`

**Tags principales**:
- `auth`: Autenticación Google OAuth
- `thoughts`: CRUD de pensamientos
- `users`: Gestión de usuarios
- `images`: Generación de imágenes
- `transcription`: Análisis y transcripción

## Decisiones de Diseño

### Por qué Docker en backend
- Builds rápidos (~22s vs ~150s+ con compilación local)
- Entorno reproducible
- Fácil deployment
- Gestión unificada con MongoDB

### Por qué fal.ai Whisper (no local)
- Menor tiempo de build (sin ffmpeg/git/build-essential)
- Sin dependencias de compilación
- API confiable y rápida
- Menor tamaño de imagen Docker

### Por qué Gemini 2.5 Flash (default)
- Balance costo/calidad
- Respuestas rápidas
- Buen soporte de español
- Alternativas disponibles (Claude, fal.ai)

### Por qué BFS para traversal
- Garantiza nivel de profundidad correcto
- Evita ciclos infinitos
- Permite contar pasos descendientes
- Eficiente para grafos conectados

### Por qué isRoot inmutable
- Simplifica lógica de UI (no hay toggle visible)
- Evita inconsistencias (raíz que se vuelve hijo)
- Fuerza intención clara en creación
- HomeView siempre muestra nivel correcto

## Troubleshooting

### Backend no conecta a MongoDB
```bash
# Verificar que mongo esté corriendo
docker compose ps

# Ver logs de mongo
docker compose logs mongo

# Recrear contenedores
docker compose down
docker compose up -d
```

### Frontend no carga pensamientos
1. Verificar que backend esté corriendo: `curl http://localhost:3001/`
2. Verificar token JWT en localStorage: `localStorage.getItem('mv_token')`
3. Verificar que usuario esté autenticado
4. Ver Network tab en DevTools para ver errores de API

### Análisis con IA falla
1. Verificar que `LLM_PROVIDER` esté configurado en `.env`
2. Verificar que la API key correspondiente esté presente
3. Ver logs del backend: `docker compose logs backend --tail=50`
4. Probar con provider alternativo

### Build de frontend lento
- Chunk size warnings son normales (Mermaid es grande)
- Considerar lazy loading de Mermaid si afecta performance
- Build inicial siempre toma ~8-10s

## Licencia

Privado - Matius (@MatiusDev)
