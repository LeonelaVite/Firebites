const crypto = require("node:crypto");
const express = require("express");
const bcrypt = require("bcryptjs");
const { rateLimit } = require("express-rate-limit");
const { pool } = require("../db");
const { requireAdmin, sessionHash } = require("../middleware/admin");
const { asyncRoute } = require("../lib/http");
const router = express.Router();
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Intenta más tarde." },
});
const sessionHours = 8;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: sessionHours * 60 * 60 * 1000,
};

router.post(
  "/login",
  loginLimit,
  asyncRoute(async (req, res) => {
    const email = String(req.body?.email || "")
      .trim()
      .toLowerCase();
    const password = String(req.body?.password || "");
    const adminEmail = String(process.env.ADMIN_EMAIL || "")
      .trim()
      .toLowerCase();
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || "";
    const valid =
      email === adminEmail &&
      password.length <= 200 &&
      passwordHash.startsWith("$2") &&
      (await bcrypt.compare(password, passwordHash));
    if (!valid)
      return res
        .status(401)
        .json({ error: "Correo o contraseña incorrectos." });
    const token = crypto.randomBytes(32).toString("base64url");
    await pool.query(
      "INSERT INTO admin_sessions(token_hash,expires_at) VALUES($1,NOW()+INTERVAL '8 hours')",
      [sessionHash(token)],
    );
    res
      .cookie("firebites_admin", token, cookieOptions)
      .json({ authenticated: true, email: adminEmail });
  }),
);

router.get("/session", requireAdmin, (_req, res) =>
  res.json({ authenticated: true }),
);
router.post(
  "/logout",
  requireAdmin,
  asyncRoute(async (req, res) => {
    await pool.query("DELETE FROM admin_sessions WHERE token_hash=$1", [
      sessionHash(req.cookies.firebites_admin),
    ]);
    const { maxAge: _maxAge, ...clearOptions } = cookieOptions;
    res
      .clearCookie("firebites_admin", clearOptions)
      .json({ authenticated: false });
  }),
);
module.exports = router;
