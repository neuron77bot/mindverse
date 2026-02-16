# Mindverse - Frontend

Frontend para visualizar y gestionar el estado mental de una persona a través de mapas mentales interactivos, permitiendo explorar diferentes lineas del tiempo en la vida de una persona, como su pasado, presente y futuro.

---

## Objetivo

Crear un prototipo funcional del frontend que permita:
- Visualizar mapas mentales interactivos
- Navegar entre estados temporales (Pasado, Presente, Futuro)
- Filtrar por categorías de vida
- Agregar, editar y eliminar nodos (persistidos en localStorage)

---

## Stack Simplificado

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **React** | 18.x | Biblioteca UI |
| **Vite** | 5.x | Build tool y dev server |
| **TypeScript** | 5.x | Tipado estático |
| **React Flow** | 11.x | Visualización de mapas mentales |
| **Zustand** | 4.x | Gestión de estado + persistencia localStorage |
| **TailwindCSS** | 3.x | Estilos |
| **Framer Motion** | 10.x | Animaciones fluidas |

---

## Funcionalidades

### Incluidas 1.0
- [x] Visualización de mapa mental con React Flow
- [x] Nodos personalizados con colores por categoría
- [x] Filtro por estado temporal (Pasado/Presente/Futuro)
- [x] Filtro por categoría de vida
- [x] Drag & drop de nodos
- [x] Zoom y pan del canvas
- [x] Crear nuevos nodos
- [x] Editar nodos existentes
- [x] Eliminar nodos
- [x] Crear conexiones entre nodos
- [x] Eliminar conexiones
- [x] Persistencia en localStorage
- [x] Datos pre-cargados de ejemplo
- [x] Botón para resetear a datos de ejemplo

### Excluidas 2.0
- [ ] Autenticación de usuarios
- [ ] Backend y base de datos real
- [ ] Múltiples mapas mentales
- [ ] Exportar como imagen
- [ ] Compartir mapas
- [ ] Colaboración en tiempo real

### Versión 3.0
- [ ] Exportar mapas como imagen (PNG/SVG)
- [ ] Compartir mapas con otros usuarios
- [ ] Plantillas predefinidas
- [ ] Modo oscuro/claro
- [ ] Estadísticas y análisis de patrones
- [ ] Historial de cambios

### Versión 4.0
- [ ] Colaboración en tiempo real
- [ ] Integración con calendarios
- [ ] Notificaciones y recordatorios
- [ ] App móvil (React Native)
- [ ] IA para sugerencias de conexiones


---