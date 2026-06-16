// ════════════════════════════════════════════════════════════════
//  Cliente API compartido por todas las pantallas de FinFlow.
//  Centraliza: URL base, manejo del token (localStorage), wrapper de
//  fetch con el formato { success, data, message } y guard de sesión.
//
//  Inclúyelo en cada pantalla con:  <script src="../js/api.js"></script>
//  (desde la raíz, sin "../").  Define window.API.
//
//  ⚠️  Cuando el backend no está disponible (Vercel sin API desplegada),
//  los métodos dashboard/listTransacciones/crearTransaccion caen
//  automáticamente a datos de demostración en localStorage.
// ════════════════════════════════════════════════════════════════
(function () {
  // Usa URL relativa para que funcione desde cualquier dominio/IP.
  const BASE = (window.FINFLOW_API_URL || "/api").replace(/\/$/, "");
  const TOKEN_KEY = "finflow_token";
  const USER_KEY  = "finflow_user";

  const getToken = () => localStorage.getItem(TOKEN_KEY);
  const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
  const getUser  = () => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  };
  const setUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));

  function logout(redirectTo) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem("user_session");
    if (redirectTo) window.location.href = redirectTo;
  }

  // ── Wrapper de fetch ─────────────────────────────────────────
  // Lanza Error(message) cuando success === false.
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
      throw new Error("Sin conexión con el servidor");
    }

    let json = {};
    try { json = await res.json(); } catch { /* respuesta vacía */ }

    // Solo cierra sesión por 401 si hay token JWT real; si es solo user_session (demo),
    // no destruye la sesión para no desloguear al cambiar de pestaña.
    if (res.status === 401 && auth && getToken()) logout();

    if (!json.success) {
      throw new Error(json.message || "Error " + res.status);
    }
    return json.data;
  }

  // ── Datos de demostración (fallback sin backend) ─────────────
  function emptyDashboard() {
    return {
      disponible: 0, gastado: 0, ingresos: 0,
      ahorros: { actual: 0, meta: 0 },
      distribucion: [],
      recientes: [],
      total_transacciones: 0,
    };
  }

  function mockDashboard() {
    // Si el usuario se registró como cuenta real, no sembrar datos demo.
    if (localStorage.getItem("imoney_real_account")) {
      const stored = localStorage.getItem("imoney_dashboard_data");
      if (stored) {
        try { return JSON.parse(stored); } catch { /* continúa */ }
      }
      return emptyDashboard();
    }
    // Modo demo: cargar o sembrar datos de ejemplo.
    const stored = localStorage.getItem("imoney_dashboard_data");
    if (stored) {
      try { return JSON.parse(stored); } catch { /* continúa */ }
    }
    const now = Date.now();
    const data = {
      disponible: 14250.00, gastado: 3850.00, ingresos: 18100.00,
      ahorros: { actual: 5200.00, meta: 20000.00 },
      distribucion: [
        { categoria: "Comida",          monto: 1500, porcentaje: 39, color: "#EA4335" },
        { categoria: "Servicios",        monto: 1200, porcentaje: 31, color: "#4285F4" },
        { categoria: "Entretenimiento", monto: 1150, porcentaje: 30, color: "#FBBC05" },
      ],
      recientes: [
        { id: 1, descripcion: "Subscripcion Streaming", tipo: "gasto",   monto: 199,  fecha: new Date(now).toISOString(),            categoria: "Entretenimiento" },
        { id: 2, descripcion: "Deposito de Nomina",     tipo: "ingreso", monto: 9000, fecha: new Date(now - 86400000).toISOString(), categoria: "Nomina" },
        { id: 3, descripcion: "Cafeteria y Alimentos",  tipo: "gasto",   monto: 85,   fecha: new Date(now - 172800000).toISOString(),categoria: "Comida" },
        { id: 4, descripcion: "Supermercado Mensual",   tipo: "gasto",   monto: 1450, fecha: new Date(now - 345600000).toISOString(),categoria: "Comida" },
      ],
      total_transacciones: 4,
    };
    localStorage.setItem("imoney_dashboard_data", JSON.stringify(data));
    return data;
  }

  // ── Objeto API público ────────────────────────────────────────
  const API = {
    BASE,
    getToken, setToken, getUser, setUser, logout,
    isLoggedIn: () => !!(getToken() || localStorage.getItem("user_session")),

    /**
     * Redirige a loginUrl si no hay sesión activa.
     * Acepta tanto el JWT real (finflow_token) como la clave de
     * demo que guarda inicioSesion.html (user_session).
     */
    requireSession(loginUrl) {
      const hasToken   = !!getToken();
      const hasSession = !!localStorage.getItem("user_session");
      const isRealAccount = !!localStorage.getItem("imoney_real_account");

      // Sin ninguna sesión → login
      if (!hasToken && !hasSession) {
        window.location.href = loginUrl;
        return false;
      }
      // Cuenta real registrada pero sin JWT (sesión demo antigua) → forzar re-login
      if (isRealAccount && !hasToken) {
        localStorage.removeItem("user_session"); // limpia sesión inválida
        window.location.href = loginUrl;
        return false;
      }
      return true;
    },

    // ── Auth ──────────────────────────────────────────────────
    async login(email, password) {
      try {
        const d = await request("/auth/login", { method: "POST", auth: false, body: { email, password } });
        setToken(d.token); setUser(d.user);
        localStorage.setItem("imoney_real_account", "true");
        localStorage.removeItem("imoney_dashboard_data");
        return d;
      } catch (e) {
        // Fallback demo (igual que inicioSesion.html).
        localStorage.setItem("user_session", "active");
        localStorage.setItem("user_email", email);
        return { user: { nombre: email.split("@")[0], email } };
      }
    },
    // loginStrict: igual que login pero sin fallback demo — lanza error si las credenciales son incorrectas
    async loginStrict(email, password) {
      const d = await request("/auth/login", { method: "POST", auth: false, body: { email, password } });
      setToken(d.token); setUser(d.user);
      localStorage.setItem("imoney_real_account", "true");
      localStorage.setItem("user_session", "active"); // mantiene sesión al cambiar de pestaña
      localStorage.removeItem("imoney_dashboard_data");
      return d;
    },
    async register(nombre, email, password) {
      try {
        const d = await request("/auth/register", { method: "POST", auth: false, body: { nombre, email, password } });
        setToken(d.token); setUser(d.user);
        localStorage.setItem("imoney_real_account", "true");
        localStorage.removeItem("imoney_dashboard_data");
        return d;
      } catch (e) {
        // Fallback demo: registrar localmente cuando el backend no esta disponible
        localStorage.setItem("user_session", "active");
        localStorage.setItem("user_email", email);
        // Marcar como cuenta real para que el dashboard empiece en $0
        localStorage.setItem("imoney_real_account", "true");
        localStorage.removeItem("imoney_dashboard_data");
        const user = { nombre, email };
        setUser(user);
        return { user };
      }
    },
    async google(email, nombre) {
      try {
        const d = await request("/auth/google", { method: "POST", auth: false, body: { email, nombre } });
        setToken(d.token); setUser(d.user); return d;
      } catch (e) {
        // Fallback demo
        localStorage.setItem("user_session", "active");
        localStorage.setItem("user_email", email);
        const user = { nombre: nombre || email.split("@")[0], email };
        setUser(user);
        return { user };
      }
    },
    me: () => request("/auth/me"),

    // ── Perfil ────────────────────────────────────────────────
    getPerfil:    ()       => request("/perfil"),
    updatePerfil: (cambios) => request("/perfil", { method: "PUT", body: cambios }),

    // ── Transacciones (con fallback localStorage) ─────────────
    async listTransacciones(q) {
      q = q || "";
      try {
        return await request("/transacciones" + q);
      } catch (e) {
        const lista = mockDashboard().recientes || [];
        if (q.includes("tipo=gasto"))   return lista.filter((t) => t.tipo === "gasto");
        if (q.includes("tipo=ingreso")) return lista.filter((t) => t.tipo === "ingreso");
        return lista;
      }
    },
    async crearTransaccion(tx) {
      // Normalizar tipo de forma defensiva para evitar errores de clasificacion
      const tipoNorm = String(tx.tipo || "").toLowerCase() === "ingreso" ? "ingreso" : "gasto";
      const txNorm = { ...tx, tipo: tipoNorm };
      try {
        const result = await request("/transacciones", { method: "POST", body: txNorm });
        // Limpia el caché para que el dashboard recargue datos frescos de Firestore
        localStorage.removeItem("imoney_dashboard_data");
        return result;
      } catch (e) {
        const d = mockDashboard();
        const nueva = { ...txNorm, id: Date.now(), fecha: new Date().toISOString(), creado_en: new Date().toISOString() };
        d.recientes = [nueva, ...(d.recientes || [])];
        if (tipoNorm === "ingreso") d.ingresos = (d.ingresos || 0) + txNorm.monto;
        else                        d.gastado  = (d.gastado  || 0) + txNorm.monto;
        d.disponible = (d.ingresos || 0) - (d.gastado || 0);
        localStorage.setItem("imoney_dashboard_data", JSON.stringify(d));
        return nueva;
      }
    },
    borrarTransaccion: (id) => request("/transacciones/" + id, { method: "DELETE" }),

    // ── Dashboard / Finanzas (con fallback localStorage) ──────
    async dashboard() {
      try { return await request("/dashboard"); }
      catch (e) { return mockDashboard(); }
    },
    getIngreso:  ()       => request("/config/ingreso"),
    setIngreso:  (ing)    => request("/config/ingreso", { method: "PUT", body: ing }),
    getAhorros:  ()       => request("/ahorros"),
    setAhorros:  (a)      => request("/ahorros", { method: "PUT", body: a }),

    // ── IA ────────────────────────────────────────────────────
    async coach(resumen) {
      try {
        return await request("/coach", { method: "POST", body: resumen ? { resumen } : {} });
      } catch (e) {
        // Fallback local cuando el backend/Gemini no esta disponible
        const d = mockDashboard();
        const gastado = d.gastado || 0;
        const ingresos = d.ingresos || 0;
        const pct = ingresos > 0 ? Math.round((gastado / ingresos) * 100) : 0;
        return {
          consejos: [
            pct > 80
              ? "Llevas el " + pct + "% de tus ingresos gastados. Revisa tus categorias mas altas y ponles un tope."
              : "Llevas $" + gastado.toFixed(2) + " gastados este periodo. Sigue controlando tus egresos.",
            "Aparta el 10% de cada ingreso en cuanto lo recibas: pagate a ti primero antes de gastar.",
            "Registra cada gasto el mismo dia: lo que se mide se mejora, y los pequenos gastos suman mas de lo esperado.",
          ],
        };
      }
    },
    async clasificar(descripcion) {
      return request("/clasificar", { method: "POST", body: { descripcion } });
    },
    async leerTicket(imageBase64, mediaType) {
      try {
        return await request("/leer-ticket", { method: "POST", body: { imageBase64, mediaType } });
      } catch (e) {
        throw new Error("El escaneo de tickets requiere conexion al servidor. Ingresa el gasto manualmente.");
      }
    },

    // ── Util ──────────────────────────────────────────────────
    async categorias() {
      try { return await request("/categorias", { auth: false }); }
      catch (e) {
        return [
          { nombre: "Comida",          color: "#EA4335" },
          { nombre: "Transporte",       color: "#4285F4" },
          { nombre: "Compras",          color: "#FBBC05" },
          { nombre: "Servicios",        color: "#34A853" },
          { nombre: "Salud",            color: "#FF6D00" },
          { nombre: "Entretenimiento",  color: "#AA00FF" },
          { nombre: "Vivienda",         color: "#00BCD4" },
          { nombre: "Nómina",           color: "#4CAF50" },
          { nombre: "Otros",            color: "#9E9E9E" },
        ];
      }
    },

    fmt: (n) =>
      "$" + Number(n || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };

  window.API = API;
})();
