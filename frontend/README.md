# Mindverse

Aplicación web para visualizar y gestionar el estado mental de una persona a través de mapas mentales interactivos. Permite explorar los pensamientos en diferentes líneas del tiempo — pasado y presente o futuro, estos son metadatos relacionados a un pensamiento, así como su categoría y su estado vibracional de emoción según la escala del Dr. David R. Hawkins.

Todos los pensamientos parten de un nodo principal: el punto cero, llamado **Casco Periférico**.

## Objetivo

Ofrecer una herramienta visual e intuitiva para que cualquier persona pueda mapear su estado mental en un canvas interactivo, organizando pensamientos por línea temporal, categoría de vida y nivel vibracional emocional, facilitando la introspección, la reflexión y el autoconocimiento.

## Funcionalidades

- **Casco Periférico (Punto Cero)** — Nodo raíz siempre visible del que parten todos los pensamientos; no puede eliminarse
- **Mapa mental interactivo** — Canvas con zoom, pan y drag & drop de pensamientos usando React Flow
- **Escala vibracional de Hawkins** — Cada pensamiento lleva un nivel emocional (20–700) según la escala del Dr. David R. Hawkins, con colores distintivos por calibración
- **Línea temporal** — Filtra pensamientos por metadato temporal: Pasado, Presente o Futuro
- **Categorías de vida** — 9 categorías con colores distintivos: Salud, Trabajo, Amor, Familia, Finanzas, Crecimiento Personal, Ocio, Espiritualidad y Social
- **CRUD de pensamientos** — Crear, editar y eliminar pensamientos desde un editor modal con selector de nivel vibracional
- **Conexiones entre pensamientos** — Crear relaciones con etiquetas arrastrando desde los handles
- **Auto-layout** — Organización automática del grafo con Dagre en 4 direcciones (TB, LR, BT, RL)
- **Minimapa** — Vista miniatura para navegar mapas grandes
- **Persistencia local** — Todo el estado se guarda en localStorage automáticamente con Zustand
- **Datos de ejemplo** — Set de pensamientos precargado con opción de resetear en cualquier momento

## Tech Stack

| Tecnología | Propósito |
|---|---|
| React 19 | UI |
| TypeScript | Tipado estático |
| Vite 7 | Build tool y dev server |
| React Flow 11 | Canvas de mapa mental |
| Zustand 5 | Estado global + persistencia localStorage |
| Dagre | Auto-layout de grafos |
| TailwindCSS 4 | Estilos |

## Inicio rápido

```bash
npm install
npm run dev
```
