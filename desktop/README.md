# Desktop - Electron + Renderer (React)

Aplicacion de escritorio del POS con interfaz React y puente seguro Electron.

## Stack
- Electron
- React 19 + React Router
- Vite
- Tailwind CSS
- Axios
- `electron-store` (cola offline)
- `idb` (cache local de inventario)

## Estructura
```text
desktop
├── electron
│   ├── main.js
│   ├── preload.js
│   └── offlineStore.js
├── renderer
│   ├── public
│   ├── src
│   │   ├── app
│   │   ├── auth
│   │   ├── components
│   │   ├── context
│   │   ├── features
│   │   ├── hooks
│   │   ├── offline
│   │   ├── services
│   │   ├── store
│   │   ├── styles
│   │   └── utils
│   ├── .env
│   └── package.json
├── scripts
│   └── dev.js
└── package.json
```

## Instalacion y ejecucion
```bash
cd desktop
npm install
npm run dev
```

Scripts:
- `npm run dev`: levanta Vite y luego Electron (`scripts/dev.js`)
- `npm run dev:renderer`
- `npm run dev:electron`
- `npm run build:renderer`
- `npm run build` (renderer + electron-builder)

## Seguridad Electron
Configurado en `electron/main.js`:
- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`

Bridge expuesto por `electron/preload.js` en `window.electron`:
- `guardarVentaOffline(venta)`
- `obtenerVentasOffline()`
- `eliminarVentaOffline(id)`
- `marcarVentaOfflineFallida(id, error)`

## Renderer: organizacion funcional
- `app/router.jsx`: rutas y proteccion por rol (`admin`, `vendedor`)
- `auth/*`: login, contexto auth, guards
- `context/CajaContext.jsx`: estado global de sesion de caja
- `features/*`: modulos por dominio
- `services/*`: capa de acceso a API
- `offline/*`: cache local

## Conexion API
- Cliente en `renderer/src/services/api.js`.
- `baseURL` por `VITE_API_URL`; fallback `/api`.
- Interceptores: adjuntan token en `Authorization`.
- Interceptores: emiten `backend-health-status` para estado online real.

## Regla de transporte obligatoria
- Usar `renderer/src/services/transport.js`.
- No usar `axios/fetch` directo en componentes.

## Flujo Offline
- Soporta cola offline para `POST /ventas`.
- Si falla por red: guarda venta en `electron-store`.
- Emite `offline-queue-status`.
- Sincroniza al recuperar conectividad (`online`) o al inicializar.
- Error de red: corta sync y espera siguiente intento.
- Error de negocio: marca fallo y continua con siguientes items.
- `fail_count >= 3`: elimina item de la cola.

## Variables de entorno
`desktop/renderer/.env`:
- `VITE_API_URL=http://localhost:4000/api`

## Roles y navegacion
- Roles declarados en `renderer/src/auth/roles.js`: `admin`, `vendedor`.

Rutas protegidas por `ProtectedRoute`:
- Admin: dashboard, inventario, venta, informes, cierre, historial.
- Vendedor: venta, inventario, cierre, historial.

## CSP
En `renderer/index.html`:
- CSP explicita sin `unsafe-eval`.
- `connect-src` habilita backend local (`4000`) y Vite (`5173`) en desarrollo.

## Validacion
```bash
cd desktop
npm run build:renderer
npm run build
```

Chequeo rapido:
```bash
rg -n "fetch\\(|axios\\." renderer/src
```
