# Docker Deployment Guide

Este proyecto utiliza diferentes configuraciones de Docker para los ambientes de producción y desarrollo.

## Archivos de Configuración

### Producción (`/var/www/mindverse`)
- **`docker-compose.yml`**: Configuración activa para producción
- **`docker-compose.prod.yml`**: Copia de respaldo/referencia de la configuración de producción

**Puertos:**
- Backend: `3001`
- MongoDB: `27017`

**Volumen de datos:**
- `mongo_data_prod`

### Desarrollo (`/var/www/mindverse_dev`)
- **`docker-compose.yml`**: Configuración activa para desarrollo
- **`docker-compose.dev.yml`**: Copia de respaldo/referencia de la configuración de desarrollo

**Puertos:**
- Backend: `3002`
- MongoDB: `27018`

**Volumen de datos:**
- `mongo_data_dev`

## Comandos Útiles

### Producción
```bash
cd /var/www/mindverse

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Rebuild y reiniciar
docker compose down
docker compose build
docker compose up -d

# Usar archivo específico (respaldo)
docker compose -f docker-compose.prod.yml up -d
```

### Desarrollo
```bash
cd /var/www/mindverse_dev

# Iniciar servicios
docker compose up -d

# Ver logs
docker compose logs -f

# Detener servicios
docker compose down

# Rebuild y reiniciar
docker compose down
docker compose build
docker compose up -d

# Usar archivo específico (respaldo)
docker compose -f docker-compose.dev.yml up -d
```

## Volúmenes de MongoDB

Los datos de MongoDB se persisten en volúmenes Docker separados:

- **Producción**: `mongo_data_prod`
- **Desarrollo**: `mongo_data_dev`

### Ver volúmenes
```bash
docker volume ls | grep mongo_data
```

### Backup de volumen
```bash
# Producción
docker run --rm -v mongo_data_prod:/data -v $(pwd):/backup alpine tar czf /backup/mongo_prod_backup.tar.gz -C /data .

# Desarrollo
docker run --rm -v mongo_data_dev:/data -v $(pwd):/backup alpine tar czf /backup/mongo_dev_backup.tar.gz -C /data .
```

### Restaurar volumen
```bash
# Producción
docker run --rm -v mongo_data_prod:/data -v $(pwd):/backup alpine tar xzf /backup/mongo_prod_backup.tar.gz -C /data

# Desarrollo
docker run --rm -v mongo_data_dev:/data -v $(pwd):/backup alpine tar xzf /backup/mongo_dev_backup.tar.gz -C /data
```

## URLs de los Ambientes

- **Producción**: https://mindverse.devalliance.com.ar
- **Desarrollo**: https://dev.mindverse.devalliance.com.ar

## Notas Importantes

1. **Nunca** mezclar los archivos docker-compose entre ambientes
2. Los volúmenes son independientes - cada ambiente tiene su propia base de datos
3. Asegurarse de que los puertos no colisionen entre ambientes
4. El archivo `.env` en cada `backend/` contiene configuraciones específicas del ambiente
