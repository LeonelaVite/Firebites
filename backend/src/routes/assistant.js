const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { pool } = require("../db");
const { asyncRoute } = require("../lib/http");
const router = express.Router();
const assistantLimit = rateLimit({ windowMs: 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Espera un momento antes de enviar otra pregunta." } });

router.post("/", assistantLimit, asyncRoute(async (req, res) => {
  const question = String(req.body?.question || "").trim();
  if (question.length < 2 || question.length > 500) return res.status(400).json({ error: "Escribe una pregunta de 2 a 500 caracteres." });
  if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_MODEL) return res.status(503).json({ error: "El asistente aún no está configurado." });
  const { rows } = await pool.query("SELECT name,description,category,price,spice_level AS \"spiceLevel\",available FROM products ORDER BY name");
  const instructions = `Eres Antojo Bot, el asistente de FireBites. Tono cercano, divertido y breve. Responde únicamente con los datos de este catálogo JSON. No inventes sabores, ingredientes, precios, nivel de picante, disponibilidad, horarios, envíos, políticas ni opiniones. Un precio o dato null significa no confirmado: dilo claramente y sugiere consultar al negocio. Si la pregunta no se responde con el catálogo, explica que no tienes ese dato. Catálogo actual: ${JSON.stringify(rows)}`;
  const upstream = await fetch("https://api.openai.com/v1/responses", { method: "POST", headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL, instructions, input: question, max_output_tokens: 300 }) });
  if (!upstream.ok) { const details = await upstream.json().catch(() => ({})); console.error("AI provider error:", upstream.status, details.error?.type || "unknown"); return res.status(502).json({ error: "El asistente no pudo responder en este momento." }); }
  const result = await upstream.json();
  const answer = result.output?.flatMap((item) => item.content || []).filter((item) => item.type === "output_text").map((item) => item.text).join("\n").trim();
  if (!answer) return res.status(502).json({ error: "El asistente devolvió una respuesta vacía." });
  res.json({ answer });
}));
module.exports = router;
