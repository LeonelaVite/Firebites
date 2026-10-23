const test = require("node:test");
const assert = require("node:assert/strict");
const { productInput, contactInput } = require("../src/validation");

const validProduct = { slug: "gomitas-picantes", name: "Gomitas Picantes", image: "img/gomitas.png", description: "Dulces y suaves con el toque descrito.", category: "Gomitas" };

test("product accepts an unconfirmed price and availability", () => {
  const result = productInput(validProduct);
  assert.equal(result.price, null);
  assert.equal(result.available, null);
  assert.equal(result.slug, "gomitas-picantes");
});

test("product normalizes optional data and accepts confirmed values", () => {
  const result = productInput({ ...validProduct, price: "2500", spiceLevel: "Medio", available: true });
  assert.equal(result.price, 2500);
  assert.equal(result.spiceLevel, "Medio");
  assert.equal(result.available, true);
});

test("product rejects malformed slug, path traversal and invalid prices", () => {
  assert.throws(() => productInput({ ...validProduct, slug: "Gomitas picantes" }), /identificador/);
  assert.throws(() => productInput({ ...validProduct, image: "img/../secret.png" }), /imagen/);
  assert.throws(() => productInput({ ...validProduct, image: "https://example.com/product.jpg" }), /imagen/);
  assert.throws(() => productInput({ ...validProduct, price: -1 }), /precio/);
  assert.throws(() => productInput({ ...validProduct, price: "abc" }), /precio/);
});

test("contact trims and normalizes a valid message", () => {
  const result = contactInput({ name: " Ana ", email: " ANA@example.com ", subject: "Consulta", message: "Quiero saber más del producto." });
  assert.equal(result.name, "Ana");
  assert.equal(result.email, "ana@example.com");
});

test("contact rejects invalid email and too-short message", () => {
  assert.throws(() => contactInput({ name: "Ana", email: "correo", subject: "Consulta", message: "Hola, quiero consultar." }), /correo válido/);
  assert.throws(() => contactInput({ name: "Ana", email: "ana@example.com", subject: "Consulta", message: "corto" }), /mensaje/);
});
