# Límites de subida de imágenes (dashboard)

La API valida el tamaño en Laravel **antes** de que PHP descarte el archivo sin mensaje claro. Los valores del servidor deben ser **ligeramente superiores** al máximo de la app para que falle la validación de Laravel y no el límite bruto de PHP.

## Límites de la aplicación (Laravel)

| Endpoint | Campo | Regla `max` | Máximo efectivo |
|----------|-------|-------------|-----------------|
| `POST /api/v1/dashboard/images` | `file` | `10240` KB | **10 MB** |
| `POST /api/v1/dashboard/logo` | `file` | `2048` KB | **2 MB** |
| `POST /api/v1/dashboard/favicon` | `file` | `1024` KB | **1 MB** |

El frontend comprime/redimensiona antes de enviar (margen ~9,5 MB galería, ~1,9 MB logo).

## Valores recomendados en servidor

### PHP (`php.ini` o `docker/php/php-uploads.ini`)

```ini
upload_max_filesize = 12M
post_max_size = 14M
```

`post_max_size` debe ser mayor que `upload_max_filesize` (varios campos en el mismo POST).

### Nginx (`client_max_body_size`)

```nginx
client_max_body_size 14M;
```

En local ya está en `docker/nginx/default.conf` (64M). En producción conviene al menos **14M** para galería.

## Comprobar en producción

```bash
php -i | grep -E 'upload_max_filesize|post_max_size'
```

O revisar `phpinfo()` en un entorno controlado.

## Si el usuario ve un error de tamaño

1. **Mensaje en castellano** desde la API → validación Laravel o `DashboardUploadGuard` (PHP descartó el archivo).
2. **Clave `validation.uploaded`** → revisar `APP_LOCALE=es`, `lang/es/validation.php` y que nginx/PHP no recorten el body por debajo de 12M.
