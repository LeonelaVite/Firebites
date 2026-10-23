# Auditoría de FireBites

Revisión del checkout local antes de cambios, comparado con «Proyecto Final Avanzado». La consulta local mostró la rama `main`, dos commits (`1ebbd52`, `a114711`) y remoto configurado `origin`. La lectura de `git ls-remote` confirmó que GitHub apuntaba a `a114711` al momento de la revisión; esto no confirma el estado de Pages.

| Requisito | Estado inicial | Evidencia encontrada | Problema detectado | Solución aplicada o pendiente |
|---|---|---|---|---|
| Marca y home | Parcialmente implementado | `index.html` tenía hero y marca; `style.css` tenía paleta | Enlaces y CTA con `#`; sin presentación, contacto o footer completos | Home rehecha con secciones, navegación real y CTA funcionales |
| Catálogo | Parcialmente implementado | Tres productos en HTML e imágenes locales | Datos repetidos; precios 2.50, 4.50 y 1.75 sin fuente verificable; botones sin acción | Catálogo único en `app.js`; búsqueda, categoría y consulta; precio/disponibilidad nulos hasta confirmar |
| Formulario real | Pendiente | No había formulario | Sin persistencia ni respuesta de servicio | Formulario validado y endpoint que persiste en PostgreSQL; requiere backend configurado |
| Admin con login | Pendiente | No había rutas/API ni login | Sin autorización ni persistencia | UI, bcrypt, sesión HttpOnly con expiración almacenada y CRUD; verificación real requiere PostgreSQL y env |
| IA personalizada | Pendiente | No había integración | Sin modelo ni catálogo como contexto | Endpoint consulta datos actuales y llama API de Responses; clave solo en backend; requiere credencial y modelo disponible |
| Frontend/backend y datos | Pendiente | Solo HTML, CSS y JS plano; sin dependencias | No existían API o datos persistentes | Frontend estático conservado y API Node/PostgreSQL separada |
| UX responsive/accesibilidad | Parcialmente implementado | Flexbox/tarjetas y animación en `style.css` | Hero a 750px, sin menú adaptable ni estados ni foco | CSS adaptable, menú móvil, contraste, foco, `prefers-reduced-motion`, estados y semántica |
| Git y 15 commits | Parcialmente implementado | Dos commits al inicio, remoto GitHub en configuración local | Menos de 15 commits verificados | Registrar solo cambios funcionales reales; no crear commits vacíos. El historial final se informa al cierre |
| GitHub Pages | No verificable al inicio; despliegue intentado al cierre | Workflow agregado y el primer run ejecutó con el commit nuevo | GitHub devolvió `404 Not Found` al buscar el sitio Pages; configuración y publicación no existen todavía | Un administrador/mantenedor debe elegir **Settings → Pages → Build and deployment → Source → GitHub Actions**. Después se vuelve a ejecutar el workflow |
| Netlify | No solicitado inicialmente; preparado después | `netlify.toml` y `scripts/build-static.js` generan un paquete `dist/` que excluye el backend | No se ha conectado el repositorio a una cuenta Netlify ni se ha publicado | La dueña debe importar el repositorio en Netlify, añadir la URL pública de la API y confirmar el primer deploy |
| Responsive/publicado y errores de navegador | No verificable inicialmente | No había runner/browser ni servicios | No existe versión desplegada comprobada ni evidencia de consola | Revisión estática posible; pruebas con browser/red requieren servir el frontend y configurar servicios |
| Instrucciones de entrega y exposición | Pendiente | Sin documentación del proyecto | No había guía para instalar, configurar o defenderlo | README y guía de exposición añadidos |

Al cierre se crearon 17 commits nuevos con cambios funcionales/documentales separados; junto con los dos commits originales, el historial local contiene 19 commits. Se subieron a `main` en GitHub.

## Verificaciones realizadas

- Inspección de todos los archivos del checkout, dependencias (no había `package.json`), recursos gráficos, referencias HTML, `.git`, rama/remoto e historial inicial.
- Extracción de texto del documento PDF, 12 páginas; la pauta pide home, catálogo, formulario real, admin, IA, separación de capas, UX responsive, Git con 15 commits y GitHub Pages.
- `main` se subió a GitHub en `7864325`; el primer run de Actions procesó ese mismo SHA (`7864325443bf4d293c92024d360337e148e9ef05`).
- Run `40040297902` finalizó en `failure`: checkout pasó, `actions/configure-pages` falló con `Get Pages site failed: Not Found`, y los pasos de artefacto/despliegue se omitieron. No hay URL publicada verificada. El run está enlazado en [GitHub Actions](https://github.com/LeonelaVite/Firebites/actions/runs/40040297902).
- `node --check` pasa en JavaScript del frontend y backend. `pnpm test` pasa 9 pruebas automatizadas (validaciones de producto/contacto, referencias de archivos y paquete de Netlify).
- La inspección visual del sitio no pudo abrir el archivo local: la política del navegador bloqueó el protocolo `file:` y no se eludió esa restricción. Se inspeccionaron las imágenes directamente. El hero usa transparencia preservada en WebP lossless; verificar su composición final dentro del sitio requiere una captura en navegador.
- Cuatro PNG de contenido sumaban 10,063,459 bytes; las versiones WebP suman 2,349,890 bytes (reducción aproximada del 77%). Los PNG originales se conservan.
- No hay PostgreSQL instalado/configurado; por eso no pueden probarse inicio del servidor, persistencia runtime, autenticación real, CRUD, envío persistente, proveedor IA o rutas de producción.

## Priorización

1. Conservar la web existente y hacer claras las acciones reales.
2. Centralizar catálogo y no afirmar datos comerciales desconocidos.
3. Preparar una API con controles de autorización y almacenamiento real.
4. Automatizar publicación estática y documentar variables de servicio.
5. Verificar build, UI, endpoints y despliegues después de configurar infraestructura.
