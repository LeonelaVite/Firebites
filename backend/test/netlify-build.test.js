const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { buildStatic } = require("../../scripts/build-static");

test("Netlify bundle contains the static app, cart, service config and excludes backend source", () => {
  const outputDir = path.resolve(__dirname, "../../dist");
  buildStatic({
    outputDir,
    apiUrl: "https://api.example.test",
    whatsappNumber: "593991234567",
  });
  for (const file of [
    "index.html",
    "style.css",
    "app.js",
    "cart.js",
    "admin.html",
    "admin.css",
    "admin.js",
    "api-config.js",
    "img/hero.webp",
  ]) {
    assert.ok(fs.existsSync(path.join(outputDir, file)), `Missing ${file}`);
  }
  assert.equal(fs.existsSync(path.join(outputDir, "backend")), false);
  assert.match(
    fs.readFileSync(path.join(outputDir, "api-config.js"), "utf8"),
    /https:\/\/api\.example\.test/,
  );
  assert.match(
    fs.readFileSync(path.join(outputDir, "api-config.js"), "utf8"),
    /593991234567/,
  );
});
