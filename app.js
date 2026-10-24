const API_BASE = (window.FIREBITES_API_URL || "").replace(/\/$/, "");
const starterProducts = [
  {
    id: "gomitas-picantes",
    name: "Gomitas Picantes",
    image: "img/gomitas.webp",
    description:
      "Dulces, suaves y con el toque de chile descrito en el catálogo original.",
    category: "Gomitas",
    price: 1.5,
    spiceLevel: null,
    available: null,
  },
  {
    id: "algodon-picante",
    name: "Algodón de azúcar picante",
    image: "img/algodon.webp",
    description: "El clásico algodón con una explosión de sabor.",
    category: "Algodón de azúcar",
    price: 1.35,
    spiceLevel: null,
    available: null,
  },
  {
    id: "paletas-enchiladas",
    name: "Paletas Enchiladas",
    image: "img/paletas.webp",
    description:
      "Paletas dulces con chamoy y chile, según la descripción original.",
    category: "Paletas",
    price: 1.0,
    spiceLevel: null,
    available: null,
  },
];
let products = [...starterProducts];
const $ = (selector) => document.querySelector(selector);
const CartCore = window.FireBitesCart;
let cart = [];
let cartFeedbackTimer;

function safeText(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
function priceLabel(value) {
  return Number.isFinite(Number(value)) && value !== null && value !== ""
    ? `$${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : "Precio por confirmar";
}
function availabilityLabel(value) {
  return value === true
    ? "Disponible"
    : value === false
      ? "Agotado"
      : "Consultar disponibilidad";
}

function readSavedCart() {
  try {
    return localStorage.getItem(CartCore.STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function saveCart() {
  try {
    localStorage.setItem(CartCore.STORAGE_KEY, JSON.stringify(cart));
  } catch {
    showCartFeedback(
      "El carrito funciona en esta sesión, pero el navegador no permitió guardarlo.",
      "error",
    );
  }
}

function showCartFeedback(message, state = "success") {
  const feedback = $("#cart-feedback");
  feedback.textContent = message;
  feedback.dataset.state = state;
  feedback.hidden = false;
  clearTimeout(cartFeedbackTimer);
  cartFeedbackTimer = setTimeout(() => {
    feedback.hidden = true;
  }, 3600);
}

function renderCart() {
  const cartItems = $("#cart-items");
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  const countLabel = count > 99 ? "99+" : String(count);
  $("#cart-count").textContent = countLabel;
  $(".nav-cart").setAttribute(
    "aria-label",
    `Carrito de compras, ${count} ${count === 1 ? "artículo" : "artículos"}`,
  );

  let lines = [];
  try {
    lines = CartCore.getLines(cart, products);
  } catch (error) {
    cart = CartCore.restoreCart(readSavedCart(), products);
    saveCart();
    showCartFeedback(error.message, "error");
    lines = CartCore.getLines(cart, products);
  }

  cartItems.innerHTML = lines.length
    ? lines
        .map(
          (line) =>
            `<article class="cart-item"><img src="${safeText(line.image || "img/hero.webp")}" alt=""><div class="cart-item-info"><h3>${safeText(line.name)}</h3><p>${CartCore.formatMoney(line.unitPriceCents)} por unidad</p><strong>Subtotal: ${CartCore.formatMoney(line.subtotalCents)}</strong></div><div class="quantity-control" aria-label="Cantidad de ${safeText(line.name)}"><button type="button" data-cart-decrease="${safeText(line.id)}" aria-label="Disminuir ${safeText(line.name)}">−</button><span aria-live="polite">${line.quantity}</span><button type="button" data-cart-increase="${safeText(line.id)}" aria-label="Aumentar ${safeText(line.name)}" ${line.quantity >= CartCore.quantityLimit(products.find((item) => CartCore.productKey(item) === line.id)) ? "disabled" : ""}>+</button></div><button class="cart-remove" type="button" data-cart-remove="${safeText(line.id)}">Eliminar</button></article>`,
        )
        .join("")
    : '<p class="cart-empty">Tu carrito está vacío. Explora el catálogo y agrega tus antojos favoritos.</p>';

  $("#cart-subtotal").textContent = CartCore.formatMoney(
    CartCore.subtotalCents(cart, products),
  );
  $("#clear-cart").disabled = lines.length === 0;
  $("#checkout-whatsapp").disabled = lines.length === 0;
  const whatsappNumber = CartCore.normalizeWhatsAppNumber(
    window.FIREBITES_WHATSAPP_NUMBER,
  );
  $("#whatsapp-config-note").textContent = whatsappNumber
    ? "Puedes revisar el pedido antes de enviarlo por WhatsApp."
    : "Falta configurar el número de WhatsApp de FireBites; el checkout se habilitará al agregarlo a api-config.js o a FIREBITES_WHATSAPP_NUMBER en el despliegue.";
}

function renderProducts() {
  const query = $("#product-search").value.trim().toLocaleLowerCase("es");
  const category = $("#category-filter").value;
  const visible = products.filter(
    (item) =>
      `${item.name} ${item.description} ${item.category}`
        .toLocaleLowerCase("es")
        .includes(query) &&
      (category === "all" || item.category === category),
  );
  const grid = $("#product-grid");
  $("#catalog-status").textContent = visible.length
    ? `${visible.length} ${visible.length === 1 ? "producto" : "productos"}`
    : "No encontramos productos con esos filtros.";
  grid.innerHTML = visible.length
    ? visible
        .map((item) =>
          (() => {
            const id = CartCore.productKey(item);
            const purchaseIssue = CartCore.purchaseError(item);
            const unavailable =
              item.available === false || CartCore.quantityLimit(item) === 0;
            const addLabel = unavailable
              ? "No disponible"
              : purchaseIssue
                ? "Precio por confirmar"
                : "Agregar al carrito";
            return `<article class="product-card"><div class="product-image"><img src="${safeText(item.image || "img/hero.webp")}" alt="${safeText(item.name)}" loading="lazy"><span class="category-chip">${safeText(item.category || "Producto")}</span></div><div class="product-body"><h3>${safeText(item.name)}</h3><p>${safeText(item.description || "Consulta los detalles de este producto.")}</p><div class="product-facts"><span>${safeText(availabilityLabel(item.available))}</span><span>${item.spiceLevel ? `Picante: ${safeText(item.spiceLevel)}` : "Picante: consultar"}</span></div><div class="product-facts"><span>Precio</span><span class="product-price">${safeText(priceLabel(item.price))}</span></div><button class="add-to-cart" type="button" data-add-to-cart="${safeText(id)}" ${purchaseIssue ? "disabled" : ""}>${addLabel}</button><a class="product-action" href="#contacto" data-product="${safeText(item.name)}">Consultar este producto <span aria-hidden="true">↗</span></a></div></article>`;
          })(),
        )
        .join("")
    : `<p class="empty-state">Prueba otra búsqueda o categoría. Si necesitas ayuda, <a href="#contacto">escríbenos</a>.</p>`;
}

async function loadProducts() {
  if (API_BASE) {
    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("API no disponible");
      const result = await response.json();
      if (Array.isArray(result.products)) products = result.products;
    } catch {
      // El catálogo inicial viene de este archivo y la base del proyecto; no afirma disponibilidad o precio.
    }
  }
  const categories = [
    ...new Set(products.map((item) => item.category).filter(Boolean)),
  ];
  $("#category-filter").insertAdjacentHTML(
    "beforeend",
    categories
      .map(
        (value) =>
          `<option value="${safeText(value)}">${safeText(value)}</option>`,
      )
      .join(""),
  );
  $("#catalog-status").textContent =
    `${products.length} productos · consulta disponibilidad y envío al coordinar`;
  cart = CartCore.restoreCart(readSavedCart(), products);
  renderProducts();
  renderCart();
}

$("#product-search").addEventListener("input", renderProducts);
$("#category-filter").addEventListener("change", renderProducts);
$("#year").textContent = new Date().getFullYear();
const menu = $(".menu-toggle"),
  nav = $("#site-nav");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  nav.classList.toggle("is-open", open);
});
nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("is-open");
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-label", "Abrir menú");
  }),
);

const contactForm = $("#contact-form"),
  contactStatus = $("#contact-status");
$("#product-grid").addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-to-cart]");
  if (addButton) {
    const product = products.find(
      (item) => CartCore.productKey(item) === addButton.dataset.addToCart,
    );
    const result = CartCore.changeQuantity(cart, product, 1);
    if (result.error) {
      showCartFeedback(result.error, "error");
      return;
    }
    cart = result.cart;
    saveCart();
    renderCart();
    showCartFeedback(`${product.name} se agregó al carrito.`);
    return;
  }

  const productLink = event.target.closest("[data-product]");
  if (productLink) {
    $("#contact-form [name=subject]").value = "Consulta de producto";
    $("#contact-form [name=message]").value =
      `Hola, quisiera consultar sobre ${productLink.dataset.product}.`;
  }
});

$("#cart-items").addEventListener("click", (event) => {
  const button = event.target.closest(
    "[data-cart-increase], [data-cart-decrease], [data-cart-remove]",
  );
  if (!button) return;
  const id =
    button.dataset.cartIncrease ||
    button.dataset.cartDecrease ||
    button.dataset.cartRemove;
  if (button.hasAttribute("data-cart-remove")) {
    cart = CartCore.removeItem(cart, id);
    saveCart();
    renderCart();
    showCartFeedback("Producto eliminado del carrito.");
    return;
  }

  const product = products.find((item) => CartCore.productKey(item) === id);
  const delta = button.hasAttribute("data-cart-increase") ? 1 : -1;
  const result = CartCore.changeQuantity(cart, product, delta);
  if (result.error) {
    showCartFeedback(result.error, "error");
    return;
  }
  cart = result.cart;
  saveCart();
  renderCart();
  showCartFeedback(delta > 0 ? "Cantidad actualizada." : "Cantidad reducida.");
});

$("#clear-cart").addEventListener("click", () => {
  if (!cart.length) return;
  if (!window.confirm("¿Vaciar todos los productos del carrito?")) return;
  cart = CartCore.clearCart();
  saveCart();
  renderCart();
  showCartFeedback("El carrito quedó vacío.");
});

$("#checkout-whatsapp").addEventListener("click", () => {
  if (!cart.length) {
    showCartFeedback(
      "Agrega al menos un producto antes de continuar.",
      "error",
    );
    return;
  }
  try {
    const emailField = contactForm.elements.namedItem("email");
    const message = CartCore.buildWhatsAppMessage(cart, products, {
      name: contactForm.elements.namedItem("name").value,
      email: emailField.validity.valid ? emailField.value : "",
    });
    const url = CartCore.whatsappUrl(window.FIREBITES_WHATSAPP_NUMBER, message);
    const whatsappWindow = window.open(url, "_blank");
    if (!whatsappWindow) {
      showCartFeedback(
        "El navegador bloqueó la ventana. Permite las ventanas emergentes para abrir WhatsApp.",
        "error",
      );
      return;
    }
    whatsappWindow.opener = null;
    showCartFeedback(
      "Se abrió WhatsApp para revisar el pedido. Todavía debes enviarlo y esperar la confirmación de FireBites.",
    );
  } catch (error) {
    showCartFeedback(error.message, "error");
  }
});

window.addEventListener("storage", (event) => {
  if (event.key !== CartCore.STORAGE_KEY) return;
  cart = CartCore.restoreCart(event.newValue || "[]", products);
  renderCart();
});

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  contactStatus.removeAttribute("data-state");
  if (!contactForm.reportValidity()) {
    contactStatus.textContent = "Revisa los campos marcados antes de enviar.";
    contactStatus.dataset.state = "error";
    return;
  }
  if (!API_BASE) {
    contactStatus.textContent =
      "El servicio de consultas aún no está configurado. Tu mensaje no se ha enviado.";
    contactStatus.dataset.state = "error";
    return;
  }
  const submit = contactForm.querySelector("[type=submit]");
  submit.disabled = true;
  submit.textContent = "Enviando…";
  contactForm.classList.add("is-loading");
  contactStatus.textContent = "Enviando tu consulta…";
  try {
    const response = await fetch(`${API_BASE}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(Object.fromEntries(new FormData(contactForm))),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "No se pudo enviar la consulta.");
    contactStatus.textContent = "¡Consulta enviada! Gracias por escribirnos.";
    contactStatus.dataset.state = "success";
    contactForm.reset();
  } catch (error) {
    contactStatus.textContent = `${error.message} ${API_BASE ? "Intenta nuevamente más tarde." : "El servicio aún no está configurado."}`;
    contactStatus.dataset.state = "error";
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Enviar consulta <span aria-hidden="true">↗</span>';
    contactForm.classList.remove("is-loading");
  }
});

