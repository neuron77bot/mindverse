# Testing Manual - Issue #31: Tabs Imagen/Video

## ✅ Checklist de Testing

### 1. Compilación
- [x] `npm run build` exitoso sin errores
- [x] `npx tsc --noEmit` sin errores de TypeScript

### 2. Navegación de Tabs
- [ ] Abrir un storyboard existente en modo edición
- [ ] Verificar que cada frame muestra los tabs 🖼️ Imagen y 🎬 Video
- [ ] Verificar que el tab Imagen está activo por defecto
- [ ] Hacer clic en tab Video, verificar que cambia el contenido
- [ ] Volver a tab Imagen, verificar que mantiene el contenido

### 3. Tab Imagen
#### Campos Editables
- [ ] Doble-clic en "Escena/Título" → debe entrar en modo edición
- [ ] Doble-clic en "Descripción Visual" → debe entrar en modo edición
- [ ] Doble-clic en "Diálogo" → debe entrar en modo edición
- [ ] Editar campos y hacer clic fuera → cambios deben persistir
- [ ] Ctrl+Enter o Cmd+Enter en textareas → sale del modo edición
- [ ] Esc en cualquier campo → sale del modo edición sin guardar

#### Preview y Acciones
- [ ] Si NO hay imagen: muestra placeholder "Generar Imagen"
- [ ] Clic en "Generar Imagen" → abre ImageGenerationModal
- [ ] Si SÍ hay imagen: muestra preview de la imagen
- [ ] Clic en imagen → abre lightbox
- [ ] Botón "Regenerar Imagen" visible y funcional
- [ ] Botón "Descargar Imagen" visible y funcional

### 4. Tab Video
#### Campo Editable
- [ ] Campo "Prompt de movimiento" visible
- [ ] Doble-clic en campo → entra en modo edición
- [ ] Si no hay videoPrompt → defaultea a visualDescription
- [ ] Editar prompt → cambios se guardan localmente
- [ ] Ctrl+Enter o Esc funcionan correctamente

#### Preview y Acciones
**Caso 1: Sin imagen base**
- [ ] Muestra mensaje: "Primero genera una imagen en el tab Imagen"
- [ ] Botón "Generar Video" deshabilitado

**Caso 2: Con imagen base, sin video**
- [ ] Muestra placeholder "Generar Video"
- [ ] Botón "Generar Video" habilitado
- [ ] Clic en "Generar Video" → abre VideoGenerationModal
- [ ] Modal muestra el videoPrompt personalizado (no solo visualDescription)

**Caso 3: Con video generado**
- [ ] Muestra preview del video con controles
- [ ] Botón "Regenerar Video" visible y funcional
- [ ] Botón "Descargar Video" visible y funcional

### 5. VideoGenerationModal
- [ ] Al abrir, el prompt inicial es el videoPrompt (no visualDescription)
- [ ] Si no hay videoPrompt, usa visualDescription como fallback
- [ ] Puede editar el prompt en el modal
- [ ] Generación de video funciona correctamente

### 6. Consistencia Visual
- [ ] Tabs tienen mismo estilo que StoryboardEditor (border-bottom indigo-500 en activo)
- [ ] Transiciones smooth al cambiar de tab
- [ ] Tab activo tiene fondo indigo-500/10
- [ ] Tabs inactivos tienen texto slate-400 con hover a white

### 7. Funcionalidad Existente
- [ ] Inline editing de PR #28 sigue funcionando
- [ ] Batch generation de imágenes funciona
- [ ] Lightbox de imágenes funciona
- [ ] Navegación entre tabs principales (Historia/Frames/Diagrama) funciona
- [ ] Guardar storyboard persiste cambios

## 🐛 Bugs Conocidos
Ninguno detectado durante desarrollo.

## 📝 Notas de Testing
- El estado de tabs (activo) es local por sesión, no se persiste
- Los videoPrompts son locales por sesión, no se persisten en BD (puede agregarse después)
- Si se persisten videoPrompts en el futuro, agregar campo `videoPrompt?: string` al modelo Frame

## 🔄 Para Testing Manual
1. `cd /var/www/mindverse_dev/frontend && npm run dev`
2. Abrir http://localhost:5173
3. Crear o abrir un storyboard
4. Entrar en modo edición
5. Seguir checklist arriba

## 🚀 Para Deploy
1. Verificar que backend está corriendo: `docker compose -f docker-compose.dev.yml up -d`
2. Build frontend: `cd frontend && npm run build`
3. Los assets compilados están en `frontend/dist/`
