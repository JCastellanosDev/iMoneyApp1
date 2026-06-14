// ════════════════════════════════════════════════════════════════
//  Cliente API compartido por todas las pantallas de FinFlow.
//  Centraliza: URL base, manejo del token (localStorage), wrapper de
//  fetch con el formato { success, data, message } y guard de sesión.
//
//  Inclúyelo en cada pantalla con:  <script src="../js/api.js"></script>
//  (desde la raíz, sin "../").  Define window.API.
// ════════════════════════════════════════════════════════════════
(function () {
  // Usa URL relativa para que funcione desde cualquier dispositivo/IP.
  const BASE = (window.FINFLOW_API_URL || "/api").replace(/\/$/, "");
  const TOKEN_KEY = "finflow_token";
  const USER_KEY = "finflow_user";

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
  const getUser = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  };
  const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));

  function logout(redirectTo) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    if (redirectTo) window.location.href = redirectTo;
  }

  // Wrapper de fetch. Lanza Error(message) cuando success === false.
  async function request(path, { method = "GET", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && getToken()) headers.Authorization = "Bearer " + getToken();

    let res;
    try {
      res = await fetch(BASE + path, {
        method,
        headers,
        body: body != null ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new Error("No se pudo conectar con el servidor (¿está corriendo el backend?)");
    }

    let json = {};
    try { json = await res.json(); } catch { /* respuesta vacía */ }

    if (res.status === 401 && auth) {
      // Token inválido/expirado → limpia sesión.
      logout();
    }
    if (!json.success) {
      throw new Error(json.message || "Error " + res.status);
    }
    return json.data;
  }

  // Atajos por recurso ───────────────────────────────────────────
  const API = {
    BASE,
    // sesión
    getToken, setToken, getUser, setUser, logout,
    isLoggedIn: () => !!getToken(),
    // guard: redirige a login si no hay sesión
    requireSession(loginUrl) {
      if (!getToken()) { window.location.href = loginUrl; return false; }
      return true;
    },
    // auth
    async login(email, password) {
      const d = await request("/auth/login", { method: "POST", auth: false, body: { email, password } });
      setToken(d.token); setUser(d.user); return d;
    },
    async register(nombre, email, password) {
      const d = await request("/auth/register", { method: "POST", auth: false, body: { nombre, email, password } });
      setToken(d.token); setUser(d.user); return d;
    },
    async google(email, nombre) {
      const d = await request("/auth/google", { method: "POST", auth: false, body: { email, nombre } });
      setToken(d.token); setUser(d.user); return d;
    },
    me: () => request("/auth/me"),
    // perfil
    getPerfil: () => request("/perfil"),
    updatePerfil: (cambios) => request("/perfil", { method: "PUT", body: cambios }),
    // transacciones
    listTransacciones: (q = "") => request("/transacciones" + q),
    crearTransaccion: (tx) => request("/transacciones", { method: "POST", body: tx }),
    borrarTransaccion: (id) => request("/transacciones/" + id, { method: "DELETE" }),
    // dashboard / finanzas
    dashboard: () => request("/dashboard"),
    getIngreso: () => request("/config/ingreso"),
    setIngreso: (ingreso) => request("/config/ingreso", { method: "PUT", body: ingreso }),
    getAhorros: () => request("/ahorros"),
    setAhorros: (a) => request("/ahorros", { method: "PUT", body: a }),
    // IA
    coach: (resumen) => request("/coach", { method: "POST", body: resumen ? { resumen } : {} }),
    leerTicket: (imageBase64, mediaType) => request("/leer-ticket", { method: "POST", body: { imageBase64, mediaType } }),
    // util
    categorias: () => request("/categorias", { auth: false }),
  };

  // Formateo de moneda MXN para usar en las vistas.
  API.fmt = (n) =>
    "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  window.API = API;
})();
