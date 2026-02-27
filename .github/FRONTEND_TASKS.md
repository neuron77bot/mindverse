# 🎨 Tareas Frontend - Prompt Style Preview

## Asignación: Equipo Frontend

---

## Task 5: Actualizar Interface PromptStyleTag ⚡
**Prioridad:** Alta | **Estimación:** 5 min

**Archivo:** `frontend/src/types/promptStyle.ts`

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

**Checklist:**
- [ ] Campo `previewImageUrl` agregado a interface
- [ ] TypeScript no muestra errores
- [ ] Commit: `feat(frontend): add previewImageUrl to PromptStyleTag interface`

---

## Task 6: Mostrar Preview en Lista de Estilos ⚡⚡
**Prioridad:** Alta | **Estimación:** 30 min

**Archivo:** `frontend/src/pages/PromptStylesPage.tsx`

**Cambios en UI:**

**Diseño propuesto:**
```
┌────────────────────────────────────────────┐
│  ┌───────┐  🎨 Nombre del Estilo            │
│  │       │  "Descripción breve del estilo"  │
│  │ IMG   │  Prompt: "cinematic, 8k..."      │
│  │       │  [Editar] [Eliminar]              │
│  └───────┘                                   │
└────────────────────────────────────────────┘
```

**Si NO hay preview:**
```
┌───────┐
│  🎨   │  Placeholder con ícono
│       │  Background gris claro
└───────┘
```

**Si SÍ hay preview:**
```
┌───────┐
│ [IMG] │  Imagen del preview
│       │  object-fit: cover
└───────┘
```

**Especificaciones:**
- Tamaño thumbnail: `120x120px`
- Border radius: `rounded-lg`
- Aspect ratio: `1:1` (cuadrado)
- Lazy loading: `loading="lazy"`
- Alt text: nombre del estilo

**Checklist:**
- [ ] Thumbnail visible en cada tarjeta
- [ ] Placeholder cuando `previewImageUrl` es null/undefined
- [ ] Loading skeleton mientras carga imagen
- [ ] Responsive (mobile y desktop)
- [ ] Hover effect en imagen (opcional: zoom leve)
- [ ] Commit: `feat(frontend): display preview thumbnails in prompt styles list`

---

## Task 7: Botón "Generar Preview" en Modal ⚡⚡⚡
**Prioridad:** Alta | **Estimación:** 45 min

**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`

**Sección nueva en modal (modo edición):**

```tsx
{/* Preview Section */}
<div className="border-t pt-4">
  <h3 className="text-sm font-semibold mb-2">Preview del Estilo</h3>
  
  {previewImageUrl ? (
    <div className="relative">
      <img 
        src={previewImageUrl} 
        alt="Preview" 
        className="w-full max-w-xs rounded-lg"
      />
      <button 
        onClick={handleRegeneratePreview}
        className="mt-2"
      >
        🔄 Regenerar Preview
      </button>
    </div>
  ) : (
    <button 
      onClick={handleGeneratePreview}
      disabled={isGeneratingPreview}
      className="btn-primary"
    >
      {isGeneratingPreview ? '⏳ Generando...' : '✨ Generar Preview'}
    </button>
  )}
