(function attachFireBitesCart(root, factory) {
  const cart = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = cart;
  root.FireBitesCart = cart;
})(
  typeof globalThis !== "undefined" ? globalThis : window,
  function createCartCore() {
    const STORAGE_KEY = "firebites-cart-v1";

    function productKey(product) {
      return String(product?.slug || product?.id || "");
    }

    function priceInCents(value) {
      if (value === null || value === undefined || value === "") return null;
      const price = Number(value);
      return Number.isFinite(price) && price >= 0
        ? Math.round(price * 100)
        : null;
    }

    function quantityLimit(product) {
      if (
        product?.stock === null ||
        product?.stock === undefined ||
        product.stock === ""
      )
        return Infinity;
      const stock = Number(product?.stock);
      return Number.isInteger(stock) && stock >= 0 ? stock : Infinity;
    }

    function purchaseError(product) {
      if (!product || !productKey(product))
        return "Este producto no está en el catálogo.";
      if (product.available === false || quantityLimit(product) === 0)
        return "Este producto no está disponible por ahora.";
      if (priceInCents(product.price) === null)
        return "El precio aún no está confirmado; consúltalo antes de agregarlo.";
      return "";
    }

    function restoreCart(serialized, products) {
      let stored;
      try {
        stored =
          typeof serialized === "string" ? JSON.parse(serialized) : serialized;
      } catch {
        return [];
      }
      if (!Array.isArray(stored)) return [];

      const byKey = new Map(
        products.map((product) => [productKey(product), product]),
      );
      const quantities = new Map();
      for (const entry of stored) {
        const id = String(entry?.id || "");
        const quantity = Number(entry?.quantity);
        const product = byKey.get(id);
        if (
          !product ||
          purchaseError(product) ||
          !Number.isInteger(quantity) ||
          quantity < 1
        )
          continue;
        quantities.set(id, (quantities.get(id) || 0) + quantity);
      }
      return [...quantities].flatMap(([id, quantity]) => {
        const limit = quantityLimit(byKey.get(id));
        const safeQuantity = Math.min(quantity, limit);
        return safeQuantity > 0 ? [{ id, quantity: safeQuantity }] : [];
      });
    }

    function changeQuantity(cart, product, delta) {
      const error = purchaseError(product);
      if (error) return { cart, error };
      if (!Number.isInteger(delta) || delta === 0)
        return { cart, error: "La cantidad solicitada no es válida." };

      const id = productKey(product);
      const current = cart.find((item) => item.id === id)?.quantity || 0;
      const next = current + delta;
      if (next <= 0)
        return { cart: cart.filter((item) => item.id !== id), error: "" };
      if (next > quantityLimit(product))
        return { cart, error: "No se puede superar la existencia disponible." };

      const updated = cart.filter((item) => item.id !== id);
      updated.push({ id, quantity: next });
      return { cart: updated, error: "" };
    }

    function setQuantity(cart, product, quantity) {
      if (!Number.isInteger(quantity) || quantity < 0)
        return { cart, error: "La cantidad solicitada no es válida." };
      const id = productKey(product);
      const current = cart.find((item) => item.id === id)?.quantity || 0;
      if (quantity === 0) return { cart: removeItem(cart, id), error: "" };
      if (quantity === current) return { cart, error: "" };
      return changeQuantity(cart, product, quantity - current);
    }

    function removeItem(cart, id) {
      return cart.filter((item) => item.id !== String(id));
    }

    function clearCart() {
      return [];
    }

    function getLines(cart, products) {
      const byKey = new Map(
        products.map((product) => [productKey(product), product]),
      );
      return cart.map((item) => {
        const product = byKey.get(item.id);
        const error = purchaseError(product);
        if (error) throw new Error(error);
        if (
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > quantityLimit(product)
        )
          throw new Error(
            "La cantidad cambió; actualiza el carrito antes de continuar.",
          );
        const unitPriceCents = priceInCents(product.price);
        return {
          id: item.id,
          name: product.name,
          image: product.image,
          quantity: item.quantity,
          unitPriceCents,
          subtotalCents: unitPriceCents * item.quantity,
        };
      });
    }

    function subtotalCents(cart, products) {
      return getLines(cart, products).reduce(
        (sum, item) => sum + item.subtotalCents,
        0,
      );
    }

    function formatMoney(cents) {
      return `$${(cents / 100).toLocaleString("es-CO", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    function buildWhatsAppMessage(cart, products, contact = {}) {
      const lines = getLines(cart, products);
      if (!lines.length)
        throw new Error("Agrega al menos un producto al carrito.");
      const message = ["Hola, quiero consultar este pedido de FireBites:", ""];
      for (const item of lines) {
        message.push(
          `• ${item.name} × ${item.quantity}: ${formatMoney(item.unitPriceCents)} c/u = ${formatMoney(item.subtotalCents)}`,
        );
      }
      message.push(
        "",
        `Subtotal de productos (sin envío): ${formatMoney(subtotalCents(cart, products))}`,
        "Envío y disponibilidad se confirman al coordinar el pedido.",
      );
      const name = String(contact.name || "").trim();
      const email = String(contact.email || "").trim();
      if (name || email) {
        message.push("", "Datos de contacto:");
        if (name) message.push(`Nombre: ${name}`);
        if (email) message.push(`Correo: ${email}`);
      }
      message.push(
        "",
        "Este mensaje es una solicitud; el pedido no queda enviado ni confirmado hasta recibir respuesta de FireBites.",
      );
      return message.join("\n");
    }

    function normalizeWhatsAppNumber(value) {
      const number = String(value || "").replace(/\D/g, "");
      return /^\d{8,15}$/.test(number) ? number : "";
    }

    function whatsappUrl(number, message) {
      const normalizedNumber = normalizeWhatsAppNumber(number);
      if (!normalizedNumber)
        throw new Error("Configura el número real de WhatsApp de FireBites.");
      return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
    }

    return {
      STORAGE_KEY,
      productKey,
      priceInCents,
      quantityLimit,
      purchaseError,
      restoreCart,
      changeQuantity,
      setQuantity,
      removeItem,
      clearCart,
      getLines,
      subtotalCents,
      formatMoney,
      buildWhatsAppMessage,
      normalizeWhatsAppNumber,
      whatsappUrl,
    };
  },
);
