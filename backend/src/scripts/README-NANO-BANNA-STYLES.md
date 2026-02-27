# Estilos Predefinidos para Nano Banna Edit

Este documento describe los 20 estilos optimizados creados para Nano Banna Edit.

## 🚀 Uso del Script de Seed

Para poblar la base de datos con los 20 estilos predefinidos:

```bash
cd backend
npm run ts-node src/scripts/seed-nano-banna-styles.ts
```

O usando tsx:
```bash
cd backend
npx tsx src/scripts/seed-nano-banna-styles.ts
```

## 📋 Lista de Estilos

### Cinematic/Film (3 estilos)

1. **@cinematic-noir**
   - Film noir dramático con alto contraste
   - Ideal para: Escenas dramáticas, retratos moody, fotografía artística

2. **@cinematic-warm**
   - Tono cinematográfico cálido
   - Ideal para: Retratos, golden hour, escenas románticas

3. **@cinematic-cool**
   - Tonos fríos estilo thriller
   - Ideal para: Escenas de acción, thrillers, ambientes tecnológicos

### Artistic/Painting (4 estilos)

4. **@oil-painting**
   - Estilo óleo clásico
   - Ideal para: Retratos formales, paisajes clásicos, arte tradicional

5. **@watercolor-soft**
   - Acuarela suave y etérea
   - Ideal para: Ilustraciones delicadas, arte infantil, diseños románticos

6. **@digital-art**
   - Arte digital moderno
   - Ideal para: Concept art, ilustraciones comerciales, diseño moderno

7. **@impressionist**
   - Estilo impresionista
   - Ideal para: Paisajes, escenas al aire libre, arte clásico moderno

### Anime/Cartoon (3 estilos)

8. **@anime-vibrant**
   - Anime colorido y vibrante
   - Ideal para: Personajes anime, ilustraciones juveniles, arte pop

9. **@anime-dark**
   - Anime oscuro y dramático
   - Ideal para: Seinen manga, escenas dramáticas, arte maduro

10. **@cartoon-2d**
    - Cartoon 2D tradicional
    - Ideal para: Ilustraciones infantiles, diseño de personajes, arte juguetón

### Photography (3 estilos)

11. **@portrait-studio**
    - Retrato de estudio profesional
    - Ideal para: Headshots, retratos corporativos, fotografía profesional

12. **@street-photography**
    - Fotografía callejera documental
    - Ideal para: Escenas urbanas, momentos candidos, fotorreportaje

13. **@macro-detailed**
    - Macro ultra detallado
    - Ideal para: Naturaleza, texturas, detalles intrincados

### Fantasy/Sci-Fi (3 estilos)

14. **@fantasy-epic**
    - Fantasía épica
    - Ideal para: Concept art de juegos, ilustraciones de fantasía, arte heroico

15. **@cyberpunk-neon**
    - Cyberpunk con neones
    - Ideal para: Escenas futuristas urbanas, arte sci-fi, ambientes nocturnos

16. **@scifi-clean**
    - Sci-fi limpio y futurista
    - Ideal para: Tecnología avanzada, ambientes futuristas, diseño industrial

### Abstract/Experimental (4 estilos)

17. **@abstract-geometric**
    - Abstracto geométrico
    - Ideal para: Diseño moderno, arte contemporáneo, fondos abstractos

18. **@glitch-art**
    - Arte glitch digital
    - Ideal para: Arte digital experimental, estética vaporwave, diseño moderno

19. **@minimalist-clean**
    - Minimalista limpio
    - Ideal para: Diseño de producto, arte conceptual, fondos simples

20. **@surreal-dream**
    - Surrealismo onírico
    - Ideal para: Arte conceptual, ilustraciones oníricas, diseño experimental

## 🎨 Generación de Previews

Después de ejecutar el script de seed, genera previews para cada estilo:

### Opción 1: Vía API (text-to-image)
```bash
curl -X POST http://localhost:3001/prompt-styles/{id}/generate-preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Opción 2: Vía API (image-to-image con gallery tags)
```bash
curl -X POST http://localhost:3001/prompt-styles/{id}/generate-preview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"galleryTags": ["landscape", "nature"]}'
```

### Prompt de Prueba Recomendado
Para consistencia, usa este prompt base al generar previews:
```
a serene landscape at sunset
```

## 📝 Notas Técnicas

### Usuario del Sistema
Los estilos se crean con `userId: 'system'` por defecto. Puedes cambiar esto configurando la variable de entorno:

```bash
export SYSTEM_USER_ID="tu-user-id-aqui"
```

### Verificación de Duplicados
El script verifica automáticamente si los estilos ya existen y solo crea los que faltan.

### Categorías
Cada estilo incluye una categoría opcional para facilitar la organización:
- `cinematic`
- `artistic`
- `anime`
- `cartoon`
- `photography`
- `fantasy`
- `scifi`
- `abstract`
- `experimental`
- `minimalist`
- `surreal`

## ✅ Criterios de Aceptación

- [x] 20 estilos definidos con nombres únicos
- [x] Cada estilo tiene @tag name descriptivo
- [x] Cada estilo tiene prompt text optimizado para Nano Banna Edit
- [x] Estilos organizados por categorías
- [ ] Previews generadas para cada estilo
- [ ] Estilos visibles en el selector de la UI
- [ ] Estilos probados y funcionales

## 🔧 Troubleshooting

### Error de conexión a MongoDB
Asegúrate de que MongoDB está corriendo:
```bash
docker-compose up -d mongodb
```

### Los estilos no aparecen en la UI
Verifica que el userId del frontend coincida con el usado en el seed, o implementa lógica para mostrar estilos del sistema a todos los usuarios.

### Error al generar previews
Verifica que la API key de fal.ai esté configurada correctamente en el archivo `.env`:
```
FAL_KEY=tu-api-key-aqui
```
