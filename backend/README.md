# Backend - Sistema POS Tienda de Calzado

API REST de ventas, caja, cierres, inventario, auth e informes.

## Stack
- Node.js (ESM)
- Express 5
- PostgreSQL (`pg`)
- JWT (`jsonwebtoken`)
- CORS
- Multer (upload Excel)

## Estructura
```text
backend
├── src
│   ├── controllers
│   ├── db
│   ├── listeners
│   ├── middlewares
│   ├── routes
│   ├── utils
│   ├── index.js
│   └── server.js
├── uploads
├── .env
└── package.json
```

## Instalacion y ejecucion
```bash
cd backend
npm install
npm run dev
# o npm start
```

## Variables de entorno
- `PORT` (default 4000)
- `JWT_SECRET`
- Opcion A (recomendada): `DATABASE_URL`
- Opcion B: `DB_USER`, `DB_HOST`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`
- `NODE_ENV=production` habilita SSL con `rejectUnauthorized: false`

## Rutas API
Base: `/api`

### Auth
- `POST /auth/login`
- `POST /auth/verify-password` (JWT)

### Ventas
- `POST /ventas` (JWT)
- `GET /ventas/dashboard` (JWT)
- `GET /ventas/historial` (JWT)

### Dashboard
- `GET /dashboard` (JWT)

### Inventario
- `GET /inventario` (JWT)
- `POST /inventario` (JWT + rol `admin`)
- `PUT /inventario/:id` (JWT + rol `admin`)
- `DELETE /inventario/:id` (JWT + rol `admin`)

### Cierres
- `POST /cierre` (JWT)
- `GET /cierre/:id/ventas` (JWT)
- `GET /historial-cierres` (JWT)

### Sesion Caja
- `POST /sesion-caja/abrir` (JWT)
- `GET /sesion-caja/activa` (JWT)
- `POST /sesion-caja/cerrar` (JWT)

### Informes
- `GET /informes?desde=&hasta=` (JWT)

### Upload
- `POST /upload/inventario` (JWT + rol `admin`, Excel <= 5MB)

## Seguridad y autorizacion
- Middleware JWT: `src/middlewares/auth.middleware.js`
- RBAC por rol: `requireRole("admin")`
- `usuario_id` operativo en ventas se toma desde token (`req.user.id`)

## Eventos y auditoria
- Event bus async: `src/utils/eventBus.js`
- Eventos: `src/utils/events.js`
- Listener inicial: `src/listeners/venta.listener.js`
- Auditoria BD: `src/utils/auditoria.js`

## Tablas usadas por el backend
- `usuarios`
- `ventas`
- `detalle_ventas`
- `productos`
- `inventario`
- `sesiones_caja`
- `cierres`
- `auditoria`

## Validacion rapida
```bash
node --check src/server.js
node --check src/controllers/ventas.controller.js
node --check src/controllers/inventario.controller.js
```

## Notas de mantenimiento
- CORS acepta `http://localhost:5173` y requests sin `origin` (Electron).
- `src/utils/hash.js` existe pero no esta integrado al flujo actual de login.
- `upload.routes.js` valida y recibe el archivo; el procesamiento de Excel aun es pendiente.
