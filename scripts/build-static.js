const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const publicFiles = ["index.html", "style.css", "app.js", "admin.html", "admin.css", "admin.js"];

function buildStatic(options = {}) {
  const outputDir = options.outputDir || path.join(root, "dist");
  const apiUrl = options.apiUrl ?? process.env.FIREBITES_API_URL ?? "";
  fs.mkdirSync(outputDir, { recursive: true });
  for (const file of publicFiles) fs.copyFileSync(path.join(root, file), path.join(outputDir, file));
  fs.cpSync(path.join(root, "img"), path.join(outputDir, "img"), { recursive: true, force: true });
  fs.writeFileSync(path.join(outputDir, "api-config.js"), `window.FIREBITES_API_URL = ${JSON.stringify(apiUrl)};\n`, "utf8");
  return outputDir;
}

if (require.main === module) {
  const outputDir = buildStatic();
  console.log(`Static FireBites files ready in ${path.relative(root, outputDir) || "."}`);
}

module.exports = { buildStatic };
