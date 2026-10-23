const crypto = require("node:crypto");
const { pool } = require("../db");
const sessionHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function requireAdmin(req, res, next) {
  try {
    const token = req.cookies.firebites_admin;
    if (!token) return res.status(401).json({ error: "Inicia sesión para continuar." });
    const session = await pool.query("SELECT token_hash FROM admin_sessions WHERE token_hash = $1 AND expires_at > NOW()", [sessionHash(token)]);
    if (!session.rowCount) return res.status(401).json({ error: "La sesión expiró. Inicia sesión nuevamente." });
    next();
  } catch (error) { next(error); }
}

module.exports = { requireAdmin, sessionHash };
