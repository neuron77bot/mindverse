# 🔧 Tareas Backend - Prompt Style Preview

## Asignación: Equipo Backend

---

## Task 1: Actualizar Modelo PromptStyleTag ⚡
**Prioridad:** Alta | **Estimación:** 15 min

**Archivo:** `backend/src/models/PromptStyleTag.ts`

**Cambios:**
```typescript
previewImageUrl?: string;  // URL de imagen de preview generada
```

**Checklist:**
- [ ] Agregar campo `previewImageUrl` al schema de Mongoose
- [ ] Campo debe ser opcional (tipo `String`, no required)
- [ ] Verificar compatibilidad con documentos existentes
- [ ] Commit: `feat(backend): add previewImageUrl to PromptStyleTag model`

---

## Task 2: Endpoint Generar Preview ⚡⚡
**Prioridad:** Alta | **Estimación:** 45 min

**Archivo:** `backend/src/routes/promptStyles.ts`

**Endpoint nuevo:**
```
POST /prompt-styles/:id/generate-preview
```

**Request Body:**
```json
{
  "galleryTags": ["tag1", "tag2"]  // opcional
}
```

**Response:**
```json
{
  "success": true,
  "previewImageUrl": "https://fal.media/files/abc123.png",
  "message": "Preview generado exitosamente"
}
```

**Lógica de implementación:**
1. Buscar prompt style por ID (`PromptStyleTag.findById`)
2. Si no existe → `404 Not Found`
3. Construir prompt base desde `style.promptText`
4. **Si hay `galleryTags`:**
   - Llamar `POST /images/image-to-image` interno
   - Pasar `gallery_tags` y `prompt`
5. **Si NO hay tags:**
   - Llamar `POST /images/text-to-image` interno
   - Solo con `prompt`
6. Extraer `imageUrl` del response
7. Actualizar documento: `style.previewImageUrl = imageUrl`
8. `.save()`
9. Retornar `{ success: true, previewImageUrl, message }`

**Checklist:**
- [ ] Endpoint implementado con validaciones
- [ ] Manejo de errores (404, 500)
- [ ] Autenticación con JWT (middleware)
- [ ] Documentación Swagger actualizada
- [ ] Test con Postman/curl (con y sin galleryTags)
- [ ] Commit: `feat(backend): add generate-preview endpoint for prompt styles`

---

## Task 3: Actualizar CRUD Endpoints ⚙️
**Prioridad:** Media | **Estimación:** 20 min

**Archivo:** `backend/src/routes/promptStyles.ts`

**Endpoints a actualizar:**

### GET `/prompt-styles`
- Incluir `previewImageUrl` en response de cada tag

### GET `/prompt-styles/:id`
- Incluir `previewImageUrl` en response

### PATCH `/prompt-styles/:id`
- Permitir actualizar `previewImageUrl` manualmente (opcional)

**Checklist:**
- [ ] Todos los endpoints retornan `previewImageUrl`
- [ ] Schema de Swagger actualizado con nuevo campo
- [ ] No rompe respuestas existentes (backward compatible)
- [ ] Test con datos con y sin previewImageUrl
- [ ] Commit: `feat(backend): include previewImageUrl in CRUD endpoints`

---

## Task 4: Endpoint Eliminar Preview 🗑️
**Prioridad:** Baja | **Estimación:** 15 min

**Archivo:** `backend/src/routes/promptStyles.ts`

**Endpoint nuevo:**
```
DELETE /prompt-styles/:id/preview
```

**Response:**
```json
{
  "success": true,
  "message": "Preview eliminado"
}
```

**Lógica:**
1. Buscar style por ID
2. Si no existe → `404`
3. Establecer `previewImageUrl` a `null` o `undefined`
4. `.save()`
5. Retornar success

**Checklist:**
- [ ] Endpoint funcional
- [ ] Actualiza documento correctamente
- [ ] Retorna 404 si style no existe
- [ ] Documentación Swagger
- [ ] Commit: `feat(backend): add delete-preview endpoint`

---

## 🧪 Testing Backend

### Test Manual con curl/Postman

**1. Generar preview sin gallery tags:**
```bash
POST http://localhost:3001/prompt-styles/{id}/generate-preview
Body: {}
```

**2. Generar preview con gallery tags:**
```bash
POST http://localhost:3001/prompt-styles/{id}/generate-preview
Body: { "galleryTags": ["personajes", "paisajes"] }
```

**3. Verificar en GET:**
```bash
GET http://localhost:3001/prompt-styles/{id}
# Debe incluir previewImageUrl
```

**4. Eliminar preview:**
```bash
DELETE http://localhost:3001/prompt-styles/{id}/preview
```

### Checklist de Testing
- [ ] Preview generado sin tags → URL válida
- [ ] Preview generado con tags → URL válida
- [ ] Error 404 cuando ID no existe
- [ ] GET retorna previewImageUrl correctamente
- [ ] DELETE elimina preview correctamente
- [ ] Documento se actualiza en MongoDB

---

## 📦 Dependencias

**Antes de empezar:**
- ✅ Modelo `PromptStyleTag` ya existe
- ✅ Endpoint `/images/text-to-image` funcional
- ✅ Endpoint `/images/image-to-image` funcional
- ✅ fal.ai configurado

**Ninguna dependencia externa nueva requerida.**

---

## 🚀 Orden de Implementación

1. **Task 1** (modelo) → Base fundamental
2. **Task 2** (generar preview) → Funcionalidad core
3. **Task 3** (CRUD update) → Integración
4. **Task 4** (eliminar) → Nice to have

---

## 📝 Notas de Implementación

### Reutilizar Lógica Existente
- El endpoint de generar preview puede reutilizar la misma lógica de generación de imágenes de storyboards
- Ya tenemos los endpoints `/images/text-to-image` y `/images/image-to-image`
- Solo necesitamos llamarlos internamente

### Prompt para Preview
- Usar `promptText` del style tag como base
- No agregar texto adicional, el estilo ya está definido en `promptText`
- Ratio: `1:1` (cuadrado) para thumbnails

### Error Handling
```typescript
try {
  // lógica
} catch (error: any) {
  return reply.status(500).send({ 
    success: false, 
    error: error.message || 'Error generando preview' 
  });
}
```

---

## ✅ Definition of Done (Backend)

- [ ] Task 1 completada y commiteada
- [ ] Task 2 completada y commiteada
- [ ] Task 3 completada y commiteada
- [ ] Task 4 completada y commiteada
- [ ] Todos los endpoints documentados en Swagger
- [ ] Tests manuales pasados
- [ ] Build exitoso (`npm run build`)
- [ ] Docker rebuild exitoso
- [ ] No hay TypeScript errors
- [ ] Code review aprobado
- [ ] Merge a `feature/prompt-style-preview`

---

**Tiempo estimado total: ~1.5 horas**

¡Buena suerte! 💪
