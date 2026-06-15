// ════════════════════════════════════════════════════════════════
//  Autenticación con JWT. Genera tokens al registrarse / iniciar sesión
//  y protege las rutas privadas con el middleware `requireAuth`.
// ════════════════════════════════════════════════════════════════
import jwt from "jsonwebtoken";
import { fail } from "./http.js";
import { usuarios } from "./store.js";

const SECRET = process.env.TOKEN_SECRET;
if (!SECRET) {
  console.error("[FATAL] TOKEN_SECRET no está configurado en .env. El servidor no puede arrancar sin él.");
  process.exit(1);
}
const EXPIRA = "7d";

/** Firma un token para un usuario. */
export function firmarToken(usuario) {
  return jwt.sign({ sub: usuario.id, email: usuario.email }, SECRET, { expiresIn: EXPIRA });
}

/** Quita los campos sensibles antes de mandar un usuario a la interfaz. */
export function usuarioPublico(u) {
  if (!u) return null;
  const { passwordHash, ...resto } = u;
  return resto;
}

/**
 * Middleware: exige un header `Authorization: Bearer <token>` válido.
 * Deja el usuario completo en `req.usuario`.
 */
export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return fail(res, 401, "NO_AUTORIZADO", "Falta el token de autenticación");
  }
  try {
    const payload = jwt.verify(token, SECRET);
    const usuario = await usuarios.porId(payload.sub);
    if (!usuario) {
      return fail(res, 401, "TOKEN_INVALIDO", "El usuario del token ya no existe");
    }
    req.usuario = usuario;
    next();
  } catch {
    return fail(res, 401, "TOKEN_INVALIDO", "Token inválido o expirado");
  }
}
