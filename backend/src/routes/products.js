const express = require("express");
const { pool } = require("../db");
const { asyncRoute } = require("../lib/http");
const router = express.Router();
const productColumns = `id, slug, name, image, description, category, price, spice_level AS "spiceLevel", available, created_at AS "createdAt", updated_at AS "updatedAt"`;

router.get("/products", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(`SELECT ${productColumns} FROM products ORDER BY created_at ASC`);
  res.json({ products: rows });
}));
module.exports = { router, productColumns };
