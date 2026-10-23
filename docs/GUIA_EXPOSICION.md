# Guía de exposición: FireBites

## 1. Presentación y objetivo

«FireBites es un emprendimiento digital de snacks dulces con un toque picante. Su sitio permite conocer el catálogo, consultar productos y, cuando la infraestructura está configurada, enviar consultas, administrar el catálogo y preguntar a un asistente basado en IA.»

Explica primero qué problema resuelve: la información del producto está en un solo lugar y el visitante puede saber qué datos están confirmados. No digas que ya vende o recibe pedidos si el negocio no ha conectado esos procesos.

## 2. Problema o necesidad

El sitio inicial mostraba productos y precios, pero no ofrecía una búsqueda ni un canal funcional de contacto; los botones de compra no realizaban una compra. La versión nueva evita esa promesa falsa: el botón consulta un producto y el precio y disponibilidad aparecen como pendientes hasta que una administradora los confirme.

## 3. Tecnologías y responsabilidades

- **HTML** (`index.html`, `admin.html`): estructura semántica, formularios y secciones.
- **CSS** (`style.css`, `admin.css`): identidad visual, distribución adaptable, estados de foco y movimiento reducido.
- **JavaScript del navegador** (`app.js`, `admin.js`): filtra catálogo, valida y envía formularios, muestra respuestas del API y controla el menú. No contiene contraseñas ni claves de IA.
- **Node.js y Express** (`backend/src/server.js`): endpoints, validación, autenticación, permisos, límites de solicitudes e integración de IA.
- **PostgreSQL** (`backend/src/db.js`): productos, mensajes y sesiones con expiración.
- **Git/GitHub Actions**: historial del código y publicación estática de Pages.

No migramos a React: el proyecto que existía era HTML/CSS/JavaScript de pocas páginas. Los requisitos no exigen React y migrar una interfaz pequeña no agrega valor suficiente frente a mantener la tecnología y organizar el backend aparte. Si la aplicación crece a muchas vistas y estados compartidos, esa decisión puede revisarse.

## 4. Carpetas

`img/` conserva PNG originales y versiones WebP optimizadas usadas por el catálogo y el hero. Los archivos principales del frontend quedan en la raíz para que Pages sirva directamente `index.html`. `backend/` se despliega por separado y `docs/` contiene auditoría y esta guía. `.github/workflows/pages.yml` configura la publicación cuando hay cambios en `main`.

## 5. Frontend y backend

El navegador pide productos a `GET /api/products`. La dirección de API se lee de `api-config.js`; vacía apunta al mismo origen en local. En Pages, el workflow escribe la URL del backend. La API solo permite el origen configurado. Las cookies de sesión entre dominios pueden ser bloqueadas por algunos navegadores; para producción conviene usar un dominio propio común o alojar frontend y API bajo el mismo sitio.

El formulario de contacto envía una solicitud `POST /api/contact`. El servidor valida de nuevo los datos e inserta en PostgreSQL; el navegador confirma el envío solo si la respuesta es exitosa. Este mecanismo guarda la consulta, pero no manda email por sí solo.

## 6. Catálogo y formulario

Los productos tienen nombre, descripción, categoría e imagen; precio, disponibilidad y nivel de picante pueden ser nulos. Las tarjetas indican «por confirmar» para no inventar información. La búsqueda compara nombre, categoría y descripción. La selección de producto prellena el motivo y el texto inicial de la consulta; el usuario aún puede editarlo.

El navegador valida campos requeridos y formato de correo con HTML; Express vuelve a validar porque los controles de navegador se pueden eludir. Durante la solicitud se deshabilita el botón; un error de red o servidor nunca produce un mensaje de éxito.

## 7. Login y panel

La ruta `admin.html` es accesible como archivo, pero eso no concede permisos. Cada operación de catálogo pasa por `requireAdmin` en el servidor. El login compara el password con un hash bcrypt creado en una terminal, genera un token aleatorio, guarda su hash en PostgreSQL y envía el token como cookie `HttpOnly`. Se vence a las ocho horas. Para producción el cookie es `Secure` y `SameSite=None`, por eso frontend y backend deben usar HTTPS. El origen exacto también se comprueba en operaciones que modifican datos.

El panel permite crear, editar y borrar productos. La eliminación pide confirmación. El servidor valida cada campo y solo entonces ejecuta SQL con parámetros. `available` puede ser `true`, `false` o `null` (por confirmar).

## 8. Inteligencia artificial

