# 📡 ENDPOINTS — FinFlow / ¡Money API

API REST que da soporte a la interfaz del branch **`interfaz`**.
Base URL local: **`http://localhost:3000/api`**

## Convenciones

Todas las respuestas usan la misma estructura.

**Éxito**
```json
{ "success": true, "data": { }, "message": "Descripción" }
```

**Error**
```json
{ "success": false, "error": "CODIGO_ERROR", "message": "Descripción del error" }
```

**Autenticación:** las rutas privadas exigen el header
`Authorization: Bearer <token>` (el token se obtiene en register/login/google).

**CORS:** habilitado para cualquier origen por defecto (`CORS_ORIGIN=*`).

| Código HTTP | Cuándo |
|-------------|--------|
| 200 / 201 | OK / creado |
| 400 | datos faltantes |
| 401 | sin token / credenciales inválidas |
| 404 | recurso o ruta no encontrada |
| 409 | conflicto (email ya registrado) |
| 422 | validación de campos |
| 500 | error interno |

---

## 🔓 Utilidades (públicas)

### `GET /api/health`
Estado del servicio.
```json
{ "success": true, "data": { "status": "up", "hora": "2026-06-13T..." }, "message": "API operativa" }
```

### `GET /api/categorias`
Catálogo de categorías con su color (para la gráfica de distribución).
```json
{ "success": true, "data": [ { "nombre": "Comida", "color": "#f97316" }, ... ], "message": "..." }
```

---

## 🔐 Autenticación — pantallas Login / Registro / Google

### `POST /api/auth/register`
Crea una cuenta. **Pantalla:** `registro_compacto_gesti_n_de_ahorro`.

| Body | Tipo | Req |
|------|------|-----|
| `nombre` | string | ✔ |
| `email` | string | ✔ |
| `password` | string | ✔ |

```json
{ "success": true,
  "data": { "token": "JWT...", "user": { "id", "nombre", "email", "avatar", "ajustes", "ingreso", "ahorros" } },
  "message": "Cuenta creada con éxito" }
```
Errores: `409 EMAIL_EN_USO`, `400 DATOS_INCOMPLETOS`.

### `POST /api/auth/login`
Inicia sesión. **Pantalla:** `login_compacto_gesti_n_de_ahorro`.

| Body | Tipo | Req |
|------|------|-----|
| `email` | string | ✔ |
| `password` | string | ✔ |

Devuelve `{ token, user }`. Error: `401 CREDENCIALES_INVALIDAS`.

### `POST /api/auth/google`
Alta o inicio de sesión con Google. **Pantalla:** `registro_con_google_finflow`.

| Body | Tipo | Req |
|------|------|-----|
| `email` | string | ✔ |
| `nombre` | string | — |
| `googleId` | string | — |

Devuelve `{ token, user }` (crea la cuenta si el correo no existía).

### `GET /api/auth/me` 🔒
Devuelve `{ user }` del token actual.

---

## 👤 Perfil y ajustes — pantalla Ajustes

### `GET /api/perfil` 🔒
Devuelve el perfil completo (sin password).

### `PUT /api/perfil` 🔒
Edita nombre, avatar y/o ajustes. **Pantalla:** `ajustes_finflow` (toggles Notificaciones / Biometría, botón Editar).

| Body | Tipo | Notas |
|------|------|-------|
| `nombre` | string | opcional |
| `avatar` | string | opcional (URL) |
| `ajustes` | object | `{ "notificaciones": bool, "biometria": bool }` (merge parcial) |

---

## 💸 Transacciones — Anadir Gasto / Anadir Ingreso / Historial

Colección unificada de ingresos y gastos, diferenciados por `tipo`.

**Objeto transacción**
```json
{
  "id": "uuid",
  "tipo": "gasto" | "ingreso",
  "monto": 84.50,
  "descripcion": "Supermercado Central",
  "categoria": "Comida",
  "metodo_pago": "Tarjeta" | "Efectivo" | null,
  "comercio": "Supermercado Central" | null,
  "fecha": "2026-06-13T10:45:00.000Z",
  "recurrente": false,
  "frecuencia": null | "semanal" | "quincenal" | "mensual",
  "creado_en": "2026-06-13T..."
}
```

### `GET /api/transacciones` 🔒
Lista las transacciones del usuario (más recientes primero).
**Pantalla:** `historial_de_transacciones_finflow` (filtros Todo / Ingresos / Gastos).