</div>
```

**Flujo de generación:**

1. Usuario click "Generar Preview"
2. **Opción A:** Mostrar selector de gallery tags (modal/dropdown)
3. **Opción B:** Botón "Generar sin tags" (text-to-image puro)
4. Usuario selecciona tags o skip
5. `POST /prompt-styles/:id/generate-preview` con `{ galleryTags: [...] }`
6. Loading state (spinner en botón)
7. Al completar:
   - Actualizar `previewImageUrl` en state
   - Mostrar toast de éxito
   - Preview aparece automáticamente

**Checklist:**
- [ ] Sección "Preview" visible en modal de edición
- [ ] Botón "Generar Preview" funcional
- [ ] Loading state durante generación (botón deshabilitado + spinner)
- [ ] Preview se muestra al generar
- [ ] Botón "Regenerar" disponible si ya existe preview
- [ ] Toast de éxito/error
- [ ] Error handling (mostrar mensaje si falla)
- [ ] Commit: `feat(frontend): add generate preview button in prompt style modal`

---

## Task 8: Selector de Gallery Tags para Preview ⚙️
**Prioridad:** Media | **Estimación:** 30 min

**Archivo:** `frontend/src/components/PromptStyles/GalleryTagSelector.tsx` (nuevo componente)

**Props:**
```typescript
interface GalleryTagSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (tags: string[]) => void;
  onSkip: () => void;
}
```

**UI Propuesta:**

```
┌─────────────────────────────────────┐
│  Seleccionar Tags de Referencia    │
├─────────────────────────────────────┤
│  □ personajes                       │
│  □ paisajes                          │
│  □ objetos                           │
│  ☑ edificios                        │
│                                     │
│  [Usar Estos Tags]  [Sin Tags]     │
└─────────────────────────────────────┘
```

**Funcionalidad:**
1. Cargar tags disponibles: `GET /gallery/tags`
2. Mostrar checkboxes para cada tag
3. Permitir selección múltiple
4. Botón "Usar Estos Tags" → callback con array de tags
5. Botón "Sin Tags" → callback con array vacío
6. Cerrar modal después de selección

**Checklist:**
- [ ] Componente creado
- [ ] Carga tags desde API `/gallery/tags`
- [ ] Checkboxes funcionan (selección múltiple)
- [ ] Botón "Usar Estos Tags" llama `onSelect(selectedTags)`
- [ ] Botón "Sin Tags" llama `onSkip()`
- [ ] Loading state mientras carga tags
- [ ] Modal se cierra al seleccionar
- [ ] Commit: `feat(frontend): add gallery tag selector for preview generation`

---

## Task 9: Vista de Preview Detallada 🎨
**Prioridad:** Media | **Estimación:** 20 min

**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`

**Mejoras en visualización de preview:**

**En modal de VISTA (no edición):**
- Preview grande: `300x300px` o `max-w-md`
- Calidad de imagen alta
- Opción de ver fullscreen (lightbox) al click
- Botón de descarga (opcional)

**En modal de EDICIÓN:**
- Preview mediano: `200x200px`
- Botones de acción (regenerar, eliminar)

**Checklist:**
- [ ] Preview grande en modal de vista
- [ ] Preview mediano en modal de edición
- [ ] Lightbox al click (opcional)
- [ ] Botón de descarga (opcional)
- [ ] Fallback si no hay preview (placeholder)
- [ ] Commit: `feat(frontend): enhance preview display in modal`

---

## Task 10: Botón "Eliminar Preview" 🗑️
**Prioridad:** Baja | **Estimación:** 15 min

**Archivo:** `frontend/src/components/PromptStyles/PromptStyleModal.tsx`

**UI:**
```tsx
{previewImageUrl && (
  <button 
    onClick={handleDeletePreview}
    className="text-red-500 text-sm"
  >
    🗑️ Eliminar Preview
  </button>
)}
```

**Flujo:**
1. Botón solo visible si `previewImageUrl` existe
2. Click → mostrar confirmación (dialog o toast)
3. Si confirma:
   - `DELETE /prompt-styles/:id/preview`
   - Establecer `previewImageUrl` a `null` en state
   - Toast de éxito
4. Preview desaparece de UI

**Checklist:**
- [ ] Botón visible solo cuando hay preview
- [ ] Confirmación antes de eliminar
- [ ] Request DELETE al backend
- [ ] UI se actualiza (preview desaparece)
- [ ] Toast de confirmación
- [ ] Error handling
- [ ] Commit: `feat(frontend): add delete preview button`

---

## 🧪 Testing Frontend

### Test Manual en Desarrollo

**1. Ver lista de estilos:**
- [ ] Ir a `/prompt-styles`
- [ ] Ver que estilos con preview muestran thumbnail
- [ ] Ver que estilos sin preview muestran placeholder

