const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");

test("internal navigation links point to existing sections", () => {
  const ids = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]),
  );
  const links = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
  assert.ok(links.length >= 5);
  for (const target of links) assert.ok(ids.has(target), `Missing #${target}`);
});

test("local assets and frontend scripts exist", () => {
  const assets = [
    ...html.matchAll(/(?:src|href)="((?:img|[\w-]+\.(?:css|js))[^\"]*)"/g),
  ].map((match) => match[1]);
  assert.ok(assets.length >= 5);
  for (const asset of assets)
    assert.ok(fs.existsSync(path.join(root, asset)), `Missing ${asset}`);
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  const productImages = [...app.matchAll(/image: "(img\/[^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(productImages.length, 3);
  for (const image of productImages)
    assert.ok(fs.existsSync(path.join(root, image)), `Missing ${image}`);
});

test("confirmed product prices and footer author are present", () => {
  const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
  assert.doesNotMatch(html, /\$2\.50|\$4\.50|\$1\.75/);
  assert.match(app, /Precio por confirmar/);
  assert.match(app, /id: "gomitas-picantes"[\s\S]*?price: 1\.5/);
  assert.match(app, /id: "algodon-picante"[\s\S]*?price: 1\.35/);
  assert.match(app, /id: "paletas-enchiladas"[\s\S]*?price: 1\.0/);
  assert.match(html, /FireBites · Leonela Vite/);
});
