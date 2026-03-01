# Feature #45: Agregar música de YouTube a video compilado

## Resumen
Permite agregar música de fondo al video compilado extrayendo audio de un video de YouTube.

## Implementación

### Backend

#### 1. Dockerfile
- Instalado `yt-dlp` (reemplazo moderno de youtube-dl)
- Agregadas dependencias: python3 y pip3

#### 2. Servicio youtube-audio.ts
**Ubicación:** `backend/src/services/youtube-audio.ts`

**Funcionalidades:**
- `downloadYoutubeAudio()`: Descarga audio de YouTube usando yt-dlp
- `isValidYoutubeUrl()`: Validación de URLs de YouTube
- `cleanupAudioFile()`: Limpieza de archivos temporales
- Soporte para `startTime`: Permite extraer audio desde un tiempo específico
- Soporte para `duration`: Ajusta la duración del audio extraído

**Flujo:**
1. Descarga el audio completo en formato m4a
2. Obtiene la duración total del audio
3. Extrae el segmento deseado usando ffmpeg con -ss y -t
4. Retorna la ruta del archivo procesado y su duración

#### 3. Modelo Storyboard actualizado
**Campos agregados:**
- `musicYoutubeUrl?: string` - URL del video de YouTube
- `musicStartTime?: number` - Tiempo de inicio en segundos (default: 0)

#### 4. Endpoint /videos/compile actualizado
**Nuevos parámetros opcionales:**
- `youtubeUrl`: URL de YouTube para música de fondo
- `audioStartTime`: Tiempo de inicio del audio en segundos

**Flujo mejorado:**
1. Descarga y concatena videos de frames
2. Si se proporciona `youtubeUrl`:
   - Descarga audio con `downloadYoutubeAudio()`
   - Mezcla audio con video usando ffmpeg filter_complex
   - Balance de volumen: **70% video original + 30% música**
3. Guarda configuración en MongoDB
4. Limpia archivos temporales

**Comando ffmpeg de mezcla:**
```bash
ffmpeg -y \
  -i "${baseVideoPath}" \
  -i "${audioPath}" \
  -filter_complex "[0:a]volume=0.7[a0];[1:a]volume=0.3[a1];[a0][a1]amix=inputs=2:duration=first[aout]" \
  -map 0:v \
  -map "[aout]" \
  -c:v copy \
  -c:a aac \
  -shortest \
  "${outputPath}"
```

### Frontend

#### 1. StoryboardEditor.tsx actualizado
**Estados agregados:**
- `youtubeUrl`: URL de YouTube ingresada
- `audioStartTime`: Tiempo de inicio en segundos

**UI nueva:**
- Sección "Música de Fondo (Opcional)" en tab Video
- Input para URL de YouTube con validación en tiempo real
- Input numérico para tiempo de inicio con descripción clara
- Los campos solo se muestran cuando todos los frames tienen video

**Persistencia:**
- Al cargar storyboard, recupera `musicYoutubeUrl` y `musicStartTime` guardados
- Al compilar, envía parámetros al backend
- Los valores se guardan automáticamente en MongoDB

## Testing Manual Sugerido

### 1. Descarga de audio
```bash
# Entrar al container del backend
docker exec -it mindverse_dev-backend-1 bash

# Probar yt-dlp
yt-dlp --version

# Descargar audio de prueba
yt-dlp -f bestaudio -x --audio-format m4a \
  -o "/tmp/test.m4a" \
  "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

### 2. Flujo completo en UI
1. Crear storyboard con imágenes y videos
2. Ir al tab "Video"
3. Ingresar URL de YouTube válida (ej: https://www.youtube.com/watch?v=...)
4. Especificar tiempo de inicio (ej: 30 para comenzar a los 30 segundos)
5. Click en "Compilar Video"
6. Verificar que el video compilado tiene música de fondo
7. Recargar la página y verificar que los valores persisten

### 3. Validaciones a probar
- URL inválida de YouTube → Error frontend
- URL vacía → Video sin música (comportamiento normal)
- Tiempo de inicio mayor a duración del audio → Error backend
- Video sin audio original + música de YouTube → OK

## Notas Técnicas

- **Formato de audio:** m4a (mejor calidad/tamaño que mp3)
- **Balance de volumen:** Configurable en `youtube-audio.ts` y `videos.ts`
- **Limpieza:** Archivos temporales se eliminan automáticamente
- **Manejo de errores:** Try-catch en todo el flujo con limpieza garantizada
- **Validación:** Frontend y backend validan URLs de YouTube

## Próximas Mejoras Posibles

1. Selector de balance de volumen en UI
2. Preview de audio antes de compilar
3. Soporte para playlists de YouTube
4. Cache de audios descargados frecuentemente
5. Visualización de forma de onda del audio
