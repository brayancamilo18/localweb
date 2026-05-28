<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## Subidas de imágenes (dashboard)

Límites de PHP, nginx y Laravel para fotos de galería/logo/favicon: ver [docs/UPLOADS.md](docs/UPLOADS.md).

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

# Sistema de páginas públicas SEO

## Arquitectura

Las páginas públicas de los negocios (`kairos.app.onez.es`) se sirven
directamente desde Laravel via Blade, sin pasar por el SPA de React.
Esto garantiza HTML completamente renderizado en el servidor para
indexación correcta por buscadores.

## Flujo de una petición pública

1. Nginx recibe `GET kairos.app.onez.es/`
2. Laravel — `ResolveTenantForWeb` identifica el tenant desde el host
3. `PublicTenantPageController::show()` busca en cache (Redis, TTL 900s)
4. Cache HIT → devuelve HTML cacheado con header `X-Cache: HIT`
5. Cache MISS → renderiza la plantilla Blade correspondiente, guarda en
   cache y devuelve con header `X-Cache: MISS`

## Invalidación de cache

Los observers invalidan automáticamente todas las caches del subdominio
cuando cambia cualquier dato del negocio:

| Observer | Evento | Invalida |
|---|---|---|
| BusinessObserver | saved | HTML, JSON, robots, sitemap tenant |
| BusinessObserver | saved (is_published cambia) | + sitemap maestro |
| BusinessObserver | deleted / restored | sitemap maestro |
| BusinessImageObserver | saved / deleted | HTML, JSON, sitemap tenant |
| BusinessServiceObserver | saved / deleted | HTML, JSON |

## Plantillas Blade

Ubicación: `resources/views/public/templates/{slug}.blade.php`
Layout base: `resources/views/public/layouts/tenant.blade.php`
Partial SEO: `resources/views/public/partials/head-seo.blade.php`
Partial JSON-LD: `resources/views/public/partials/json-ld.blade.php`

Las plantillas HTML estáticas en `front/public/templates/{slug}.html`
siguen existiendo y son usadas por el wizard de onboarding para
previsualización. Son versiones paralelas — NO eliminar.

## Servicios

| Servicio | Responsabilidad |
|---|---|
| `TenantViewPayload` | Business → array de variables para la plantilla Blade |
| `SeoMetaBuilder` | Business → array $seo con title, description, OG, etc. |
| `JsonLdBuilder` | Business → string JSON-LD Schema.org LocalBusiness |

## robots.txt

- `{subdominio}.app.onez.es/robots.txt` — permite indexación, apunta al sitemap del tenant
- `app.onez.es/robots.txt` — permite todo excepto rutas internas, apunta a sitemap-index.xml
- Cache TTL: 3600s. Invalidado por BusinessObserver cuando cambia subdomain o is_published.

## Sitemap

- `{subdominio}.app.onez.es/sitemap.xml` — URL canónica del negocio + imágenes
- `app.onez.es/sitemap-index.xml` — índice de todos los negocios publicados
- Cache TTL sitemap tenant: 3600s. Cache TTL sitemap maestro: 1800s.
- Comando manual: `php artisan sitemap:regenerate-master`
- Scheduler: regeneración automática cada hora.

## Fase 2 pendiente

- Favicon dinámico por cliente Pro (`favicon_path` en tabla businesses,
  campo añadido pero sin lógica Pro aún).
- Unificación de plantillas Blade y HTML estáticas (Opción B) cuando el
  catálogo supere ~40 plantillas.
- Paginación del sitemap maestro si se superan 49.000 negocios publicados.
