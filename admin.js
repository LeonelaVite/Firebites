const API_BASE = (window.FIREBITES_API_URL || "").replace(/\/$/, "");
const $ = (selector) => document.querySelector(selector);
const loginPanel = $("#login-panel"),
  dashboard = $("#dashboard"),
  dashboardStatus = $("#dashboard-status"),
  productForm = $("#product-form");
function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
function priceLabel(value) {
  return value == null
    ? "Precio por confirmar"
    : `$${Number(value).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function showDashboard(visible) {
  loginPanel.hidden = visible;
  dashboard.hidden = !visible;
}
async function api(path, options = {}) {
  if (!API_BASE)
    throw new Error(
      "El servicio de administración aún no está configurado. No se inició sesión.",
    );
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  if (response.status === 204) return {};
  const result = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(result.error || `Error del servidor (${response.status}).`);
  return result;
}
function setStatus(element, message, state = "error") {
  element.textContent = message;
  element.dataset.state = state;
}
async function loadAdminProducts() {
  const { products } = await api("/api/admin/products");
  const target = $("#admin-product-list");
  target.innerHTML = products.length
    ? products
        .map(
          (item) =>
            `<article class="admin-item"><img src="${escapeHtml(item.image)}" alt=""><div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(priceLabel(item.price))} · ${item.available === true ? "Disponible" : item.available === false ? "Agotado" : "Disponibilidad por confirmar"}</p></div><div class="admin-item-actions"><button type="button" data-edit="${escapeHtml(item.id)}">Editar</button><button type="button" data-delete="${escapeHtml(item.id)}">Eliminar</button></div></article>`,
        )
        .join("")
    : "<p>No hay productos todavía.</p>";
  target
    .querySelectorAll("[data-edit]")
    .forEach((button) =>
      button.addEventListener("click", () =>
        fillForm(products.find((item) => item.id === button.dataset.edit)),
      ),
    );
  target.querySelectorAll("[data-delete]").forEach((button) =>
    button.addEventListener("click", async () => {
      const product = products.find(
        (item) => item.id === button.dataset.delete,
      );
      if (
        !product ||
        !window.confirm(`¿Eliminar “${product.name}” del catálogo?`)
      )
        return;
      try {
        await api(`/api/admin/products/${encodeURIComponent(product.id)}`, {
          method: "DELETE",
        });
        setStatus(dashboardStatus, "Producto eliminado.", "success");
        await loadAdminProducts();
      } catch (error) {
        setStatus(dashboardStatus, error.message);
      }
    }),
  );
}
function fillForm(product) {
  for (const [key, value] of Object.entries({
    id: product.id,
    name: product.name,
    slug: product.slug,
    image: product.image,
    description: product.description,
    category: product.category,
    price: product.price ?? "",
    spiceLevel: product.spiceLevel || "",
    available: product.available == null ? "" : String(product.available),
  }))
    productForm.elements.namedItem(key).value = value;
  $("#editor-title").textContent = "Editar producto";
  $("#cancel-edit").hidden = false;
  productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
function resetForm() {
  productForm.reset();
  productForm.elements.id.value = "";
  $("#editor-title").textContent = "Añadir producto";
  $("#cancel-edit").hidden = true;
}
async function checkSession() {
  try {
    await api("/api/admin/session");
    showDashboard(true);
    await loadAdminProducts();
  } catch (error) {
    showDashboard(false);
    setStatus($("#login-status"), error.message);
  }
}
$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget,
    status = $("#login-status"),
    button = form.querySelector("button");
  if (!form.reportValidity()) return;
  button.disabled = true;
  status.textContent = "Verificando acceso…";
  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    form.reset();
    showDashboard(true);
    setStatus(dashboardStatus, "Sesión iniciada.", "success");
    await loadAdminProducts();
  } catch (error) {
    setStatus(status, error.message);
  } finally {
    button.disabled = false;
  }
});
productForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!productForm.reportValidity()) return;
  const values = Object.fromEntries(new FormData(productForm));
  values.price = values.price === "" ? null : Number(values.price);
  values.available =
    values.available === "" ? null : values.available === "true";
  const id = values.id;
  delete values.id;
  const button = productForm.querySelector("[type=submit]");
  button.disabled = true;
  try {
    await api(
      id
        ? `/api/admin/products/${encodeURIComponent(id)}`
        : "/api/admin/products",
      { method: id ? "PUT" : "POST", body: JSON.stringify(values) },
    );
    setStatus(
      dashboardStatus,
      id ? "Producto actualizado." : "Producto creado.",
      "success",
    );
    resetForm();
    await loadAdminProducts();
  } catch (error) {
    setStatus(dashboardStatus, error.message);
  } finally {
    button.disabled = false;
  }
});
$("#cancel-edit").addEventListener("click", resetForm);
$("#logout-button").addEventListener("click", async () => {
  try {
    await api("/api/admin/logout", { method: "POST" });
  } catch {}
  showDashboard(false);
  setStatus($("#login-status"), "Sesión cerrada.", "success");
});
checkSession();
