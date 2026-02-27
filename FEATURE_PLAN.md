# Feature: Prompt Style Preview Images

## 📋 Resumen
Agregar capacidad de generar y mostrar imágenes preview/thumbnail para cada Prompt Style Tag, permitiendo visualizar el estilo aplicado antes de usarlo.

## 🎯 Objetivos
- ✅ Cada prompt style puede tener una imagen de preview
- ✅ Botón para generar/regenerar preview
- ✅ Opción de usar @tags de galería como referencia
- ✅ CRUD completo para gestionar previews

---

## 🔧 Tareas Backend

### Task 1: Actualizar Modelo PromptStyleTag
**Archivo:** `backend/src/models/PromptStyleTag.ts`
**Prioridad:** Alta
**Estimación:** 15 min

**Cambios:**
```typescript
previewImageUrl?: string;  // URL de imagen de preview generada
```

**Acceptance Criteria:**
- [ ] Campo `previewImageUrl` agregado al schema
- [ ] Campo opcional (puede ser undefined)
- [ ] Compatible con documentos existentes

---

### Task 2: Endpoint para Generar Preview
**Archivo:** `backend/src/routes/promptStyles.ts`
**Prioridad:** Alta
**Estimación:** 45 min

**Nuevo endpoint:**
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
  "previewImageUrl": "https://fal.media/files/...",
  "message": "Preview generado exitosamente"
}
```

**Lógica:**
1. Buscar prompt style por ID
2. Si hay `galleryTags`, usar `image-to-image` con esas referencias
3. Si no hay tags, usar `text-to-image` con el `promptText` del estilo
4. Guardar URL en `previewImageUrl`
5. Retornar URL actualizada

**Acceptance Criteria:**
- [ ] Endpoint funcional y documentado en Swagger
- [ ] Validación de ID de prompt style
- [ ] Soporte para gallery tags opcionales
- [ ] Actualiza documento en MongoDB
- [ ] Manejo de errores (404, 500)

---

### Task 3: Actualizar CRUD Endpoints
**Archivo:** `backend/src/routes/promptStyles.ts`
**Prioridad:** Media
**Estimación:** 20 min

**Cambios:**
- GET `/prompt-styles` → incluir `previewImageUrl` en response
- GET `/prompt-styles/:id` → incluir `previewImageUrl`
- PATCH `/prompt-styles/:id` → permitir actualizar `previewImageUrl` manualmente (opcional)

**Acceptance Criteria:**
- [ ] Todos los endpoints retornan `previewImageUrl` si existe
- [ ] Schema de Swagger actualizado
- [ ] No rompe compatibilidad con frontend existente

---

### Task 4: Endpoint para Eliminar Preview
**Archivo:** `backend/src/routes/promptStyles.ts`
**Prioridad:** Baja
**Estimación:** 15 min

**Nuevo endpoint:**
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
- Establecer `previewImageUrl` a `null`

**Acceptance Criteria:**
- [ ] Endpoint funcional
- [ ] Actualiza documento correctamente
- [ ] Retorna error si el style no existe

---

## 🎨 Tareas Frontend

### Task 5: Actualizar Interface PromptStyleTag
**Archivo:** `frontend/src/types/promptStyle.ts`
**Prioridad:** Alta
**Estimación:** 5 min

**Cambios:**
```typescript
export interface PromptStyleTag {
  _id: string;
  name: string;
  description?: string;
  promptText: string;
  previewImageUrl?: string;  // ← NUEVO
  createdAt: string;
  updatedAt: string;
}
```

**Acceptance Criteria:**
- [ ] Interface actualizada
- [ ] TypeScript no muestra errores

---

### Task 6: Mostrar Preview en PromptStylesPage
**Archivo:** `frontend/src/pages/PromptStylesPage.tsx`
**Prioridad:** Alta
**Estimación:** 30 min

**Cambios en UI:**
- Agregar thumbnail en tarjeta de cada estilo
- Si `previewImageUrl` existe → mostrar imagen
- Si no existe → mostrar placeholder con ícono 🎨
- Tamaño sugerido: 120x120px, rounded

**Layout sugerido:**
```
┌─────────────────────────────────────┐
│  ┌──────┐  Nombre del Estilo        │
│  │ 🎨  │  Descripción breve          │
│  │ img │  "promptText..."            │
│  └──────┘  [Editar] [Eliminar]      │
└─────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Preview visible en lista de estilos
- [ ] Placeholder cuando no hay preview
- [ ] Responsive (mobile y desktop)
- [ ] Loading state mientras carga imagen

---

