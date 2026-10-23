const API_BASE = (window.FIREBITES_API_URL || "").replace(/\/$/, "");
const starterProducts = [
  { id: "gomitas-picantes", name: "Gomitas Picantes", image: "img/gomitas.webp", description: "Dulces, suaves y con el toque de chile descrito en el catálogo original.", category: "Gomitas", price: null, spiceLevel: null, available: null },
  { id: "algodon-picante", name: "Algodón de azúcar picante", image: "img/algodon.webp", description: "El clásico algodón con una explosión de sabor.", category: "Algodón de azúcar", price: null, spiceLevel: null, available: null },
  { id: "paletas-enchiladas", name: "Paletas Enchiladas", image: "img/paletas.webp", description: "Paletas dulces con chamoy y chile, según la descripción original.", category: "Paletas", price: null, spiceLevel: null, available: null }
];
let products = [...starterProducts];
const $ = (selector) => document.querySelector(selector);

function safeText(value = "") { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function priceLabel(value) { return Number.isFinite(Number(value)) && value !== null && value !== "" ? `$${Number(value).toLocaleString("es-CO")}` : "Precio por confirmar"; }
function availabilityLabel(value) { return value === true ? "Disponible" : value === false ? "Agotado" : "Consultar disponibilidad"; }

function renderProducts() {
  const query = $("#product-search").value.trim().toLocaleLowerCase("es");
  const category = $("#category-filter").value;
  const visible = products.filter((item) => `${item.name} ${item.description} ${item.category}`.toLocaleLowerCase("es").includes(query) && (category === "all" || item.category === category));
  const grid = $("#product-grid");
  $("#catalog-status").textContent = visible.length ? `${visible.length} ${visible.length === 1 ? "producto" : "productos"}` : "No encontramos productos con esos filtros.";
  grid.innerHTML = visible.length ? visible.map((item) => `<article class="product-card"><div class="product-image"><img src="${safeText(item.image || "img/hero.webp")}" alt="${safeText(item.name)}" loading="lazy"><span class="category-chip">${safeText(item.category || "Producto")}</span></div><div class="product-body"><h3>${safeText(item.name)}</h3><p>${safeText(item.description || "Consulta los detalles de este producto.")}</p><div class="product-facts"><span>${safeText(availabilityLabel(item.available))}</span><span>${item.spiceLevel ? `Picante: ${safeText(item.spiceLevel)}` : "Picante: consultar"}</span></div><div class="product-facts"><span>Precio</span><span class="product-price">${safeText(priceLabel(item.price))}</span></div><a class="product-action" href="#contacto" data-product="${safeText(item.name)}">Consultar este producto <span aria-hidden="true">↗</span></a></div></article>`).join("") : `<p class="empty-state">Prueba otra búsqueda o categoría. Si necesitas ayuda, <a href="#contacto">escríbenos</a>.</p>`;
  grid.querySelectorAll("[data-product]").forEach((link) => link.addEventListener("click", () => {
    const subject = $("#contact-form [name=subject]"); subject.value = "Consulta de producto";
    $("#contact-form [name=message]").value = `Hola, quisiera consultar sobre ${link.dataset.product}.`;
  }));
}

async function loadProducts() {
  if (API_BASE) {
    try {
      const response = await fetch(`${API_BASE}/api/products`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("API no disponible");
      const result = await response.json();
      if (Array.isArray(result.products)) products = result.products;
    } catch {
      // El catálogo inicial viene de este archivo y la base del proyecto; no afirma disponibilidad o precio.
    }
  }
  const categories = [...new Set(products.map((item) => item.category).filter(Boolean))];
  $("#category-filter").insertAdjacentHTML("beforeend", categories.map((value) => `<option value="${safeText(value)}">${safeText(value)}</option>`).join(""));
  $("#catalog-status").textContent = `${products.length} productos · precios y disponibilidad por confirmar`;
  renderProducts();
}

$("#product-search").addEventListener("input", renderProducts);
$("#category-filter").addEventListener("change", renderProducts);
$("#year").textContent = new Date().getFullYear();
const menu = $(".menu-toggle"), nav = $("#site-nav");
menu.addEventListener("click", () => { const open = menu.getAttribute("aria-expanded") !== "true"; menu.setAttribute("aria-expanded", String(open)); menu.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú"); nav.classList.toggle("is-open", open); });
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => { nav.classList.remove("is-open"); menu.setAttribute("aria-expanded", "false"); menu.setAttribute("aria-label", "Abrir menú"); }));

const contactForm = $("#contact-form"), contactStatus = $("#contact-status");
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault(); contactStatus.removeAttribute("data-state");
  if (!contactForm.reportValidity()) { contactStatus.textContent = "Revisa los campos marcados antes de enviar."; contactStatus.dataset.state = "error"; return; }
  if (!API_BASE) { contactStatus.textContent = "El servicio de consultas aún no está configurado. Tu mensaje no se ha enviado."; contactStatus.dataset.state = "error"; return; }
  const submit = contactForm.querySelector("[type=submit]"); submit.disabled = true; submit.textContent = "Enviando…"; contactForm.classList.add("is-loading"); contactStatus.textContent = "Enviando tu consulta…";
  try {
    const response = await fetch(`${API_BASE}/api/contact`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(Object.fromEntries(new FormData(contactForm))) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "No se pudo enviar la consulta.");
    contactStatus.textContent = "¡Consulta enviada! Gracias por escribirnos."; contactStatus.dataset.state = "success"; contactForm.reset();
  } catch (error) { contactStatus.textContent = `${error.message} ${API_BASE ? "Intenta nuevamente más tarde." : "El servicio aún no está configurado."}`; contactStatus.dataset.state = "error"; }
  finally { submit.disabled = false; submit.innerHTML = 'Enviar consulta <span aria-hidden="true">↗</span>'; contactForm.classList.remove("is-loading"); }
});

const assistantForm = $("#assistant-form"), assistantResponse = $("#assistant-response");
assistantForm.addEventListener("submit", async (event) => {
  event.preventDefault(); const input = $("#assistant-question"), button = assistantForm.querySelector("[type=submit]"), question = input.value.trim();
  if (!question) { input.focus(); return; }
  if (!API_BASE) { assistantResponse.textContent = "La IA se activa cuando se configura el backend. Esta consulta no se envió."; assistantResponse.dataset.state = "error"; return; }
  button.disabled = true; assistantResponse.removeAttribute("data-state"); assistantResponse.textContent = "Pensando en tu antojo…";
  try {
    const response = await fetch(`${API_BASE}/api/assistant`, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ question }) });
    const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(result.error || "No se pudo obtener una respuesta.");
    assistantResponse.textContent = result.answer; input.value = "";
  } catch (error) { assistantResponse.textContent = `${error.message} ${API_BASE ? "Inténtalo de nuevo." : "La IA se activa al configurar el backend."}`; assistantResponse.dataset.state = "error"; }
  finally { button.disabled = false; }
});
$("#assistant-reset").addEventListener("click", () => { assistantResponse.textContent = "¡Hola! Pregúntame algo sobre nuestros productos. Solo responderé con información que tengamos disponible. 🌶️"; assistantResponse.removeAttribute("data-state"); $("#assistant-question").value = ""; $("#assistant-question").focus(); });
loadProducts();
