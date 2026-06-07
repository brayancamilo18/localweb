# Dashboard Tour · ONEZ

Tour guiado de primera vez del dashboard. **10 pasos** (uno por sección del
sidebar), modal de bienvenida, modal de cierre, y FAB "Reanudar tour"
cuando el usuario lo cierra a mitad.

## Stack y convenciones

- React 18 + TypeScript estricto (`verbatimModuleSyntax: true`).
- React Router v6 con `useNavigate` para sincronizar la ruta con cada paso.
- Sin dependencias nuevas: usa los primitives existentes (`Btn`, `Icon`).
- Estilos en `tour.css` con prefijo `lw-tour-` y tokens de `tokens.css`.

## Archivos

```
src/features/dashboard/tour/
├── README.md
├── types.ts
├── tourSteps.ts        ← contenido final de los 10 pasos
├── TourContext.tsx     ← <TourProvider> + useTour()
├── TourRunner.tsx      ← orquestador único, renderiza welcome/overlay/tooltip/finish/FAB
├── TourOverlay.tsx     ← spotlight | soft-veil (default) | attenuate
├── TourTooltip.tsx     ← popover desktop/tablet + bottom-sheet móvil
├── WelcomeModal.tsx
├── FinishModal.tsx
├── useTourAnchor.ts    ← polling rAF al selector del ancla
├── useBreakpoint.ts    ← 'desktop' | 'tablet' | 'mobile' (cortes en 1080 y 640)
├── api.ts              ← POST /dashboard/tour/complete
├── index.ts
└── tour.css
```

## Integración

Ver pasos numerados en los prompts de Cursor. Resumen:

1. **`DashboardPage.tsx`** envuelve el contenido con `<TourProvider>` y
   monta `<TourRunner/>` al lado del `<Outlet/>`.
2. **`dashboard.tsx`** añade `data-tour="<id>"` a cada NavLink del sidebar
   y `data-tour-mobile="menu-button"` al botón "Menú" de la mobilebar.
3. **Cada sección** añade un `data-tour="<id>-main"` a una card visible
   del main, para que en móvil/tablet el tooltip pueda anclarse aunque
   el sidebar esté oculto.
4. **Backend**: migración añadiendo `dashboard_tour_completed_at` a
   `businesses` + endpoint `POST /dashboard/tour/complete`.

## Disparo automático

`DashboardPage.tsx` decide si arrancar el tour:

```ts
const completed = window.localStorage.getItem('lw_tour_completed_v1') === 'true'
const backendDone = business.dashboard_tour_completed_at != null
const onboardDone = business.onboarding_completed_at != null
const shouldStartTour = onboardDone && !completed && !backendDone
```

Si es la primera vez (`shouldStartTour=true`), el `<TourProvider>` arranca
con `showWelcome: true` y `<TourRunner>` muestra el modal de bienvenida.

## Storage keys

| Key                          | Significado                                          |
|------------------------------|------------------------------------------------------|
| `lw_tour_completed_v1`       | `'true'` cuando se terminó (también marca backend)   |
| `lw_tour_progress_v2`        | `{stepIndex, savedAt}` si se cerró a mitad           |
| `lw_tour_mobile_intro_seen`  | `'true'` para no repetir el paso 0 móvil             |

Sufijo `_v1` para poder invalidar a todos los usuarios si rehacemos el tour.

## Variantes de overlay

```tsx
<TourRunner overlayVariant="soft-veil" />  // recomendado (default)
<TourRunner overlayVariant="spotlight" />  // velo oscuro con agujero
<TourRunner overlayVariant="attenuate" />  // sin velo, atenúa shell
```

## Testing manual

En consola del navegador para resetear:

```js
localStorage.removeItem('lw_tour_completed_v1');
localStorage.removeItem('lw_tour_progress_v2');
localStorage.removeItem('lw_tour_mobile_intro_seen');
location.reload();
```

Recorridos a probar:

- **Desktop happy path** — 9 pasos, sidebar resaltado por el halo verde.
- **Free user en paso 6 o 7** — tooltip "bloqueado"; `Siguiente` salta al
  próximo paso desbloqueado en vez de detenerse.
- **Móvil** — primer paso es el intro al botón "Menú"; resto son bottom-sheets.
- **Cierre a mitad + recarga** — aparece FAB "Reanudar tour" abajo-derecha.
- **Tablet (≤1080px)** — sidebar oculto, tooltip centrado flotante.
- **prefers-reduced-motion** — sin slide-up, sin pulsado.

## Backend (Laravel)

Migración:

```php
Schema::table('businesses', function (Blueprint $t) {
    $t->timestamp('dashboard_tour_completed_at')->nullable();
});
```

Ruta + controlador:

```php
// routes/api.php (dentro del grupo auth:sanctum + business)
Route::post('/dashboard/tour/complete', [TourController::class, 'complete']);

// TourController.php
public function complete(Request $request)
{
    $business = $request->user()->business;
    if ($business->dashboard_tour_completed_at === null) {
        $business->dashboard_tour_completed_at = now();
        $business->save();
    }
    return response()->noContent();
}
```

Devolver el campo en el resource del business para que `getBusiness()` lo incluya.