const assistantForm = $("#assistant-form"),
  assistantResponse = $("#assistant-response");
assistantForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = $("#assistant-question"),
    button = assistantForm.querySelector("[type=submit]"),
    question = input.value.trim();
  if (!question) {
    input.focus();
    return;
  }
  if (!API_BASE) {
    assistantResponse.textContent =
      "La IA se activa cuando se configura el backend. Esta consulta no se envió.";
    assistantResponse.dataset.state = "error";
    return;
  }
  button.disabled = true;
  assistantResponse.removeAttribute("data-state");
  assistantResponse.textContent = "Pensando en tu antojo…";
  try {
    const response = await fetch(`${API_BASE}/api/assistant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ question }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new Error(result.error || "No se pudo obtener una respuesta.");
    assistantResponse.textContent = result.answer;
    input.value = "";
  } catch (error) {
    assistantResponse.textContent = `${error.message} ${API_BASE ? "Inténtalo de nuevo." : "La IA se activa al configurar el backend."}`;
    assistantResponse.dataset.state = "error";
  } finally {
    button.disabled = false;
  }
});
$("#assistant-reset").addEventListener("click", () => {
  assistantResponse.textContent =
    "¡Hola! Pregúntame algo sobre nuestros productos. Solo responderé con información que tengamos disponible. 🌶️";
  assistantResponse.removeAttribute("data-state");
  $("#assistant-question").value = "";
  $("#assistant-question").focus();
});
loadProducts();
