const test = require("node:test");
const assert = require("node:assert/strict");
const Cart = require("../../cart.js");

const products = [
  {
    slug: "gomitas-picantes",
    name: "Gomitas Picantes",
    image: "img/gomitas.webp",
    price: 1.5,
    available: true,
    stock: 4,
  },
  {
    slug: "algodon-picante",
    name: "Algodón de azúcar picante",
    image: "img/algodon.webp",
    price: 1.35,
    available: null,
  },
  {
    slug: "paletas-enchiladas",
    name: "Paletas Enchiladas",
    image: "img/paletas.webp",
    price: 1.0,
    available: false,
  },
];

function add(cart, product, count = 1) {
  let next = cart;
  for (let index = 0; index < count; index += 1) {
    const result = Cart.changeQuantity(next, product, 1);
    assert.equal(result.error, "");
    next = result.cart;
  }
  return next;
}

test("adding products consolidates duplicates and supports mixed products", () => {
  let cart = add([], products[0]);
  cart = add(cart, products[0]);
  cart = add(cart, products[1]);
  assert.deepEqual(cart, [
    { id: "gomitas-picantes", quantity: 2 },
    { id: "algodon-picante", quantity: 1 },
  ]);
});

test("quantities can increase, decrease, remove, and clear without negatives", () => {
  let cart = add([], products[0], 2);
  let result = Cart.changeQuantity(cart, products[0], 1);
  assert.equal(result.cart[0].quantity, 3);
  result = Cart.changeQuantity(result.cart, products[0], -1);
  assert.equal(result.cart[0].quantity, 2);
  assert.equal(
    Cart.setQuantity(result.cart, products[0], -2).error.length > 0,
    true,
  );
  assert.deepEqual(Cart.removeItem(result.cart, "gomitas-picantes"), []);
  assert.deepEqual(
    Cart.removeItem(add([], products[0]), "gomitas-picantes"),
    [],
  );
  assert.deepEqual(Cart.clearCart(), []);
});

test("unavailable products and stock limits are enforced", () => {
  const unavailable = Cart.changeQuantity([], products[2], 1);
  assert.match(unavailable.error, /no está disponible/i);
  const fullCart = add([], products[0], 4);
  assert.match(
    Cart.changeQuantity(fullCart, products[0], 1).error,
    /existencia/i,
  );
});

test("subtotal uses current catalog prices and integer cents", () => {
  const cart = add(add([], products[0]), products[1], 2);
  assert.equal(Cart.subtotalCents(cart, products), 420);
  assert.equal(Cart.formatMoney(420), "$4,20");
  assert.equal(Cart.priceInCents(1.35), 135);
});

test("restoring storage keeps only valid product ids and quantities, refreshing catalog values", () => {
  const saved = JSON.stringify([
    { id: "gomitas-picantes", quantity: 99, oldPrice: 0.01 },
    { id: "paletas-enchiladas", quantity: 1 },
    { id: "missing-item", quantity: 2 },
  ]);
  const restored = Cart.restoreCart(saved, products);
  assert.deepEqual(restored, [{ id: "gomitas-picantes", quantity: 4 }]);
  assert.equal(Cart.subtotalCents(restored, products), 600);
  assert.deepEqual(Cart.restoreCart("not valid JSON", products), []);
});

test("WhatsApp summary includes lines, subtotal, accents, contact, and encoded text", () => {
  const cart = add(add([], products[0]), products[1], 2);
  const message = Cart.buildWhatsAppMessage(cart, products, {
    name: "Leonela Vite",
    email: "leonela@example.com",
  });
  assert.match(message, /Algodón de azúcar picante × 2/);
  assert.match(message, /Subtotal de productos \(sin envío\): \$4,20/);
  assert.match(message, /Nombre: Leonela Vite/);
  assert.match(message, /pedido no queda enviado ni confirmado/i);
  const url = Cart.whatsappUrl("+593 99 123 4567", message);
  assert.match(url, /^https:\/\/wa\.me\/593991234567\?text=/);
  assert.equal(decodeURIComponent(url.split("?text=")[1]), message);
  assert.throws(
    () => Cart.whatsappUrl("", message),
    /Configura el número real/,
  );
});
