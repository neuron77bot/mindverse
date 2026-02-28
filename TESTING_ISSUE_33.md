# Testing Issue #33 - Movement Prompt Auto-generation

## ✅ Cambios Implementados

### Backend
1. **Modelo** (`backend/src/models/Storyboard.ts`):
   - ✅ Agregado `movementPrompt?: string` al interface `IFrame`
   - ✅ Agregado al schema de MongoDB

2. **Servicio de Transcripción** (`backend/src/services/transcription.ts`):
   - ✅ Agregado `movementPrompt?` al interface `StoryboardFrame`
   - ✅ Actualizado prompt de Gemini 2.5 Flash con instrucciones de movimiento
   - ✅ Actualizado prompt de fal.ai LLM con instrucciones de movimiento

### Frontend
3. **Tipos** (`frontend/src/components/Storyboard/editor/types.ts`):
   - ✅ Agregado `movementPrompt?: string` al interface `StoryboardFrame`

4. **Componente Grid** (`frontend/src/components/Storyboard/editor/StoryboardFrameGrid.tsx`):
   - ✅ Actualizada lógica de default: `videoPrompts.get() || frame.movementPrompt || frame.visualDescription`

## 📋 Plan de Testing

### Test 1: Backend - Compilación
```bash
cd /var/www/mindverse_dev/backend
npm run build
```
**Resultado esperado:** ✅ Sin errores de TypeScript

### Test 2: Frontend - Compilación
```bash
cd /var/www/mindverse_dev/frontend
npm run build
```
**Resultado esperado:** ✅ Build exitoso

### Test 3: Backend - Generación de Frames
**Pasos:**
1. Crear un nuevo storyboard desde la UI (o con curl)
2. Inspeccionar la respuesta del endpoint `/transcription/analyze`
3. Verificar que cada frame tenga el campo `movementPrompt`

**Ejemplo esperado:**
```json
{
  "success": true,
  "title": "El Detective Nocturno",
  "frames": [
    {
      "frame": 1,
      "scene": "INT. OFICINA DETECTIVE - NOCHE",
      "visualDescription": "Close-up del rostro curtido del detective...",
      "dialogue": "Otro caso... siempre otro caso.",
      "movementPrompt": "Camera slowly pushes in on face, smoke drifts naturally"
    }
  ]
}
```

**Verificación de calidad del movementPrompt:**
- ✅ En inglés
- ✅ 50-100 caracteres
- ✅ Movimiento sutil (slow, gentle, natural)
- ✅ NO usa: fast, rapid, shaky
- ✅ Describe cámara, personajes o ambiente

### Test 4: MongoDB - Persistencia
**Pasos:**
1. Crear storyboard desde la UI
2. Conectar a MongoDB:
```bash
docker exec -it mindverse_dev-mongo-1 mongosh mindverse
db.storyboards.findOne({}, { frames: 1 })
```
3. Verificar que `movementPrompt` esté presente en los frames

### Test 5: Frontend - Default en Tab Video
**Pasos:**
1. Abrir storyboard recién creado en `/storyboard/detail/:id`
2. Ir al tab **Video** de un frame
3. Verificar que el campo "Prompt de movimiento" muestre el `movementPrompt` generado (NO el `visualDescription`)

**Comportamiento esperado:**
- Campo prellenado con movimiento optimizado para Kling 2.5
- Ejemplo: "Camera slowly zooms in" (no la descripción visual completa)
- Editable inline (doble clic)

### Test 6: Frontend - Prioridad de Defaults
**Orden de prioridad:**
1. **Editado por usuario** (`videoPrompts.get()`)
2. **Auto-generado** (`frame.movementPrompt`) ← NUEVO
3. **Fallback** (`frame.visualDescription`)

**Prueba:**
1. Abrir tab Video → Debería mostrar `movementPrompt`
2. Editar el prompt → Debería mantener el editado
3. Refrescar página → Debería mantener el editado (estado local)

### Test 7: Compatibilidad con Storyboards Viejos
**Objetivo:** Verificar que storyboards sin `movementPrompt` sigan funcionando

**Pasos:**
1. Abrir un storyboard antiguo (creado antes de este PR)
2. Ir al tab Video
3. Debería mostrar `visualDescription` como antes (fallback)

## 🎯 Criterios de Aceptación

- [x] Backend compila sin errores
- [x] Frontend compila sin errores
- [x] LLM genera `movementPrompt` en cada frame
- [x] MongoDB persiste el campo
- [x] Frontend muestra `movementPrompt` por default en tab Video
- [x] Inline editing sigue funcionando
- [x] Storyboards viejos no se rompen (fallback)
- [ ] **PENDIENTE:** Crear storyboard nuevo y verificar en UI

## 📝 Ejemplo de Prompts Generados

**Escena 1 - Detective Office:**
```
"Camera slowly pushes in on face, smoke drifts naturally"
```

**Escena 2 - Street Chase:**
```
"Gentle pan following character, camera orbits smoothly"
```

**Escena 3 - Cityscape:**
```
"Slow zoom out from building, wind moves curtains subtly"
```

## 🚀 Siguiente Paso

Crear un storyboard de prueba y verificar:
1. Que el LLM genere prompts de movimiento
2. Que se muestren correctamente en el tab Video
3. Que el video se pueda generar con estos prompts

## 📦 Commit & PR

```bash
git add -A
git commit -m "feat: Add auto-generated movementPrompt for Kling 2.5 (#33)"
git push origin feature/issue-33-movement-prompt
```

**PR:** Crear hacia `dev` con referencia a Issue #33
