// ════════════════════════════════════════════════════════════════
//  Endpoints de IA (Gemini). Reutilizan la lógica original del proyecto:
//    POST /api/leer-ticket  → OCR + extracción de un ticket (visión)
//    POST /api/coach        → 3 consejos financieros accionables
//
//  Si no hay GEMINI_API_KEY, ambos responden con datos de demostración
//  para que el backend siga siendo 100% funcional sin llaves.
// ════════════════════════════════════════════════════════════════
import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ok, fail, asyncHandler } from "../http.js";
import { requireAuth } from "../auth.js";
import { calcularResumen } from "../resumen.js";
import { CATEGORIAS } from "../data/categorias.js";

const router = Router();

const API_KEY = process.env.GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
// Alias estable de Gemini; sobreescribible con GEMINI_MODEL si hace falta.
const MODELO = process.env.GEMINI_MODEL || "gemini-flash-latest";

// Intenta parsear JSON aunque venga envuelto en texto o markdown.
function parsearJson(texto) {
  try {
    return JSON.parse(texto);
  } catch {
    const match = texto.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// ── Escaneo de ticket ─────────────────────────────────────────────
const PROMPT_TICKET = `Eres un asistente que lee tickets de compra mexicanos.
Analiza la imagen del ticket y devuelve ÚNICAMENTE un objeto JSON válido,
sin texto adicional, sin explicaciones y sin bloques de código markdown.

El JSON debe tener exactamente estas llaves:
{
  "fecha": "YYYY-MM-DD",
  "total": 0.00,
  "comercio": "",
  "productos": [],
  "categoria": "Otros"
}

Clasifica en "categoria" según el tipo de comercio. Opciones: ${CATEGORIAS.join(", ")}.
Si la imagen no es un ticket legible, devuelve total 0 y categoria "Otros".`;

router.post(
  "/leer-ticket",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { imageBase64, mediaType } = req.body || {};
    if (!imageBase64) {
      return fail(res, 400, "FALTA_IMAGEN", "Falta imageBase64");
    }

    const ticketDemo = {
      fecha: new Date().toISOString().slice(0, 10),
      total: 45.0,
      comercio: "Comercio Demo",
      productos: ["Producto A", "Producto B"],
      categoria: "Comida",
    };

    // Sin llave → modo demo directo.
    if (!genAI) {
      return ok(res, ticketDemo, "Ticket leído (modo demo: configura GEMINI_API_KEY para OCR real)");
    }

    // Con llave → intenta IA real; si Gemini falla, degrada a demo (no rompe el flujo).
    try {
      const model = genAI.getGenerativeModel({ model: MODELO });
      const result = await model.generateContent([
        PROMPT_TICKET,
        { inlineData: { mimeType: mediaType || "image/jpeg", data: imageBase64 } },
      ]);
      const datos = parsearJson(result.response.text());
      if (!datos) return ok(res, ticketDemo, "Ticket ilegible: se devolvió un resultado por defecto");
      return ok(res, datos, "Ticket leído");
    } catch (err) {
      console.error("[leer-ticket] IA falló, usando demo:", err.message);
      return ok(res, ticketDemo, "Ticket leído (respaldo demo: la IA no respondió)");
    }
  })
);

// ── Coach financiero ──────────────────────────────────────────────
const SISTEMA_COACH = `Eres un coach financiero personal mexicano, cercano y motivador.
Hablas claro, sin tecnicismos, y das consejos concretos y accionables.
Usas pesos mexicanos (MXN). No regañas: animas.`;

router.post(
  "/coach",
  requireAuth,
  asyncHandler(async (req, res) => {
    // Usa el resumen enviado por la interfaz, o lo calcula desde los datos del usuario.
    const resumen = req.body?.resumen || (await calcularResumen(req.usuario));

    const consejosDemo = {
      consejos: [
        `Llevas $${resumen.gastado || 0} gastados este periodo. Revisa tu categoría más alta y ponle un tope semanal.`,
        "Aparta el 10% de cada ingreso apenas lo recibas: págate a ti primero.",
        "Registra cada gasto el mismo día; lo que se mide, se mejora.",
      ],
    };

    if (!genAI) {
      return ok(res, consejosDemo, "Consejos generados (modo demo: configura GEMINI_API_KEY para IA real)");
    }

    const prompt = `${SISTEMA_COACH}

Con base en estos datos financieros del usuario (en MXN):

${JSON.stringify(resumen, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON válido, sin markdown ni texto extra, con esta forma:
{ "consejos": ["consejo 1", "consejo 2", "consejo 3"] }

Cada consejo: máximo 2 frases, específico (menciona categorías y montos reales
del resumen), accionable y motivador.`;

    try {
      const model = genAI.getGenerativeModel({ model: MODELO });
      const result = await model.generateContent(prompt);
      const texto = result.response.text();
      const datos = parsearJson(texto);

      const consejos =
        datos && Array.isArray(datos.consejos)
          ? datos.consejos
          : texto
              .split("\n")
              .map((l) => l.replace(/^[-•\d.\s]+/, "").trim())
              .filter(Boolean)
              .slice(0, 3);

      return ok(res, { consejos }, "Consejos generados");
    } catch (err) {
      console.error("[coach] IA falló, usando demo:", err.message);
      return ok(res, consejosDemo, "Consejos generados (respaldo demo: la IA no respondió)");
    }
  })
);

export default router;