| Query | Valores | Notas |
|-------|---------|-------|
| `tipo` | `ingreso` \| `gasto` | filtra; omítelo para "Todo" |
| `limite` | número | máximo de resultados |

Devuelve `data: [ transacción, ... ]`.

### `POST /api/transacciones` 🔒
Registra un gasto o ingreso. **Pantallas:** `a_adir_gasto_con_escaneo_de_ticket`, `a_adir_ingreso_ventana_emergente`.

| Body | Tipo | Notas |
|------|------|-------|
| `tipo` | string | `"gasto"` (default) o `"ingreso"` |
| `monto` | número | **> 0** obligatorio (campo "Importe"/"Monto total") |
| `descripcion` | string | "¿En qué gastaste?" / "Descripción" |
| `categoria` | string | una de `GET /api/categorias`; default `Otros`/`Nómina` |
| `metodo_pago` | string | `Efectivo` \| `Tarjeta` (solo gasto) |
| `comercio` | string | opcional |
| `fecha` | ISO date | opcional, default ahora |
| `recurrente` | bool | toggle "ingreso recurrente" |
| `frecuencia` | string | `semanal` \| `quincenal` \| `mensual` |

Respuesta `201` con la transacción creada. Error: `422 VALIDACION`.

### `GET /api/transacciones/:id` 🔒
Una transacción por id. Error: `404 NO_ENCONTRADA`.

### `PUT /api/transacciones/:id` 🔒
Actualiza campos (cualquier subconjunto del body de creación).

### `DELETE /api/transacciones/:id` 🔒
Elimina. Devuelve `{ "id": "..." }`.

---

## 📊 Dashboard / Cartera

### `GET /api/dashboard` 🔒
Resumen financiero agregado. **Pantallas:** `dashboard_con_modal_de_ahorros` y `cartera`.

```json
{
  "success": true,
  "data": {
    "disponible": 1948.80,          // "Dinero Disponible" / "Total Balance"
    "ingresos": 2850,
    "gastado": 901.20,              // tarjeta "Gastado"
    "ahorros": { "meta": 10000, "actual": 4800 },   // tarjeta "Ahorros"
    "distribucion": [               // gráfica "Distribución de Gastos"
      { "categoria": "Vivienda", "monto": 450, "porcentaje": 49.93, "color": "#2563eb" }
    ],
    "recientes": [ /* transacciones */ ],            // "Transacciones Recientes"
    "total_transacciones": 9
  },
  "message": "Dashboard obtenido"
}
```

---

## ⚙️ Configuración de ingreso

### `GET /api/config/ingreso` 🔒
Devuelve `{ "monto", "frecuencia", "mensual_estimado" }`.

### `PUT /api/config/ingreso` 🔒
| Body | Tipo | Notas |
|------|------|-------|
| `monto` | número | ≥ 0 |
| `frecuencia` | string | `diario` \| `semanal` \| `quincenal` \| `mensual` |

Calcula y guarda `mensual_estimado`. Error: `422 VALIDACION`.

---

## 🐷 Ahorros

### `GET /api/ahorros` 🔒
Devuelve `{ "meta", "actual" }`.

### `PUT /api/ahorros` 🔒
| Body | Tipo |
|------|------|
| `meta` | número ≥ 0 |
| `actual` | número ≥ 0 |

---

## 🤖 Inteligencia Artificial (Gemini)

> Si no hay `GEMINI_API_KEY`, o si la IA falla/excede cuota, estos
> endpoints **degradan a una respuesta demo** con `200` para que el flujo
> de la interfaz nunca se rompa (el `message` lo indica).

### `POST /api/leer-ticket` 🔒
OCR + extracción de un ticket. **Pantalla:** `a_adir_gasto_con_escaneo_de_ticket` (botón "Escanear").

| Body | Tipo | Req |
|------|------|-----|
| `imageBase64` | string (base64, sin prefijo `data:`) | ✔ |
| `mediaType` | string | default `image/jpeg` |

```json
{ "success": true,
  "data": { "fecha": "YYYY-MM-DD", "total": 45.0, "comercio": "...", "productos": [], "categoria": "Comida" },
  "message": "Ticket leído" }
```
Error: `400 FALTA_IMAGEN`.

### `POST /api/coach` 🔒
Genera 3 consejos financieros. **Pantalla:** dashboard modal "regano"/asistente.

| Body | Tipo | Notas |
|------|------|-------|
| `resumen` | object | opcional; si se omite, se calcula con los datos del usuario |

```json
{ "success": true, "data": { "consejos": ["...", "...", "..."] }, "message": "Consejos generados" }
```
