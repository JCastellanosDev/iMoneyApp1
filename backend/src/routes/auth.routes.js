// ════════════════════════════════════════════════════════════════
//  Rutas de autenticación y perfil.
//    POST /api/auth/register   → crear cuenta (nombre, email, password)
//    POST /api/auth/login      → iniciar sesión (email, password)
//    POST /api/auth/google     → alta/login con Google (email, nombre)
//    POST /api/auth/logout     → invalida el token en cliente
//    GET  /api/auth/me         → datos del usuario autenticado
//    GET  /api/perfil          → perfil + ajustes
//    PUT  /api/perfil          → editar nombre / avatar / ajustes
// ════════════════════════════════════════════════════════════════
import { Router } from "express";
import bcrypt from "bcryptjs";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { ok, fail, asyncHandler } from "../http.js";
import { usuarios, generarId } from "../store.js";
import { firmarToken, usuarioPublico, requireAuth } from "../auth.js";
import { limpiar } from "../utils.js";

const router = Router();

// ── Rate limiting: máximo 10 intentos por IP cada 15 minutos en auth ──
const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    ipKeyGenerator((req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.ip),
  message: { success: false, error: "DEMASIADOS_INTENTOS", message: "Demasiados intentos. Espera 15 minutos." },
});

// ── Utilidades de validación ──────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarEmail(email) {
  return EMAIL_RE.test(String(email || "").trim().toLowerCase());
}

// ── Plantilla de usuario nuevo ────────────────────────────────────
function nuevoUsuario({ nombre, email, passwordHash = null, googleId = null }) {
  return {
    id: generarId(),
    nombre: limpiar(nombre, 100),
    email: email.trim().toLowerCase(),
    passwordHash,
    googleId,
    avatar: null,
    telefono: null,
    ajustes: { notificaciones: true, biometria: false },
    ingreso: { monto: 0, frecuencia: "mensual" },
    ahorros: { meta: 0, actual: 0 },
    creado_en: new Date().toISOString(),
  };
}

// ── Registro ──────────────────────────────────────────────────────
router.post(
  "/auth/register",
  limiterAuth,
  asyncHandler(async (req, res) => {
    const { nombre, email, password } = req.body || {};

    if (!nombre || !email || !password) {
      return fail(res, 400, "DATOS_INCOMPLETOS", "Se requieren nombre, email y password");
    }
    if (!validarEmail(email)) {
      return fail(res, 422, "EMAIL_INVALIDO", "El formato del correo no es válido");
    }
    if (String(password).length < 8) {
      return fail(res, 422, "PASSWORD_CORTO", "La contrasena debe tener al menos 8 caracteres");
    }
    if (await usuarios.porEmail(email)) {
      return fail(res, 409, "EMAIL_EN_USO", "Ya existe una cuenta con ese correo");
    }

    const passwordHash = await bcrypt.hash(password, 12); // cost 12: más seguro que 10
    const usuario = await usuarios.crear(nuevoUsuario({ nombre, email, passwordHash }));
    const token = firmarToken(usuario);
    return ok(res, { token, user: usuarioPublico(usuario) }, "Cuenta creada con éxito", 201);
  })
);

// ── Login ─────────────────────────────────────────────────────────
router.post(
  "/auth/login",
  limiterAuth,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return fail(res, 400, "DATOS_INCOMPLETOS", "Se requieren email y password");
    }
    if (!validarEmail(email)) {
      // Respuesta genérica para no revelar si el email existe o no.
      return fail(res, 401, "CREDENCIALES_INVALIDAS", "Correo o contrasena incorrectos");
    }

    const usuario = await usuarios.porEmail(email);
    // Comparar siempre (aunque no exista) para evitar timing attacks.
    const hashFalso = "$2a$12$invalidhashpadding000000000000000000000000000000000000000";
    const coincide = await bcrypt.compare(password, usuario?.passwordHash || hashFalso);

    if (!usuario || !usuario.passwordHash || !coincide) {
      return fail(res, 401, "CREDENCIALES_INVALIDAS", "Correo o contrasena incorrectos");
    }

    const token = firmarToken(usuario);
    return ok(res, { token, user: usuarioPublico(usuario) }, "Inicio de sesión exitoso");
  })
);

// ── Google (alta o login) ─────────────────────────────────────────
// NOTA: Este endpoint confía en que el frontend ya validó el token de Google.
// En producción real se debería verificar el ID token con Google OAuth2.
router.post(
  "/auth/google",
  limiterAuth,
  asyncHandler(async (req, res) => {
    const { email, nombre = "Usuario Google", googleId = null } = req.body || {};

    if (!email || !validarEmail(email)) {
      return fail(res, 400, "DATOS_INCOMPLETOS", "Se requiere un email de Google válido");
    }

    let usuario = await usuarios.porEmail(email);
    if (!usuario) {
      usuario = await usuarios.crear(nuevoUsuario({ nombre, email, googleId }));
    }

    const token = firmarToken(usuario);
    return ok(res, { token, user: usuarioPublico(usuario) }, "Acceso con Google exitoso");
  })
);

// ── Logout ────────────────────────────────────────────────────────
// El token JWT es stateless; el logout real ocurre eliminando el token en el cliente.
// Este endpoint confirma la acción y puede usarse para invalidar sesiones futuras.
router.post(
  "/auth/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Registra la fecha del último logout en el perfil del usuario.
    await usuarios.actualizar(req.usuario.id, { ultimo_logout: new Date().toISOString() });
    return ok(res, null, "Sesión cerrada correctamente");
  })
);

// ── Usuario actual ────────────────────────────────────────────────
router.get(
  "/auth/me",
  requireAuth,
  asyncHandler(async (req, res) => ok(res, { user: usuarioPublico(req.usuario) }, "Sesión activa"))
);

// ── Perfil + ajustes ──────────────────────────────────────────────
router.get(
  "/perfil",
  requireAuth,
  asyncHandler(async (req, res) => ok(res, usuarioPublico(req.usuario), "Perfil obtenido"))
);

router.put(
  "/perfil",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { nombre, avatar, telefono, ajustes } = req.body || {};
    const cambios = {};

    if (typeof nombre === "string") {
      const n = limpiar(nombre, 100);
      if (!n) return fail(res, 422, "VALIDACION", "El nombre no puede estar vacío");
      cambios.nombre = n;
    }
    // Avatar: URL o base64 (máx 200 KB en texto)
    if (typeof avatar === "string") {
      if (avatar.length > 200_000) {
        return fail(res, 422, "VALIDACION", "La imagen del avatar es demasiado grande");
      }
      cambios.avatar = avatar;
    }
    if (typeof telefono === "string") {
      cambios.telefono = limpiar(telefono, 20);
    }
    if (ajustes && typeof ajustes === "object") {
      cambios.ajustes = { ...req.usuario.ajustes, ...ajustes };
    }

    if (Object.keys(cambios).length === 0) {
      return fail(res, 400, "SIN_CAMBIOS", "No se enviaron campos para actualizar");
    }

    const usuario = await usuarios.actualizar(req.usuario.id, cambios);
    return ok(res, usuarioPublico(usuario), "Perfil actualizado");
  })
);

export default router;