**2. Generar preview:**
- [ ] Editar un estilo sin preview
- [ ] Click "Generar Preview"
- [ ] Seleccionar gallery tags (o skip)
- [ ] Verificar loading state
- [ ] Preview aparece al completar
- [ ] Toast de éxito aparece

**3. Regenerar preview:**
- [ ] Editar estilo con preview existente
- [ ] Click "Regenerar Preview"
- [ ] Preview se actualiza

**4. Eliminar preview:**
- [ ] Click "Eliminar Preview"
- [ ] Confirmar
- [ ] Preview desaparece

**5. Vista detallada:**
- [ ] Ver estilo con preview
- [ ] Preview grande visible
- [ ] Lightbox funciona (opcional)

---

## 📦 Dependencias

**APIs Backend necesarias:**
- ✅ `GET /prompt-styles` (ya existe)
- ✅ `GET /gallery/tags` (ya existe)
- 🔜 `POST /prompt-styles/:id/generate-preview` (Task 2 backend)
- 🔜 `DELETE /prompt-styles/:id/preview` (Task 4 backend)

**Bibliotecas:**
- Ninguna nueva requerida
- Usar `sonner` para toasts (ya instalado)
- Usar estilos de Tailwind existentes

---

## 🎨 Guía de Estilos

### Colores
- Preview border: `border-slate-300`
- Placeholder bg: `bg-slate-100`
- Placeholder icon: `text-slate-400`

### Tamaños
- Thumbnail lista: `w-28 h-28` (112px)
- Preview modal edición: `w-48 h-48` (192px)
- Preview modal vista: `w-80 h-80` (320px)

### Clases Tailwind Comunes
```tsx
// Thumbnail en lista
className="w-28 h-28 rounded-lg object-cover border border-slate-300"

// Placeholder
className="w-28 h-28 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-4xl"

// Loading skeleton
className="w-28 h-28 rounded-lg bg-slate-200 animate-pulse"
```

---

## 🚀 Orden de Implementación

1. **Task 5** (interface) → Base para TypeScript
2. **Task 6** (mostrar en lista) → Ver previews existentes
3. **Task 8** (selector tags) → Componente auxiliar
4. **Task 7** (generar button) → Funcionalidad core
5. **Task 9** (vista detallada) → Mejora UX
6. **Task 10** (eliminar) → Nice to have

---

## 💡 Tips de Implementación

### Lazy Loading de Imágenes
```tsx
<img 
  src={previewImageUrl} 
  loading="lazy"
  onLoad={() => setImageLoaded(true)}
  className={`transition-opacity ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
/>
```

### Error Handling en Request
```typescript
try {
  const res = await fetch(`/prompt-styles/${id}/generate-preview`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ galleryTags })
  });
  
  if (!res.ok) throw new Error('Error generando preview');
  
  const data = await res.json();
  setPreviewImageUrl(data.previewImageUrl);
  toast.success('Preview generado exitosamente');
} catch (err) {
  toast.error('Error al generar preview');
}
```

### Estado de Loading
```typescript
const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

const handleGeneratePreview = async (tags: string[]) => {
  setIsGeneratingPreview(true);
  try {
    // ... request
  } finally {
    setIsGeneratingPreview(false);
  }
};
```

---

## ✅ Definition of Done (Frontend)

- [ ] Task 5 completada y commiteada
- [ ] Task 6 completada y commiteada
- [ ] Task 7 completada y commiteada
- [ ] Task 8 completada y commiteada
- [ ] Task 9 completada y commiteada
- [ ] Task 10 completada y commiteada
- [ ] No hay TypeScript errors
- [ ] No hay ESLint warnings (importantes)
- [ ] Build exitoso (`npm run build`)
- [ ] UI responsive (mobile y desktop)
- [ ] Tests manuales pasados
- [ ] Code review aprobado
- [ ] Merge a `feature/prompt-style-preview`

---

**Tiempo estimado total: ~2.5 horas**

¡Buena suerte! 🚀
