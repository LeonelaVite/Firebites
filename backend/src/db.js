const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : false,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 8_000
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      price NUMERIC(12,2),
      spice_level TEXT,
      available BOOLEAN,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS contact_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS app_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    const initialSeed = await client.query("INSERT INTO app_migrations(name) VALUES('initial-products') ON CONFLICT DO NOTHING RETURNING name");
    if (initialSeed.rowCount) {
      const seeds = [
        ["gomitas-picantes", "Gomitas Picantes", "img/gomitas.webp", "Dulces, suaves y con el toque de chile descrito en el catálogo original.", "Gomitas"],
        ["algodon-picante", "Algodón de azúcar picante", "img/algodon.webp", "El clásico algodón con una explosión de sabor.", "Algodón de azúcar"],
        ["paletas-enchiladas", "Paletas Enchiladas", "img/paletas.webp", "Paletas dulces con chamoy y chile, según la descripción original.", "Paletas"]
      ];
      for (const product of seeds) await client.query("INSERT INTO products (slug,name,image,description,category) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING", product);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
  await pool.query("DELETE FROM admin_sessions WHERE expires_at < NOW()");
}

module.exports = { pool, migrate };
