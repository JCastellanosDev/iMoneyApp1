# FinFlow / ¡Money — Backend REST

Backend que da soporte a la interfaz del branch **`interfaz`** (mockups
FinFlow / ¡Money). Cubre autenticación, transacciones (ingresos/gastos),
dashboard, ajustes, ahorros y los endpoints de IA (escaneo de ticket y
coach financiero con Gemini).

## Stack

- **Node.js + Express 4** — servidor REST.
- **JWT (`jsonwebtoken`) + `bcryptjs`** — autenticación.
- **Persistencia en archivo JSON** (`data/db.json`) — cero servicios
  externos, ideal para hackathon. Para producción se puede cambiar
  `src/store.js` por una base de datos real sin tocar las rutas.
- **Gemini** (`@google/generative-ai`) — IA opcional con degradación a
  modo demo si no hay llave o se excede la cuota.

Todas las respuestas siguen el formato estándar
`{ success, data, message }` (o `{ success:false, error, message }`).

## Puesta en marcha

```bash
cd backend
npm install
cp .env.example .env        # ajusta TOKEN_SECRET y, si quieres IA, GEMINI_API_KEY
npm run seed                # opcional: usuario demo + transacciones
npm run dev                 # http://localhost:3000  (npm start sin --watch)
```

Luego abre **http://localhost:3000/** en el navegador: el backend
**también sirve la interfaz** (los mockups HTML de la raíz del repo), así
que API y frontend comparten origen y no hay problemas de CORS. La raíz
redirige a la pantalla de login.

**Usuario demo** (tras `npm run seed`):
`demo@finflow.mx` / `demo1234`

### Flujo de la interfaz (ya conectada al API)

Todas las pantallas están cableadas vía `js/api.js` (cliente compartido):

| Pantalla | Hace |
|----------|------|
| Login / Registro / Google | guardan el JWT en `localStorage` y entran al dashboard |
| `index.html` (home) | carga balance, distribución (donut), recientes |
| Dashboard "regaño" | dashboard + consejos del Coach IA |
| Cartera | balance + accesos a añadir gasto/ingreso |
| Añadir Gasto | guarda gasto; botón **Escanear** sube foto → `/api/leer-ticket` |
| Añadir Ingreso | guarda ingreso (con recurrencia) |
| Historial | lista real con filtros Todos / Gastos / Ingresos |
| Ajustes | perfil real, toggles persistentes, cerrar sesión |

## Probar

- Importa `requests.http` (extensión REST Client de VS Code), **o**
- usa los `curl` documentados al final de ese archivo, **o**
- consulta **`ENDPOINTS.md`** para el contrato completo.

```bash
curl http://localhost:3000/api/health
```

## Cómo está conectada la interfaz

Cada pantalla incluye `<script src="../js/api.js">`, el cliente compartido
(`/js/api.js`) que centraliza URL base, token y el wrapper de `fetch`.
Ejemplo de uso dentro de una pantalla:

```js
// Login
await API.login(email, password);          // guarda token + user en localStorage
window.location.href = "../index.html";

// Pantalla privada (dashboard, historial, ajustes…)
API.requireSession("../login.../inicioSesion.html"); // redirige si no hay sesión
const data = await API.dashboard();         // { disponible, gastado, distribucion, ... }
```

`API` expone atajos para todos los recursos (`API.crearTransaccion`,
`API.listTransacciones`, `API.coach`, `API.leerTicket`, `API.logout`, …) y
adjunta el header `Authorization: Bearer <token>` automáticamente. Si el
backend corre en otra URL, define `window.FINFLOW_API_URL` antes de cargar
`api.js`.

## Estructura

```
backend/
├── src/
│   ├── server.js              # app Express, CORS, montaje de rutas, 404 y errores
│   ├── store.js               # persistencia JSON (usuarios, transacciones)
│   ├── auth.js                # JWT: firmar/verificar, requireAuth
│   ├── http.js                # helpers de respuesta { success, data, message }
│   ├── resumen.js             # cálculos financieros (dashboard + coach)
│   ├── seed.js                # datos demo
│   ├── data/categorias.js     # categorías + colores + factores mensuales
│   └── routes/
│       ├── auth.routes.js         # register, login, google, me, perfil
│       ├── transacciones.routes.js# CRUD de ingresos/gastos
│       ├── dashboard.routes.js    # dashboard, config/ingreso, ahorros
│       └── ia.routes.js           # leer-ticket, coach
├── ENDPOINTS.md
├── requests.http
└── .env.example
```
