# API Keys - Autenticación con Mindverse API

## ¿Qué son las API Keys?

Las API Keys son claves de autenticación que te permiten acceder al API de Mindverse sin necesidad de usar OAuth o tokens JWT. Son ideales para:

- Scripts automatizados
- Integraciones con otras aplicaciones
- Testing y desarrollo
- Aplicaciones server-side

## Generar una API Key

1. Ingresa a tu perfil en Mindverse
2. Busca la sección "🔑 API Keys"
3. Ingresa un nombre descriptivo para tu key (ej: "Script de backup", "Integración Slack")
4. Haz click en "Generar"
5. **¡IMPORTANTE!** Copia y guarda la key en un lugar seguro. Solo se mostrará una vez.

## Usar una API Key

Para autenticarte con una API Key, incluye el header `X-API-Key` en tus requests:

### Ejemplo con curl

```bash
curl -H "X-API-Key: sk_live_abc123..." https://api.mindverse.com/storyboards
```

### Ejemplo con JavaScript

```javascript
const response = await fetch('https://api.mindverse.com/storyboards', {
  headers: {
    'X-API-Key': 'sk_live_abc123...'
  }
});

const data = await response.json();
```

### Ejemplo con Python

```python
import requests

headers = {
    'X-API-Key': 'sk_live_abc123...'
}

response = requests.get('https://api.mindverse.com/storyboards', headers=headers)
data = response.json()
```

## Gestionar tus API Keys

Desde tu perfil puedes:

- **Ver todas tus keys**: Con nombre, fecha de creación y último uso
- **Habilitar/Deshabilitar**: Pausar temporalmente una key sin eliminarla
- **Eliminar**: Revocar permanentemente una key (no se puede recuperar)

## Seguridad

### ⚠️ Mejores prácticas

- **Nunca compartas tus API Keys** públicamente (GitHub, Slack, etc.)
- **No las incluyas en tu código** directamente - usa variables de entorno
- **Revoca inmediatamente** cualquier key que haya sido expuesta
- **Usa nombres descriptivos** para identificar fácilmente dónde se usa cada key
- **Elimina keys** que ya no uses

### Variables de entorno

Guarda tus API Keys en variables de entorno:

```bash
# .env
MINDVERSE_API_KEY=sk_live_abc123...
```

```javascript
// En tu código
const API_KEY = process.env.MINDVERSE_API_KEY;
```

## Autenticación JWT vs API Key

| Característica | JWT (OAuth) | API Key |
|----------------|-------------|---------|
| Duración | Expira automáticamente | Permanente hasta que la elimines |
| Uso | Aplicaciones web/móviles | Scripts, integraciones, testing |
| Seguridad | Alta (rotación automática) | Media (depende del usuario) |
| Complejidad | Requiere OAuth flow | Simple, un solo header |

## Limitaciones

- Las API Keys tienen los mismos permisos que tu usuario
- No se pueden crear API Keys con permisos limitados (por ahora)
- Una API Key deshabilitada o eliminada deja de funcionar inmediatamente

## Soporte

Si tienes problemas con tus API Keys:
1. Verifica que la key esté **habilitada** y **no expirada**
2. Revisa que el header sea `X-API-Key` (case-sensitive)
3. Asegúrate de copiar la key completa sin espacios

## Changelog

- **2026-03-03**: Lanzamiento inicial de API Keys
  - Generación de keys
  - Autenticación con header X-API-Key
  - Gestión desde perfil de usuario
