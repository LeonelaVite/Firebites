const express = require("express");
const { pool } = require("../db");
const { requireAdmin } = require("../middleware/admin");
const { productInput } = require("../validation");
const { asyncRoute } = require("../lib/http");
const { productColumns } = require("./products");
const router = express.Router();
router.use(requireAdmin);

router.get("/", asyncRoute(async (_req, res) => {
  const { rows } = await pool.query(`SELECT ${productColumns} FROM products ORDER BY name`);
  res.json({ products: rows });
}));
router.post("/", asyncRoute(async (req, res) => {
  let data; try { data = productInput(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
  const { rows } = await pool.query(`INSERT INTO products(slug,name,image,description,category,price,spice_level,available) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING ${productColumns}`, [data.slug,data.name,data.image,data.description,data.category,data.price,data.spiceLevel,data.available]);
  res.status(201).json({ product: rows[0] });
}));
router.put("/:id", asyncRoute(async (req, res) => {
  let data; try { data = productInput(req.body); } catch (error) { return res.status(400).json({ error: error.message }); }
  const { rows } = await pool.query(`UPDATE products SET slug=$1,name=$2,image=$3,description=$4,category=$5,price=$6,spice_level=$7,available=$8,updated_at=NOW() WHERE id=$9 RETURNING ${productColumns}`, [data.slug,data.name,data.image,data.description,data.category,data.price,data.spiceLevel,data.available,req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: "Producto no encontrado." });
  res.json({ product: rows[0] });
}));
router.delete("/:id", asyncRoute(async (req, res) => {
  const result = await pool.query("DELETE FROM products WHERE id=$1", [req.params.id]);
  if (!result.rowCount) return res.status(404).json({ error: "Producto no encontrado." });
  res.status(204).end();
}));
module.exports = router;