### Task 7: Botón "Generar Preview" en Modal
**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`
**Prioridad:** Alta
**Estimación:** 45 min

**UI Changes:**
- Agregar sección "Preview" en modal de edición
- Mostrar preview actual (si existe)
- Botón "Generar Preview" → abre selector de gallery tags
- Botón "Regenerar" (si ya existe preview)
- Loading state durante generación

**Flujo:**
1. Usuario click "Generar Preview"
2. Aparece selector de gallery tags (opcional)
3. Usuario selecciona tags o skip
4. POST `/prompt-styles/:id/generate-preview`
5. Muestra preview generado

**Acceptance Criteria:**
- [ ] Botón visible en modal de edición
- [ ] Loading spinner durante generación
- [ ] Preview se actualiza automáticamente
- [ ] Toast de éxito/error
- [ ] Permite regenerar

---

### Task 8: Selector de Gallery Tags para Preview
**Archivo:** `frontend/src/components/PromptStyles/GalleryTagSelector.tsx` (nuevo)
**Prioridad:** Media
**Estimación:** 30 min

**Componente nuevo:**
```tsx
interface GalleryTagSelectorProps {
  onSelect: (tags: string[]) => void;
  onSkip: () => void;
}
```

**UI:**
- Modal/dropdown con lista de tags disponibles
- Checkboxes para seleccionar múltiples
- Botón "Usar estos tags"
- Botón "Sin tags" (genera con texto puro)

**Acceptance Criteria:**
- [ ] Carga tags desde `/gallery/tags`
- [ ] Permite selección múltiple
- [ ] Callback con array de tags seleccionados
- [ ] Opción de skip (generar sin tags)

---

### Task 9: Vista de Preview en Detalle
**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`
**Prioridad:** Media
**Estimación:** 20 min

**Cambios:**
- Mostrar preview grande (300x300px) en modal de vista
- Botón de descarga (opcional)
- Lightbox al click (opcional)

**Acceptance Criteria:**
- [ ] Preview visible en modal de detalle
- [ ] Tamaño apropiado
- [ ] Fallback si no hay preview

---

### Task 10: Botón "Eliminar Preview"
**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`
**Prioridad:** Baja
**Estimación:** 15 min

**UI:**
- Botón "Eliminar preview" (solo visible si existe preview)
- Confirmación antes de eliminar
- DELETE `/prompt-styles/:id/preview`

**Acceptance Criteria:**
- [ ] Botón visible solo cuando hay preview
- [ ] Confirmación antes de eliminar
- [ ] UI se actualiza después de eliminar

---

## 🧪 Testing

### Backend Tests
- [ ] Preview se genera correctamente con gallery tags
- [ ] Preview se genera correctamente sin tags
- [ ] Error cuando prompt style no existe
- [ ] Preview se elimina correctamente
- [ ] CRUD incluye campo previewImageUrl

### Frontend Tests
- [ ] Preview se muestra en lista
- [ ] Placeholder se muestra cuando no hay preview
- [ ] Generación de preview actualiza UI
- [ ] Selector de gallery tags funciona
- [ ] Loading states correctos

---

## 📊 Priorización de Tareas

### Fase 1 - Core Functionality (Crítico)
1. ✅ Task 1: Actualizar modelo (Backend)
2. ✅ Task 2: Endpoint generar preview (Backend)
3. ✅ Task 5: Actualizar interface (Frontend)
4. ✅ Task 6: Mostrar preview en lista (Frontend)
5. ✅ Task 7: Botón generar en modal (Frontend)

### Fase 2 - Enhanced UX (Importante)
6. ✅ Task 3: Actualizar CRUD (Backend)
7. ✅ Task 8: Selector de gallery tags (Frontend)
8. ✅ Task 9: Vista de preview detallada (Frontend)

### Fase 3 - Nice to Have (Opcional)
9. ✅ Task 4: Endpoint eliminar preview (Backend)
10. ✅ Task 10: Botón eliminar preview (Frontend)

---

## 🚀 Orden de Implementación Sugerido

1. **Backend primero** (Tasks 1, 2, 3) → Permite probar con Postman/curl
2. **Frontend básico** (Tasks 5, 6) → Ver previews en UI
3. **Generación desde UI** (Tasks 7, 8) → Funcionalidad completa
4. **Refinamiento** (Tasks 9, 10) → Mejoras UX

---

## 📝 Notas Técnicas

### Generación de Preview
- Usar mismo flujo que generación de imágenes en storyboards
- Prompt base: `promptText` del style tag
- Si hay gallery tags: `image-to-image` con esas referencias
- Si no hay tags: `text-to-image` puro
- Ratio sugerido: `1:1` (square)
- Modelo: fal.ai (mismo que storyboards)

### Almacenamiento
- URLs son de fal.ai (no local)
- No requiere storage adicional
- `previewImageUrl` es string opcional

### Performance
- Lazy loading de imágenes en lista
- Generar preview es async (no bloquea UI)
- Cache de gallery tags

---

## ✅ Definition of Done

- [ ] Todos los endpoints backend funcionan
- [ ] Frontend muestra previews correctamente
- [ ] Se puede generar preview con y sin gallery tags
- [ ] Se puede regenerar preview existente
- [ ] Loading states en todos los procesos async
- [ ] Error handling apropiado
- [ ] No hay TypeScript errors
- [ ] Build exitoso (frontend y backend)
- [ ] Tested en desarrollo
- [ ] Documentación actualizada (README si aplica)

---

## 🎯 Métricas de Éxito

- Usuario puede ver preview de un estilo antes de usarlo
- Reducción de "prueba y error" al seleccionar estilos
- Mejor UX en página de Prompt Styles
- Galería de estilos más visual y atractiva

---

**Estimación Total:**
- Backend: ~1.5 horas
- Frontend: ~2.5 horas
- Testing: ~1 hora
- **TOTAL: ~5 horas**

**Complejidad:** Media
**Impacto:** Alto (mejora significativa en UX)
