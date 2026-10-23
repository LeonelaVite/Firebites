function productInput(body = {}) {
  const data = { slug: String(body.slug || "").trim().toLowerCase(), name: String(body.name || "").trim(), image: String(body.image || "").trim(), description: String(body.description || "").trim(), category: String(body.category || "").trim(), price: body.price === "" || body.price == null ? null : Number(body.price), spiceLevel: String(body.spiceLevel || "").trim() || null, available: typeof body.available === "boolean" ? body.available : null };
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug) || data.slug.length > 80) throw new Error("El identificador debe usar minúsculas, números y guiones.");
  if (data.name.length < 2 || data.name.length > 120 || !/^img\/[a-z0-9][a-z0-9._/-]*\.(?:png|jpe?g|webp|gif)$/i.test(data.image) || data.image.includes("..") || data.image.length > 300 || data.description.length < 5 || data.description.length > 1000 || data.category.length < 2 || data.category.length > 80) throw new Error("Revisa nombre, imagen (usa un archivo dentro de img/), descripción y categoría.");
  if (data.price !== null && (!Number.isFinite(data.price) || data.price < 0 || data.price > 1_000_000_000)) throw new Error("El precio debe ser un número positivo o quedar vacío.");
  if (data.spiceLevel && data.spiceLevel.length > 50) throw new Error("El nivel de picante es demasiado largo.");
  return data;
}

function contactInput(body = {}) {
  const clean = { name: String(body.name || "").trim(), email: String(body.email || "").trim().toLowerCase(), subject: String(body.subject || "").trim(), message: String(body.message || "").trim() };
  if (clean.name.length < 2 || clean.name.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email) || clean.email.length > 254 || clean.subject.length < 2 || clean.subject.length > 120 || clean.message.length < 10 || clean.message.length > 3000) throw new Error("Completa nombre, correo válido, motivo y mensaje (10 a 3000 caracteres).");
  return clean;
}

module.exports = { productInput, contactInput };
