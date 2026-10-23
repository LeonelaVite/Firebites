require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { migrate } = require("./db");
const contactRouter = require("./routes/contact");
const assistantRouter = require("./routes/assistant");
const adminAuthRouter = require("./routes/admin-auth");
const productsRouter = require("./routes/products");
const adminProductsRouter = require("./routes/admin-products");

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendOrigin = process.env.FRONTEND_ORIGIN;
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: frontendOrigin, credentials: true, methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], allowedHeaders: ["Content-Type"] }));
app.use(express.json({ limit: "16kb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  if (["POST", "PUT", "DELETE"].includes(req.method) && req.path.startsWith("/api/") && req.get("origin") !== frontendOrigin) return res.status(403).json({ error: "Origen no autorizado." });
  next();
});
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api", productsRouter);
app.use("/api/contact", contactRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/admin", adminAuthRouter);
app.use("/api/admin/products", adminProductsRouter);
app.use((error, _req, res, _next) => {
  if (error.code === "23505") return res.status(409).json({ error: "Ya existe un producto con ese identificador." });
  console.error(error.message);
  res.status(500).json({ error: "Ocurrió un error interno. Intenta más tarde." });
});

migrate().then(() => app.listen(port, () => console.log(`FireBites API listening on ${port}`))).catch((error) => { console.error("Database initialization failed:", error.message); process.exit(1); });
