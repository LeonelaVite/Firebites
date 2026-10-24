const express = require("express");
const { rateLimit } = require("express-rate-limit");
const { pool } = require("../db");
const { contactInput } = require("../validation");
const { asyncRoute } = require("../lib/http");
const router = express.Router();
const contactLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Se alcanzó el límite de consultas. Intenta más tarde." },
});

router.post(
  "/",
  contactLimit,
  asyncRoute(async (req, res) => {
    let clean;
    try {
      clean = contactInput(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
    await pool.query(
      "INSERT INTO contact_messages(name,email,subject,message) VALUES($1,$2,$3,$4)",
      [clean.name, clean.email, clean.subject, clean.message],
    );
    res.status(201).json({ message: "Consulta recibida." });
  }),
);
module.exports = router;