El navegador manda una pregunta a `POST /api/assistant`. El servidor obtiene el catálogo actualizado, construye instrucciones que prohíben completar datos desconocidos y llama a la API de OpenAI. La clave vive en `OPENAI_API_KEY` del backend, nunca en el código público. Si falta la clave, el modelo falla o no hay información, el frontend muestra un error o una respuesta limitada. La IA no procesa pedidos.

## 9. Git y GitHub

Git registra cambios locales en commits; GitHub hospeda el repositorio y Pages publica el frontend. Al inicio de esta auditoría se verificaron dos commits y la referencia remota `origin`. Al finalizar se debe revisar `git log` para el total real. No se deben inventar commits para inflar la cifra de 15; cualquier faltante se completa con trabajo real en etapas: pruebas de contrato, manejo y consulta de mensajes, monitoreo, despliegue inicial verificado y ajustes posteriores de producción.

## 10. Publicación y mantenimiento

Pages ejecutará el workflow al actualizar `main` una vez habilitada la fuente **Settings → Pages → Build and deployment → GitHub Actions**. El primer run devolvió `404 Not Found` porque Pages aún no está configurado; su job no subió artefacto y la web no está publicada. El artefacto solo incluye el frontend estático; el backend y PostgreSQL se configuran aparte. No se considera publicada hasta que el job termine en verde y se pruebe la URL reportada. Rotar contraseñas o claves implica actualizar el servicio donde viven y desplegarlo nuevamente.

## 11. Dificultades y decisiones

- Los precios escritos en la versión anterior no tenían evidencia comercial, así que ahora son nulos y visibles como pendientes.
- GitHub Pages no ejecuta Node ni protege un admin. Se separaron frontend/API y la autorización vive en servidor.
- No había API de correo, base, admin ni IA. Se preparó su integración; falta configurar los servicios y credenciales privadas.
- Se conservó HTML/CSS/JS para reducir migración y mantener simple el aprendizaje.

## 12. Conclusiones y mejoras futuras

El sitio ahora describe acciones reales y tiene un diseño adaptable. El backend propuesto crea la base técnica para persistencia, administración y respuestas IA, pero estas funciones requieren despliegue/configuración antes de declararse operativas. Próximos pasos: confirmar precios y datos del negocio, configurar PostgreSQL, desplegar API, elegir proveedor de correo para avisos, probar todas las rutas en producción, evaluar accesibilidad con usuarios y registrar los hitos auténticos restantes.

## Preguntas típicas de defensa

**¿Por qué usaste `null` para precio?** Porque el código anterior mostraba montos pero no existe un precio confirmado en los archivos. `null` significa desconocido y la interfaz lo presenta como «por confirmar».

**¿Un usuario puede abrir `admin.html`?** Sí, el HTML no es secreto. La seguridad está en el servidor: cada ruta `/api/admin/...` requiere una cookie válida asociada a una sesión en base de datos.

**¿Qué hace `HttpOnly`?** Impide que JavaScript de la página lea el valor de la cookie; el navegador sí la envía al API. En producción usamos HTTPS para que `Secure` proteja su transporte.

**¿Qué pasa si el navegador manipula el precio?** El backend vuelve a validar y usa sentencias SQL parametrizadas. El frontend no es una frontera de seguridad.

**¿Dónde se guarda el formulario?** En `contact_messages` de PostgreSQL. La API responde 201 después de guardar. Aún no manda notificación por correo.

**¿La IA puede inventar ingredientes?** Se le entrega el catálogo actual e instrucciones para no inventar. Aun así, un modelo puede equivocarse; por eso los datos comerciales deben revisarse y no se debe tratar la respuesta como fuente definitiva.

**¿Por qué no React?** El sitio inicial tiene una página pública y un panel pequeño. HTML/CSS/JS ya cubren estas vistas y reducen cambios innecesarios. React tendría más sentido si aumentan vistas, interacciones y componentes compartidos.

**¿Qué incluye GitHub Pages?** Solo sirve los archivos estáticos. El API Node y PostgreSQL se alojan en servicios separados; Pages no oculta una API key ni ejecuta la autenticación.

**¿Cómo probar que el formulario funciona?** Configurar PostgreSQL y el backend, enviar datos válidos y comprobar respuesta exitosa y fila en `contact_messages`; luego probar datos inválidos y desconectar el API para comprobar los mensajes de error.

**¿Cómo se evita confirmar antes de guardar?** `app.js` espera la respuesta HTTP y solo muestra éxito con un status satisfactorio. Si el API falla, muestra el mensaje devuelto o error de conexión.
