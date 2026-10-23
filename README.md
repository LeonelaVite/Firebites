# FireBites

Sitio estático de catálogo para un emprendimiento de snacks picantes y API Node.js + PostgreSQL para consultas, autenticación administrativa, gestión de productos y asistente IA.

## Estructura

- `index.html`, `style.css`, `app.js`, `api-config.js`: frontend de GitHub Pages.
- `admin.html`, `admin.css`, `admin.js`: interfaz privada; el backend controla cada permiso.
- `img/`: imágenes originales conservadas y versiones WebP optimizadas que usa la web.
- `backend/src/server.js`: endpoints HTTP y validaciones.
- `backend/src/db.js`: conexión, esquema y productos iniciales.
- `backend/.env.example`: nombres de configuración requeridos, sin credenciales.
- `.github/workflows/pages.yml`: publicación automática de los archivos estáticos desde `main`.
- `netlify.toml` y `scripts/build-static.js`: paquete estático alternativo para Netlify; excluye los fuentes del backend.
- `docs/`: auditoría y guía para la defensa.

## Ejecutar localmente

Requisitos: Node.js 20 o posterior y PostgreSQL. Primero crea una base de datos local llamada `firebites`.

```powershell
cd backend
Copy-Item .env.example .env
pnpm install
pnpm run hash-password
```

Copia el hash que muestra el último comando dentro de `ADMIN_PASSWORD_HASH` en `backend/.env`. Configura `DATABASE_URL`, `ADMIN_EMAIL`, `FRONTEND_ORIGIN=http://127.0.0.1:5500`, `DB_SSL=false` y deja `NODE_ENV=development`. Opcionalmente agrega `OPENAI_API_KEY` y un `OPENAI_MODEL` admitido por la cuenta.

Inicia la API:

```powershell
npm run dev
```

En otra terminal, desde la raíz, sirve el frontend en `http://127.0.0.1:5500` (por ejemplo con Live Server). `api-config.js` usa la misma URL cuando está vacío; para probar desde Live Server en distinto puerto, edítalo temporalmente a `http://localhost:3000` y restaura el archivo antes de publicar. La API permite solo el origen exacto indicado por `FRONTEND_ORIGIN`.

## Servicios necesarios para desplegar

### Netlify (alternativa estática)

El PDF requiere GitHub Pages; Netlify no reemplaza ese entregable. Si también deseas la URL de Netlify, crea/importa el proyecto desde GitHub y conecta el repositorio `LeonelaVite/Firebites`. Netlify ejecutará `node scripts/build-static.js` y publicará `dist/`; el paquete solo contiene los HTML, CSS, JavaScript, `api-config.js` generado y `img/`. Define `FIREBITES_API_URL` en las variables de entorno de build del sitio. Luego publica desde el panel y confirma que el deploy termine correctamente. Este deploy sirve el frontend: la API Express y PostgreSQL todavía deben desplegarse por separado.

Netlify configura build y carpeta de publicación desde `netlify.toml`; el código también puede empaquetarse desde el panel como un sitio importado desde GitHub. [La documentación de Netlify explica esas opciones](https://docs.netlify.com/build/configure-builds/overview/) y [la conexión de un repositorio existente](https://docs.netlify.com/start/quickstarts/deploy-from-repository/).

1. Despliega `backend/` en un servicio Node.js y crea una base de datos PostgreSQL administrada. Configura `DATABASE_URL`, `DB_SSL=true`, `NODE_ENV=production`, `PORT`, `FRONTEND_ORIGIN` (el origen exacto de Pages, sin ruta), `ADMIN_EMAIL` y `ADMIN_PASSWORD_HASH` como variables del servicio. Usa `pnpm install --frozen-lockfile` y `pnpm start` como instalación e inicio. Mantén la URL de la API en HTTPS.
2. Genera el hash localmente con `pnpm run hash-password`, sin poner la contraseña en el repositorio o en el comando. Guarda el hash en las variables del servicio.
3. En el repositorio abre **Settings → Pages → Build and deployment → Source** y selecciona **GitHub Actions**. Esto requiere permisos de administrador o mantenedor del repositorio. La primera ejecución ya se intentó y GitHub respondió que el sitio Pages no está habilitado/configurado; por eso no se publicó.
4. Agrega la variable de repositorio `FIREBITES_API_URL` con la URL pública HTTPS de la API. El workflow solo escribe esa dirección pública en `api-config.js`; no es una clave.
5. En **Actions → Deploy FireBites to GitHub Pages**, ejecuta **Run workflow** después de guardar la configuración. Espera que termine en verde; la URL del entorno `github-pages` permitirá comprobar la publicación.
6. Define en el backend el origen de Pages (solo esquema y host; Pages de proyecto usa el host `github.io`). Despliega de nuevo y comprueba login, catálogo, formulario y asistente desde la URL publicada. Algunos navegadores restringen cookies de terceros; si ocurre, usa un dominio propio común para el frontend y el API (mismo sitio registrable) o aloja el frontend en el mismo proveedor del backend.
7. Para IA, configura una clave válida de OpenAI como `OPENAI_API_KEY` solo en el backend y un modelo disponible en `OPENAI_MODEL`. Sin esa clave el endpoint devuelve un error de servicio no configurado y la interfaz lo informa.

PostgreSQL almacena productos, consultas y sesiones de administración. El formulario confirma solo si la base acepta la inserción. El asistente consulta el catálogo actual en cada pregunta. La autenticación utiliza contraseña bcrypt, cookie HttpOnly, sesión con expiración en PostgreSQL, límite de intentos y controles de origen. El backend no envía correos automáticamente: las consultas quedan guardadas en `contact_messages`; para respuesta por email debe añadirse y configurar un proveedor de correo.

## Pruebas

Las comprobaciones estáticas y sus límites se documentan en `docs/AUDITORIA.md`. No se debe declarar operativa una conexión real hasta desplegar y configurar PostgreSQL, origen CORS, credenciales del administrador y, para IA, la clave de proveedor.
