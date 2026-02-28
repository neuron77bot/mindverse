# Configuración de Nginx para Videos Compilados

## Issue #37 - Compilación de Videos

### Ubicación del archivo
`/etc/nginx/sites-available/default`

### Configuración requerida

Agregar el siguiente bloque `location` dentro del bloque `server`:

```nginx
# Storage de videos compilados
location /storage/compiled-videos {
    alias /var/www/mindverse_dev/storage/compiled-videos;
    
    # CORS
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, OPTIONS';
    
    # Cache
    add_header Cache-Control "public, max-age=31536000, immutable";
    
    # Tipos MIME
    types {
        video/mp4 mp4;
    }
}
```

### Aplicar cambios

```bash
# Validar configuración
sudo nginx -t

# Si la validación es exitosa, recargar Nginx
sudo systemctl reload nginx
```

### Verificar funcionamiento

```bash
# Probar acceso directo (después de compilar un video)
curl -I https://devalliance.com.ar/storage/compiled-videos/[storyboard-id].mp4
```

### Directorio de storage

El directorio `/var/www/mindverse_dev/storage/compiled-videos/` ya fue creado con los permisos adecuados.

### Timeouts

Si la compilación falla por timeout, ajustar en la configuración de Nginx:

```nginx
# Dentro del bloque server o location específico
proxy_read_timeout 120s;
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
```

Y en el docker-compose.dev.yml (si es necesario):

```yaml
environment:
  - FASTIFY_TIMEOUT=120000  # 120 segundos
```
