# Sistema POS - Tienda de Calzado

Monorepo con backend API REST, aplicacion desktop Electron y frontend React para operacion de ventas, inventario, caja y cierres.

## Arquitectura General
- `backend`: API REST en Node.js + Express + PostgreSQL.
- `desktop/electron`: proceso principal Electron + bridge seguro `preload.js`.
- `desktop/renderer`: SPA React (Vite) que consume la API y maneja flujo offline.

## Estructura del Monorepo
```text
tienda-calzado
├── backend
│   ├── src
│   │   ├── controllers
│   │   ├── db
│   │   ├── listeners
│   │   ├── middlewares
│   │   ├── routes
│   │   ├── utils
│   │   ├── index.js
│   │   └── server.js
│   ├── uploads
│   ├── .env
│   └── package.json
└── desktop
    ├── electron
    │   ├── main.js
    │   ├── offlineStore.js
    │   └── preload.js
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
    ├── build
    │   └── myIco.ico
    └── package.json
```

## Requisitos
- Node.js LTS.
- PostgreSQL disponible.
- npm.

## Puesta en Marcha
1. Levantar backend:
```bash
cd backend
npm install
npm run dev
```

2. Levantar desktop (renderer + electron):
```bash
cd desktop
npm install
npm run dev
```

## Variables de Entorno
Backend (`backend/.env`):
- `PORT` (ej. `3000`)
- `JWT_SECRET`
- Conexion DB por `DATABASE_URL` o por:
- `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`

Renderer (`desktop/renderer/.env`):
- `VITE_API_URL` (ej. `http://localhost:3000/api`)

## Reglas Tecnicas Clave
- No consumir API directo desde componentes: usar `desktop/renderer/src/services/transport.js`.
- Seguridad Electron obligatoria: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Navegacion SPA: usar `Link` / `NavLink`, no `<a href>`.
- Autenticacion: JWT por `Authorization: Bearer <token>`.

## Flujo Offline (Ventas)
- Encola solo `POST /ventas` cuando no hay conexion con backend.
- Cola persistida en Electron Store (`offline-ventas`).
- Reintentos con `fail_count`; si llega a 3, el item se elimina.
- Errores de negocio no bloquean el resto de la cola.

## Scripts Utiles
Backend:
- `npm run dev`
- `npm start`

Desktop:
- `npm run dev`
- `npm run dev:renderer`
- `npm run dev:electron`
- `npm run build:renderer`
- `npm run build`

## Validacion Recomendada
```bash
# sintaxis backend
node --check backend/src/server.js

# build frontend
cd desktop
npm run build:renderer

# busqueda de debug
rg -n "console\\.log|TODO|FIXME" backend/src desktop/renderer/src
```

## Documentacion por Modulo
- Backend: `backend/README.md`
- Desktop + Renderer: `desktop/README.md`
